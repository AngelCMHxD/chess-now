import z from "zod";
import { app } from "@/api";
import { challengeConfig, createChallenge, getUserInfo } from "@/api/helper";
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

	const oponent = await getUserInfo(oponentId);

	if (!oponent)
		return {
			type: "error",
			content: {
				code: 404,
				error: "User Not Found",
			},
		};

	const challenge = await createChallenge(
		session.user.id,
		oponentId,
		options,
	);

	app.server.publish(
		`challenge:${oponentId}`,
		JSON.stringify({
			type: "challenge:request",
			content: {
				...challenge,
				websocketUserId: oponentId,
			},
		}),
	);

	return {
		type: "success",
		content: challenge,
	};
}

export default { bodyType, headersType, run };
