import type { ApiSuccessResponse, Match } from "@chess-now/api";
import { Scope } from "@chess-now/api";
import { eq } from "drizzle-orm";
import { glicko2 } from "glicko2-lite";
import {
	BadRequestError,
	ConflictError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@/api/errors";
import {
	endMatch,
	getDecayedStats,
	getMatchInfo,
	hasScope,
} from "@/api/helper";
import { publishToSubscriber } from "@/api/ws-events";
import { auth } from "@/lib/auth";
import { db, schemas, secondaryStorage } from "@/lib/database";

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

	if (!match.activeDrawRequest)
		throw new ConflictError("There isn't any active draw requests");

	const playerColor: "white" | "black" =
		session.user.id === match.whiteId ? "white" : "black";
	if (match.activeDrawRequest === playerColor)
		throw new ConflictError("You can't deny your own request.");

	await secondaryStorage.delete(`match_${mId}`);

	const whiteStats = await getDecayedStats(match.whitePlayer);
	const blackStats = await getDecayedStats(match.blackPlayer);

	const newWhite = glicko2(whiteStats.rating, whiteStats.rd, whiteStats.vol, [
		[blackStats.rating, blackStats.rd, 0.5],
	]);
	const newBlack = glicko2(blackStats.rating, blackStats.rd, blackStats.vol, [
		[whiteStats.rating, whiteStats.rd, 0.5],
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

	const whiteRatingDiff = Math.round(newWhite.rating - whiteStats.rating);
	const blackRatingDiff = Math.round(newBlack.rating - blackStats.rating);

	const finalMatch = await endMatch(match.id, {
		status: "draw",
		endReason: "draw",
		whiteRatingDiff,
		blackRatingDiff,
	});

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
		data: match,
	};
}

export default { run };
