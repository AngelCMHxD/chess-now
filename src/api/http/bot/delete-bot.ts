import { type ApiSuccessResponse, Scope } from "@chess-now/api";
import { eq } from "drizzle-orm";
import { ForbiddenError, UnauthorizedError } from "@/api/errors";
import { hasScope } from "@/api/helper";
import { auth } from "@/lib/auth";
import { db, schemas, secondaryStorage } from "@/lib/database";

export async function run(
	headers: Headers,
	botId: string,
): Promise<ApiSuccessResponse<{ success: true }>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();
	if (!hasScope(session, Scope.Bots)) throw new ForbiddenError();

	if (session.user.botOwnerId)
		throw new ForbiddenError(
			"A bot account cannot create other bot accounts.",
		);

	const bot = await db.query.user.findFirst({
		where: (user, { eq, and }) =>
			and(eq(user.id, botId), eq(user.botOwnerId, session.user.id)),
	});

	if (!bot) throw new ForbiddenError();

	await db
		.delete(schemas.apikey)
		.where(eq(schemas.apikey.referenceId, bot.id));

	await db.delete(schemas.session).where(eq(schemas.session.userId, bot.id));

	type ActiveSessions = {
		value: {
			token: string;
			expiresAt: number;
		}[];
		expires: number;
	};

	// invalidate all sessions from the secondary storage
	// TODO: find a better way to this that is not as prone to breaking
	// this relies heavily on how better auth works internally
	// if there is an internal change to how sessions are stored, this WILL break :/

	const activeSessions = (await secondaryStorage.get(
		`active-sessions-${bot.id}`,
	)) as ActiveSessions;

	if (activeSessions) {
		for (const session of activeSessions.value) {
			await secondaryStorage.delete(session.token);
		}

		await secondaryStorage.delete(`active-sessions-${bot.id}`);
	}

	await db.delete(schemas.account).where(eq(schemas.account.userId, bot.id));

	await db.delete(schemas.user).where(eq(schemas.user.id, bot.id));

	return {
		success: true,
		data: {
			success: true,
		},
	};
}

export default { run };
