import { type ApiSuccessResponse, Scope } from "@chess-now/api";
import { ForbiddenError, UnauthorizedError } from "@/api/errors";
import { hasScope } from "@/api/helper";
import { deleteUser } from "@/api/http/me/delete-account";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";

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
			"A bot account cannot manage other bot accounts.",
		);

	const bot = await db.query.user.findFirst({
		where: (user, { eq, and }) =>
			and(eq(user.id, botId), eq(user.botOwnerId, session.user.id)),
	});

	if (!bot) throw new ForbiddenError();

	await deleteUser(bot.id);

	return {
		success: true,
		data: {
			success: true,
		},
	};
}

export default { run };
