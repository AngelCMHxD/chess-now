import type { ApiSuccessResponse, FriendRequest } from "@chess-now/api";
import { UnauthorizedError } from "@/api/errors";
import { publishToSubscriber } from "@/api/ws-events";
import { auth } from "@/lib/auth";
import { db, schemas } from "@/lib/database";

export async function run(
	headers: Headers,
	toId: string,
): Promise<ApiSuccessResponse<FriendRequest>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	if (toId === session.user.id)
		throw new UnauthorizedError("Cannot send a friend request to yourself");

	const request = (await db.transaction(async (tx) => {
		const initialFriendRequest = (
			await tx
				.insert(schemas.friendRequests)
				.values({ fromId: session.user.id, toId })
				.returning()
		)[0];

		return await tx.query.friendRequests.findFirst({
			where: (friendRequest, { eq }) =>
				eq(friendRequest.id, initialFriendRequest.id),
		});
	})) as FriendRequest;

	publishToSubscriber<"friend:request">(
		`friend:${toId}`,
		"friend:request",
		toId,
		{ request },
	);

	return {
		success: true,
		data: request,
	};
}

export default { run };
