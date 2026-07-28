import type { ApiSuccessResponse, Match } from "@chess-now/api";
import { Scope } from "@chess-now/api";
import {
	BadRequestError,
	ConflictError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@/api/errors";
import {
	getMatchInfo,
	hasScope,
	removePrivateUserFields,
	updateMatch,
} from "@/api/helper";
import { publishToSubscriber } from "@/api/ws-events";
import { auth } from "@/lib/auth";

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

	let match = await getMatchInfo(mId);
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

	match = await updateMatch(mId, {
		activeDrawRequest: null,
	});

	const otherPlayer =
		playerColor === "white" ? match.blackPlayer : match.whitePlayer;

	publishToSubscriber(
		`match:${otherPlayer.id}`,
		"match:draw_deny",
		otherPlayer.id,
		{
			requestedBy: otherPlayer,
			deniedBy: removePrivateUserFields(session.user),
			match: match,
		},
	);

	publishToSubscriber(`match:${match.id}`, "match:draw_deny", undefined, {
		requestedBy: otherPlayer,
		deniedBy: removePrivateUserFields(session.user),
		match,
	});

	return {
		success: true,
		data: match,
	};
}

export default { run };
