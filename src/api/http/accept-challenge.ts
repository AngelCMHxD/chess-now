import z from "zod";
import { auth } from "@/lib/auth";
import { app } from "..";
import { acceptChallenge, challengeConfig } from "../helper";

export const headersType = z.object({
	authorization: z
		.string({
			error: "An 'authorization' header is required",
		})
		.startsWith("Bearer ", {
			error: "'authorization' header must start with 'Bearer '",
		}),
});

export const bodyType = z.optional(challengeConfig);

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

	const { match, challenge } = await acceptChallenge(cId);

	app.server.ws.publish(`challenge:${challenge.from}`, {
		type: "challenge:accept",
		content: match,
	});

	return {
		type: "success",
		content: match,
	};
}

export default { bodyType, headersType, run };
