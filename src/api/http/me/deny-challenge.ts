import type { ApiSuccessResponse, Challenge } from "@chess-now/api";
import { Scope } from "@chess-now/api";
import { and, eq } from "drizzle-orm";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@/api/errors";
import {
	getChallengeInfo,
	hasScope,
	removePrivateUserFields,
} from "@/api/helper";
import { publishToSubscriber } from "@/api/ws-events";
import { auth } from "@/lib/auth";
import { db, schemas } from "@/lib/database";

export async function run(
	headers: Headers,
	challengeId: string,
): Promise<ApiSuccessResponse<{ challenge: Challenge }>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	if (!hasScope(session, Scope.Challenges)) throw new ForbiddenError();

	const cId = parseInt(challengeId, 10);

	if (Number.isNaN(cId)) throw new BadRequestError();

	const challenge = await getChallengeInfo(cId);

	if (!challenge) throw new NotFoundError("Challenge Not Found");

	if (challenge.toId !== session.user.id) throw new ForbiddenError();

	await db
		.update(schemas.challenges)
		.set({
			status: "denied",
		})
		.where(
			and(
				eq(schemas.challenges.id, challenge.id),
				eq(schemas.challenges.toId, session.user.id),
			),
		);

	challenge.status = "denied";

	publishToSubscriber(
		`challenge:${challenge.fromId}`,
		"challenge:denied",
		challenge.fromId,
		{
			challengeId: challenge.id,
			deniedBy: removePrivateUserFields(session.user),
		},
	);

	return {
		success: true,
		data: {
			challenge,
		},
	};
}

export default { run };
