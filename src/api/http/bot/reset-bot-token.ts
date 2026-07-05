import type { ApiKey } from "@better-auth/api-key";
import { type ApiSuccessResponse, Scope } from "@chess-now/api";
import { eq } from "drizzle-orm";
import { ForbiddenError, UnauthorizedError } from "@/api/errors";
import { auth } from "@/lib/auth";
import { db, schemas } from "@/lib/database";

export async function run(
	headers: Headers,
	botId: string,
): Promise<ApiSuccessResponse<ApiKey>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();
	if (session.session.scopes && !session.session.scopes.includes(Scope.Bots))
		throw new ForbiddenError();

	const bot = await db.query.user.findFirst({
		where: (user, { eq, and }) =>
			and(eq(user.id, botId), eq(user.botOwnerId, session.user.id)),
	});

	if (!bot) throw new ForbiddenError();

	await db
		.delete(schemas.apikey)
		.where(eq(schemas.apikey.referenceId, bot.id));

	const apiKey = await auth.api.createApiKey({
		headers: {
			"x-internal-call": process.env.INTERNAL_API_SECRET as string,
		},
		body: { configId: "bot-key", userId: bot.id },
	});

	return {
		success: true,
		data: apiKey,
	};
}

export default { run };
