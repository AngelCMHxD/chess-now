import type { ApiSuccessResponse, Match, Move } from "@chess-now/api";
import { Scope } from "@chess-now/api";
import { Chess, type Move as ChessMove } from "chess.js";
import { eq } from "drizzle-orm";
import z from "zod";
import {
	BadRequestError,
	ConflictError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
	UnprocessableContentError,
} from "@/api/errors";
import { getMatchInfo, updateBoard } from "@/api/helper";
import { publishToSubscriber } from "@/api/ws-events";
import { auth } from "@/lib/auth";
import { db, schemas } from "@/lib/database";

export const bodyType = z.object({
	move: z.string({
		error: "'body' is required and is a string containing the move in SAN notation",
	}),
});

export async function run(
	headers: Headers,
	matchId: string,
	body: z.infer<typeof bodyType>,
): Promise<
	ApiSuccessResponse<{
		move: Move;
		match: Match;
	}>
> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	if (
		session.session.scopes &&
		!session.session.scopes.includes(Scope.Matches)
	)
		throw new ForbiddenError();

	const mId = parseInt(matchId, 10);

	if (Number.isNaN(mId)) throw new BadRequestError();

	const match = await getMatchInfo(mId);

	if (!match) throw new NotFoundError("Match Not Found");

	const players = [match.whiteId, match.blackId];

	if (!players.includes(session.user.id) || match.status !== "active")
		throw new ForbiddenError();

	const roles = {
		[match.whiteId]: "w",
		[match.blackId]: "b",
	};

	const chess = new Chess();
	if (!match.pgn) {
		chess.load(match.fen);
	} else {
		chess.loadPgn(match.pgn);
	}

	const turnBefore = chess.turn();
	const pgnBefore = chess.pgn();
	if (roles[session.user.id] !== turnBefore) throw new ConflictError();

	let move: ChessMove;

	try {
		move = chess.move(body.move);
	} catch (_e) {
		throw new UnprocessableContentError();
	}

	const matchAfterMove = (await updateBoard(match.id, chess)) as Match;
	matchAfterMove.whitePlayer = match.whitePlayer;
	matchAfterMove.blackPlayer = match.blackPlayer;

	const pgnAfter = chess.pgn();
	const turnAfter = chess.turn();

	const moveInfo = {
		players: {
			whiteId: matchAfterMove.whiteId,
			blackId: matchAfterMove.blackId,
		},
		turn: {
			before: turnBefore,
			after: turnAfter,
		},
		pgn: {
			before: pgnBefore,
			after: pgnAfter,
		},
		fen: {
			before: move.before,
			after: move.after,
		},
		san: move.san,
		lan: move.lan,
		piece: move.piece,
	};

	players.forEach((playerId) => {
		publishToSubscriber(`match:${playerId}`, "match:board_move", playerId, {
			match: matchAfterMove,
			move: moveInfo,
		});
	});

	if (chess.isGameOver()) {
		let endReason: (typeof schemas.matchEndReason.enumValues)[number] =
			"draw";
		let status: (typeof schemas.matchStatus.enumValues)[number] = "draw";

		if (chess.isCheckmate()) {
			endReason = "checkmate";
			status = turnBefore === "w" ? "white_won" : "black_won";
		} else if (chess.isStalemate()) endReason = "stalemate";
		else if (chess.isInsufficientMaterial())
			endReason = "insufficient-material";
		else if (chess.isDrawByFiftyMoves()) endReason = "50-moves";

		const finalMatch = (
			await db
				.update(schemas.matches)
				.set({
					status,
					endReason,
				})
				.where(eq(schemas.matches.id, mId))
				.returning()
		)[0] as Match;
		finalMatch.whitePlayer = match.whitePlayer;
		finalMatch.blackPlayer = match.blackPlayer;

		players.forEach((playerId) => {
			publishToSubscriber(
				`match:${playerId}`,
				"match:game_over",
				playerId,
				{
					match: finalMatch,
					lastMove: moveInfo,
				},
			);
		});
	}

	return {
		success: true,
		data: {
			move: moveInfo,
			match: matchAfterMove,
		},
	};
}

export default { bodyType, run };
