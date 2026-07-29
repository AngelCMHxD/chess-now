import { type ApiSuccessResponse, type Challenge, Scope } from "@chess-now/api";
import z from "zod";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@/api/errors";
import {
	challengeConfig,
	createChallenge,
	getUserByUsername,
	hasScope,
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

	if (!hasScope(session, Scope.Challenges)) throw new ForbiddenError();

	const oponent = await getUserByUsername(username);

	if (!oponent) throw new NotFoundError("User Not Found");

	if (oponent.id === session.user.id) {
		throw new BadRequestError("You cannot challenge yourself");
	}

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
