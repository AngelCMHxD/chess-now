import {
	type ApiKey,
	type ApiSuccessResponse,
	Scope,
	type User,
} from "@chess-now/api";
import { eq } from "drizzle-orm";
import z from "zod";
import { ConflictError, ForbiddenError, UnauthorizedError } from "@/api/errors";
import { removePrivateUserFields } from "@/api/helper";
import { auth } from "@/lib/auth";
import { db, schemas } from "@/lib/database";

export const bodyType = z.object({
	name: z.string(),
	username: z.string(),
});

export async function run(
	headers: Headers,
	body: z.infer<typeof bodyType>,
): Promise<ApiSuccessResponse<{ bot: User; apiKey: ApiKey }>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();
	if (session.session.scopes && !session.session.scopes.includes(Scope.Bots))
		throw new ForbiddenError();

	if (session.user.botOwnerId)
		throw new ForbiddenError(
			"A bot account cannot create other bot accounts.",
		);

	const existingUser = await db.query.user.findFirst({
		where: (user, { eq }) => eq(user.username, body.username),
		columns: { id: true },
	});

	if (existingUser) {
		throw new ConflictError("Username is already taken.");
	}

	const botId = crypto.randomUUID();
	const email = `bot_${botId}@chessnow.local`;

	const [newBot] = await db
		.insert(schemas.user)
		.values({
			id: botId,
			name: body.name,
			email,
			isAnonymous: true,
			username: body.username,
			botOwnerId: session.user.id,
		})
		.returning();

	const botSession = await db
		.insert(schemas.session)
		.values({
			id: crypto.randomUUID(),
			token: crypto.randomUUID(),
			userId: newBot.id,
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
		body: {
			userId: newBot.id,
			configId: "bot-key",
		},
	});

	await db
		.delete(schemas.session)
		.where(eq(schemas.session.id, botSession[0].id));

	return {
		success: true,
		data: { bot: removePrivateUserFields(newBot), apiKey },
	};
}

export default { run, bodyType };
