import z from "zod";
import { auth } from "@/lib/auth";
import { app } from "..";
import { challengeConfig, createChallenge } from "../helper";

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

export async function run(
	bearer: string,
	oponentId: string,
	options: z.infer<typeof bodyType>,
) {
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

	const challenge = createChallenge(session.user.id, oponentId, options);

	app.server.ws.publish(`challenge:${oponentId}`, {
		type: "challenge:request",
		content: challenge,
	});

	return {
		type: "success",
		content: challenge,
	};
}

export default { bodyType, headersType, run };
