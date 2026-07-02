import type { ApiSuccessResponse, Challenge } from "@chess-now/api";
import z from "zod";
import { NotFoundError, UnauthorizedError } from "@/api/errors";
import {
	challengeConfig,
	createChallenge,
	getUserByUsername,
} from "@/api/helper";
import { publishToSubscriber } from "@/api/ws-events";
import { auth } from "@/lib/auth";

export const bodyType = z.optional(challengeConfig);

export async function run(
	headers: Headers,
	username: string,
	options: z.infer<typeof bodyType>,
): Promise<ApiSuccessResponse<Challenge>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	const oponent = await getUserByUsername(username);

	if (!oponent) throw new NotFoundError("User Not Found");

	const challenge = await createChallenge(
		session.user.id,
		oponent.id,
		options,
	);

	publishToSubscriber(
		`challenge:${oponent.id}`,
		"challenge:request",
		oponent.id,
		{
			challenge,
		},
	);

	return {
		success: true,
		data: challenge,
	};
}

export default { bodyType, run };
