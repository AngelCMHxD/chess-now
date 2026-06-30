import type { ApiSuccessResponse, Friendship } from "@chess-now/api";
import { UnauthorizedError } from "@/api/errors";
import { getFriendships } from "@/api/helper";
import { auth } from "@/lib/auth";

export async function run(
	headers: Headers,
	userId: string,
): Promise<ApiSuccessResponse<Friendship[]>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	const friendships = await getFriendships(userId);

	return {
		success: true,
		data: friendships,
	};
}

export default { run };
