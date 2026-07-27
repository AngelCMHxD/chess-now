import type { ApiSuccessResponse, Match } from "@chess-now/api";
import { Scope } from "@chess-now/api";
import { Chess } from "chess.js";
import { eq } from "drizzle-orm";
import { glicko2 } from "glicko2-lite";
import {
	BadRequestError,
	ConflictError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@/api/errors";
import { endMatch, getMatchInfo, hasScope } from "@/api/helper";
import { publishToSubscriber } from "@/api/ws-events";
import { auth } from "@/lib/auth";
import { db, schemas } from "@/lib/database";

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
): Promise<ApiSuccessResponse<Match>> {
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

	if (match.activeDrawRequest)
		throw new ConflictError(
			"There is an active draw request. Accept/Deny it before forfeiting.",
		);

	const chess = new Chess();
	if (!match.pgn) {
		chess.load(match.fen);
	} else {
		chess.loadPgn(match.pgn);
	}

	const status =
		session.user.id === match.whiteId ? "black_won" : "white_won";

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

	const newWhite = glicko2(whiteStats.rating, whiteStats.rd, whiteStats.vol, [
		[blackStats.rating, blackStats.rd, outcomeWhite],
	]);
	const newBlack = glicko2(blackStats.rating, blackStats.rd, blackStats.vol, [
		[whiteStats.rating, whiteStats.rd, outcomeBlack],
	]);

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

	const finalMatch = await endMatch(mId, {
		status,
		endReason: "forfeit",
		fen: chess.fen(),
		pgn: chess.pgn(),
		whiteRatingDiff: whiteDiff,
		blackRatingDiff: blackDiff,
	});
	finalMatch.whitePlayer = match.whitePlayer;
	finalMatch.blackPlayer = match.blackPlayer;

	players.forEach((playerId) => {
		publishToSubscriber(`match:${playerId}`, "match:game_over", playerId, {
			match: finalMatch,
		});
	});

	publishToSubscriber(`match:${match.id}`, "match:game_over", undefined, {
		match: finalMatch,
	});

	return {
		success: true,
		data: finalMatch,
	};
}

export default { run };
