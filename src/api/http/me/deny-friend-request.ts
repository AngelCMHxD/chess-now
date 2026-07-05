import type { ApiSuccessResponse, FriendRequest } from "@chess-now/api";
import { eq } from "drizzle-orm";
import { NotFoundError, UnauthorizedError } from "@/api/errors";
import { getUserByUsername, publicUserColumns } from "@/api/helper";
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

	const otherUser = await getUserByUsername(username);

	if (!otherUser) throw new NotFoundError("User not found");

	const friendRequest = await db.query.friendRequests.findFirst({
		where: (request, { eq, and, or }) =>
			and(
				or(
					and(
						eq(request.fromId, session.user.id),
						eq(request.toId, otherUser.id),
					),
					and(
						eq(request.fromId, otherUser.id),
						eq(request.toId, session.user.id),
					),
				),
				eq(request.status, "pending"),
			),
		with: {
			from: {
				columns: publicUserColumns,
			},
			to: {
				columns: publicUserColumns,
			},
		},
	});

	if (!friendRequest) throw new NotFoundError("Friend request not found");

	if (friendRequest.toId !== session.user.id)
		throw new UnauthorizedError(
			"Cannot deny a friend request that's not yours",
		);

	await db
		.update(schemas.friendRequests)
		.set({ status: "denied" })
		.where(eq(schemas.friendRequests.id, friendRequest.id));

	friendRequest.status = "denied";

	publishToSubscriber<"friend:denied">(
		`friend:${friendRequest.fromId}`,
		"friend:denied",
		friendRequest.fromId,
		{ request: friendRequest },
	);

	return {
		success: true,
		data: friendRequest,
	};
}

export default { run };
