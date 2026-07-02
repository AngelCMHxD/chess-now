import type { ApiSuccessResponse, Challenge, Match } from "@chess-now/api";
import { Scope } from "@chess-now/api";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@/api/errors";
import {
	acceptChallenge,
	getChallengeInfo,
	removePrivateUserFields,
} from "@/api/helper";
import { publishToSubscriber } from "@/api/ws-events";
import { auth } from "@/lib/auth";

export async function run(
	headers: Headers,
	challengeId: string,
): Promise<ApiSuccessResponse<{ challenge: Challenge; match: Match }>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	if (
		session.session.scopes &&
		!session.session.scopes.includes(Scope.Challenges)
	)
		throw new ForbiddenError();

	const cId = parseInt(challengeId, 10);

	if (Number.isNaN(cId)) throw new BadRequestError();

	const challengeInfo = await getChallengeInfo(cId);

	if (!challengeInfo) throw new NotFoundError("Challenge Not Found");

	if (challengeInfo.toId !== session.user.id) throw new ForbiddenError();

	const { match, challenge } = await acceptChallenge(challengeInfo);

	publishToSubscriber(
		`challenge:${challengeInfo.fromId}`,
		"challenge:accepted",
		challengeInfo.fromId,
		{
			challengeId: challenge.id,
			acceptedBy: removePrivateUserFields(session.user),
			match,
		},
	);

	return {
		success: true,
		data: {
			challenge,
			match,
		},
	};
}

export default { run };
