import { and, eq } from "drizzle-orm";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@/api/errors";
import { getChallengeInfo } from "@/api/helper";
import { publishToSubscriber } from "@/api/ws-events";
import { auth } from "@/lib/auth";
import { db, schemas } from "@/lib/database";

export async function run(headers: Headers, challengeId: string) {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	if (
		session.session.scopes &&
		!session.session.scopes.includes("challenges")
	)
		throw new ForbiddenError();

	const cId = parseInt(challengeId, 10);

	if (Number.isNaN(cId)) throw new BadRequestError();

	const challenge = await getChallengeInfo(cId);

	if (!challenge) throw new NotFoundError("Challenge Not Found");

	if (challenge.to !== session.user.id) throw new ForbiddenError();

	db.update(schemas.challenges)
		.set({
			status: "denied",
		})
		.where(
			and(
				eq(schemas.challenges.id, challenge.id),
				eq(schemas.challenges.to, session.user.id),
			),
		);

	publishToSubscriber(
		`challenge:${challenge.from}`,
		"challenge:denied",
		challenge.from,
		{
			challengeId: challenge.id,
			deniedBy: session.user.id,
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
