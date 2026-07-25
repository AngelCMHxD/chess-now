import { type ApiSuccessResponse, Scope } from "@chess-now/api";
import { eq } from "drizzle-orm";
import { ForbiddenError, UnauthorizedError } from "@/api/errors";
import { hasScope } from "@/api/helper";
import { auth } from "@/lib/auth";
import { db, schemas } from "@/lib/database";

export async function run(
	headers: Headers,
	botId: string,
): Promise<ApiSuccessResponse<string>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();
	if (!hasScope(session, Scope.Bots)) throw new ForbiddenError();

	if (session.user.botOwnerId)
		throw new ForbiddenError(
			"A bot account cannot manage other bot accounts.",
		);

	const bot = await db.query.user.findFirst({
		where: (user, { eq, and }) =>
			and(eq(user.id, botId), eq(user.botOwnerId, session.user.id)),
	});

	if (!bot) throw new ForbiddenError();

	await db
		.delete(schemas.apikey)
		.where(eq(schemas.apikey.referenceId, bot.id));

	const botSession = await db
		.insert(schemas.session)
		.values({
			id: crypto.randomUUID(),
			token: crypto.randomUUID(),
			userId: bot.id,
			expiresAt: new Date(Date.now() + 10000),
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		.returning();

	const apiKey = await auth.api.createApiKey({
		headers: {
			"x-internal-call": process.env.INTERNAL_API_SECRET as string,
			Authorization: `Bearer ${botSession[0].token}`,
		},
		body: { configId: "bot-key", userId: bot.id },
	});

	await db
		.delete(schemas.session)
		.where(eq(schemas.session.id, botSession[0].id));

	return {
		success: true,
		data: apiKey.key,
	};
}

export default { run };
