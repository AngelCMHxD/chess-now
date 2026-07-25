import type { ApiSuccessResponse, Match, Move } from "@chess-now/api";
import { Scope } from "@chess-now/api";
import { Chess, type Move as ChessMove } from "chess.js";
import { eq } from "drizzle-orm";
import { glicko2 } from "glicko2-lite";
import z from "zod";
import {
	BadRequestError,
	ConflictError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
	UnprocessableContentError,
} from "@/api/errors";
import { getMatchInfo, hasScope, updateBoard } from "@/api/helper";
import { publishToSubscriber } from "@/api/ws-events";
import { auth } from "@/lib/auth";
import { db, schemas, secondaryStorage } from "@/lib/database";

export const bodyType = z.object({
	move: z.string({
		error: "'body' is required and is a string containing the move in SAN notation",
	}),
});

const getDecayedStats = async (player: {
	id: string;
	rating: number;
	rd: number;
	vol: number;
}) => {
	const lastMatch = await db.query.matches.findFirst({
		where: (matches, { or, eq, ne, and }) =>
			and(
				or(
					eq(matches.whiteId, player.id),
					eq(matches.blackId, player.id),
				),
				ne(matches.status, "active"),
			),
		orderBy: (matches, { desc }) => desc(matches.finishedAt),
	});

	let { rating, rd, vol } = player;

	if (lastMatch?.finishedAt) {
		const weekInMs = 1000 * 60 * 60 * 24 * 7;
		const weeksElapsed = Math.floor(
			(Date.now() - lastMatch.finishedAt.getTime()) / weekInMs,
		);

		// this is to simulate an rd increase over time
		for (let i = 0; i < weeksElapsed; i++) {
			const decayed = glicko2(rating, rd, vol, []);
			rating = decayed.rating;
			rd = decayed.rd;
			vol = decayed.vol;
		}
	}

	return { rating, rd, vol };
};

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

	if (!hasScope(session, Scope.Matches)) throw new ForbiddenError();

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
	if (roles[session.user.id] !== turnBefore)
		throw new ConflictError("It's not your turn");

	let move: ChessMove;

	try {
		move = chess.move(body.move);
	} catch (_e) {
		throw new UnprocessableContentError("Invalid move");
	}

	chess.setHeader("Event", "Casual");
	chess.setHeader("Site", process.env.NEXT_PUBLIC_BASE_URL ?? "?");
	chess.setHeader(
		"Date",
		new Date(match.createdAt)
			.toISOString()
			.split("T")[0]
			.replace(/-/g, "."),
	);
	chess.setHeader("Round", "1");
	chess.setHeader("White", match.whitePlayer.username);
	chess.setHeader("Black", match.blackPlayer.username);

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

	publishToSubscriber(`match:${match.id}`, "match:board_move", undefined, {
		match: matchAfterMove,
		move: moveInfo,
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

		await secondaryStorage.delete(`match_${mId}`);

		let outcomeWhite = 0.5;
		let outcomeBlack = 0.5;
		if (status === "white_won") {
			outcomeWhite = 1;
			outcomeBlack = 0;
		} else if (status === "black_won") {
			outcomeWhite = 0;
			outcomeBlack = 1;
		}

		const whiteStats = await getDecayedStats(match.whitePlayer);
		const blackStats = await getDecayedStats(match.blackPlayer);

		const newWhite = glicko2(
			whiteStats.rating,
			whiteStats.rd,
			whiteStats.vol,
			[[blackStats.rating, blackStats.rd, outcomeWhite]],
		);
		const newBlack = glicko2(
			blackStats.rating,
			blackStats.rd,
			blackStats.vol,
			[[whiteStats.rating, whiteStats.rd, outcomeBlack]],
		);

		await Promise.all([
			db
				.update(schemas.user)
				.set(newWhite)
				.where(eq(schemas.user.id, match.whitePlayer.id)),
			db
				.update(schemas.user)
				.set(newBlack)
				.where(eq(schemas.user.id, match.blackPlayer.id)),
		]);

		match.whitePlayer.rating = newWhite.rating;
		match.whitePlayer.rd = newWhite.rd;
		match.whitePlayer.vol = newWhite.vol;

		match.blackPlayer.rating = newBlack.rating;
		match.blackPlayer.rd = newBlack.rd;
		match.blackPlayer.vol = newBlack.vol;

		const whiteDiff = Math.round(newWhite.rating - whiteStats.rating);
		const blackDiff = Math.round(newBlack.rating - blackStats.rating);

		const finalMatch = (
			await db
				.update(schemas.matches)
				.set({
					status,
					endReason,
					finishedAt: new Date(),
					fen: moveInfo.fen.after,
					pgn: moveInfo.pgn.after,
					whiteRatingDiff: whiteDiff,
					blackRatingDiff: blackDiff,
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

		publishToSubscriber(`match:${match.id}`, "match:game_over", undefined, {
			match: finalMatch,
			lastMove: moveInfo,
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
