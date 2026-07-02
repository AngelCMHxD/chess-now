import type { ApiSuccessResponse, Friendship } from "@chess-now/api";
import { NotFoundError, UnauthorizedError } from "@/api/errors";
import { getFriendships, getUserByUsername } from "@/api/helper";
import { auth } from "@/lib/auth";

export async function run(
	headers: Headers,
	username: string,
): Promise<ApiSuccessResponse<Friendship[]>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	const user = await getUserByUsername(username);
	if (!user) throw new NotFoundError();

	const friendships = await getFriendships(user.id);

	return {
		success: true,
		data: friendships,
	};
}

export default { run };
