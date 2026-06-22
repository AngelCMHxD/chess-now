import z from "zod";
import { getChallengeInfo } from "@/api/helper";
import { auth } from "@/lib/auth";

export const headersType = z.object({
	authorization: z
		.string({
			error: "An 'authorization' header is required",
		})
		.startsWith("Bearer ", {
			error: "'authorization' header must start with 'Bearer '",
		}),
});

export async function run(bearer: string, challengeId: string) {
	const session = await auth.api.getSession({
		headers: {
			Authorization: bearer,
		},
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

export default { headersType, run };
