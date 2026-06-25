import { app } from "@/api";
import { acceptChallenge, getChallengeInfo } from "@/api/helper";
import { auth } from "@/lib/auth";

export async function run(headers: Headers, challengeId: string) {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) {
		return {
			type: "error",
			content: {
				code: 401,
				error: "Unauthorized",
			},
		};
	}

	if (
		session.session.scopes &&
		!session.session.scopes.includes("challenges")
	)
		return {
			type: "error",
			content: {
				code: 403,
				error: "Forbidden",
			},
		};

	const cId = parseInt(challengeId, 10);

	if (Number.isNaN(cId))
		return {
			type: "error",
			content: {
				code: 400,
				error: "Bad Request",
			},
		};

	const challengeInfo = await getChallengeInfo(cId);

	if (!challengeInfo)
		return {
			type: "error",
			content: {
				code: 404,
				error: "Challenge Not Found",
			},
		};

	if (challengeInfo.to !== session.user.id)
		return {
			type: "error",
			content: {
				code: 403,
				error: "Forbidden",
			},
		};

	const { match, challenge } = await acceptChallenge(challengeInfo);

	app.server.publish(
		`challenge:${challenge.from}`,
		JSON.stringify({
			type: "challenge:accept",
			content: {
				websocketUserId: challenge.from,
				...match,
			},
		}),
	);

	return {
		type: "success",
		content: match,
	};
}

export default { run };
