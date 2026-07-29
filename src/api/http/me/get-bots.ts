import type { ApiSuccessResponse, User } from "@chess-now/api";
import { UnauthorizedError } from "@/api/errors";
import { removePrivateUserFields } from "@/api/helper";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";

export async function run(
	headers: Headers,
): Promise<ApiSuccessResponse<User[]>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	const bots = await db.query.user.findMany({
		where: (user, { eq }) => eq(user.botOwnerId, session.user.id),
	});

	const publicBots: User[] = [];

	bots.forEach((bot) => {
		publicBots.push(removePrivateUserFields(bot));
	});

	return {
		success: true,
		data: publicBots,
	};
}

export default { run };
