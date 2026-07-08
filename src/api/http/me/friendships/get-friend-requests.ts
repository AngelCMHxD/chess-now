import type { ApiSuccessResponse, FriendRequest } from "@chess-now/api";
import { UnauthorizedError } from "@/api/errors";
import { getFriendRequests } from "@/api/helper";
import { auth } from "@/lib/auth";

export async function run(
	headers: Headers,
): Promise<ApiSuccessResponse<FriendRequest[]>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	const requests = await getFriendRequests(session.user.id);

	return {
		success: true,
		data: requests,
	};
}

export default { run };
