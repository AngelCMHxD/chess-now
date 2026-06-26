import z from "zod";
import { NotFoundError, UnauthorizedError } from "@/api/errors";
import { challengeConfig, createChallenge, getUserInfo } from "@/api/helper";
import { publishToSubscriber } from "@/api/ws-events";
import { auth } from "@/lib/auth";

export const bodyType = z.optional(challengeConfig);

export async function run(
	headers: Headers,
	oponentId: string,
	options: z.infer<typeof bodyType>,
) {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	const oponent = await getUserInfo(oponentId);

	if (!oponent) throw new NotFoundError("User Not Found");

	const challenge = await createChallenge(
		session.user.id,
		oponentId,
		options,
	);

	publishToSubscriber(
		`challenge:${oponentId}`,
		"challenge:request",
		oponentId,
		{
			challenge,
		},
	);

	return {
		type: "success",
		content: challenge,
	};
}

export default { bodyType, run };
