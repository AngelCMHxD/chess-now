import type { ApiKey } from "@better-auth/api-key";
import {
	type ApiSuccessResponse,
	type PublicUser,
	Scope,
	type User,
} from "@chess-now/api";
import z from "zod";
import { ForbiddenError, UnauthorizedError } from "@/api/errors";
import { removePrivateUserFields } from "@/api/helper";
import { auth } from "@/lib/auth";

export const bodyType = z.object({
	name: z.string(),
	username: z.string(),
});

export async function run(
	headers: Headers,
	body: z.infer<typeof bodyType>,
): Promise<ApiSuccessResponse<{ bot: PublicUser; apiKey: ApiKey }>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();
	if (session.session.scopes && !session.session.scopes.includes(Scope.Bots))
		throw new ForbiddenError();

	const bot = (await auth.api.signInAnonymous({
		headers: {
			"x-internal-call": process.env.INTERNAL_API_SECRET as string,
		},
	})) as unknown as {
		token: string;
		user: User;
	};

	await auth.api.updateUser({
		headers: {
			"x-internal-call": process.env.INTERNAL_API_SECRET as string,
			Authorization: `Bearer ${bot.token}`,
		},
		body: {
			name: body.name,
			username: body.username,
			botOwnerId: session.user.id,
		},
	});

	bot.user.name = body.name;
	bot.user.username = body.username;
	bot.user.botOwnerId = session.user.id;

	const apiKey = await auth.api.createApiKey({
		headers: {
			"x-internal-call": process.env.INTERNAL_API_SECRET as string,
		},
		body: {
			userId: bot.user.id,
			configId: "bot-key",
		},
	});

	return {
		success: true,
		data: { bot: removePrivateUserFields(bot.user), apiKey },
	};
}

export default { run, bodyType };
