import { getChallengeInfo } from "@/api/helper";
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

	const cId = parseInt(challengeId, 10);

	if (Number.isNaN(cId))
		return {
			type: "error",
			content: {
				code: 400,
				error: "Bad Request",
			},
		};

	const challenge = await getChallengeInfo(cId);

	if (!challenge)
		return {
			type: "error",
			content: {
				code: 404,
				error: "Challenge Not Found",
			},
		};

	return {
		type: "success",
		content: challenge,
	};
}

export default { run };
