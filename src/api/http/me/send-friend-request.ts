import type { ApiSuccessResponse, FriendRequest } from "@chess-now/api";
import { NotFoundError, UnauthorizedError } from "@/api/errors";
import { getUserByUsername } from "@/api/helper";
import { publishToSubscriber } from "@/api/ws-events";
import { auth } from "@/lib/auth";
import { db, schemas } from "@/lib/database";

export async function run(
	headers: Headers,
	username: string,
): Promise<ApiSuccessResponse<FriendRequest>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	const user = await getUserByUsername(username);

	if (!user) throw new NotFoundError("User not found");

	if (user.id === session.user.id)
		throw new UnauthorizedError("Cannot send a friend request to yourself");

	const request = (await db.transaction(async (tx) => {
		const initialFriendRequest = (
			await tx
				.insert(schemas.friendRequests)
				.values({ fromId: session.user.id, toId: user.id })
				.returning()
		)[0];

		return await tx.query.friendRequests.findFirst({
			where: (friendRequest, { eq }) =>
				eq(friendRequest.id, initialFriendRequest.id),
		});
	})) as FriendRequest;

	publishToSubscriber<"friend:request">(
		`friend:${user.id}`,
		"friend:request",
		user.id,
		{ request },
	);

	return {
		success: true,
		data: request,
	};
}

export default { run };
