import { and, eq } from "drizzle-orm";
import { app } from "@/api";
import { getChallengeInfo } from "@/api/helper";
import { auth } from "@/lib/auth";
import { db, schemas } from "@/lib/database";

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

	if (
		session.session.scopes &&
		!session.session.scopes.includes("challenges")
	)
		return {
			type: "error",
			content: {
				code: 403,
				error: "Forbidden",
			},
		};

	const cId = parseInt(challengeId, 10);

	if (Number.isNaN(cId))
		return {
			type: "error",
			content: {
				code: 400,
				error: "Bad Request",
			},
		};

	const challengeInfo = await getChallengeInfo(cId);

	if (!challengeInfo)
		return {
			type: "error",
			content: {
				code: 404,
				error: "Challenge Not Found",
			},
		};

	if (challengeInfo.to !== session.user.id)
		return {
			type: "error",
			content: {
				code: 403,
				error: "Forbidden",
			},
		};

	db.update(schemas.challenges)
		.set({
			status: "denied",
		})
		.where(
			and(
				eq(schemas.challenges.id, challengeInfo.id),
				eq(schemas.challenges.to, session.user.id),
			),
		);

	app.server?.publish(
		`challenge:${challengeInfo.from}`,
		JSON.stringify({
			type: "challenge:denied",
			content: {
				websocketUserId: challengeInfo.from,
			},
		}),
	);

	return {
		type: "success",
	};
}

export default { run };
