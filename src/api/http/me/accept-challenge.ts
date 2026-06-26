import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@/api/errors";
import { acceptChallenge, getChallengeInfo } from "@/api/helper";
import { publishToSubscriber } from "@/api/ws-events";
import { auth } from "@/lib/auth";

export async function run(headers: Headers, challengeId: string) {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	if (
		session.session.scopes &&
		!session.session.scopes.includes("challenges")
	)
		throw new ForbiddenError();

	const cId = parseInt(challengeId, 10);

	if (Number.isNaN(cId)) throw new BadRequestError();

	const challengeInfo = await getChallengeInfo(cId);

	if (!challengeInfo) throw new NotFoundError("Challenge Not Found");

	if (challengeInfo.to !== session.user.id) throw new ForbiddenError();

	const { match, challenge } = await acceptChallenge(challengeInfo);

	publishToSubscriber(
		`challenge:${challengeInfo.from}`,
		"challenge:accepted",
		challengeInfo.from,
		{
			challengeId: challenge.id,
			acceptedBy: session.user.id,
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
