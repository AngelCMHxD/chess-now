import {
	type ApiSuccessResponse,
	type Friendship,
	Scope,
} from "@chess-now/api";
import { eq } from "drizzle-orm";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/api/errors";
import { getUserByUsername, hasScope, publicUserColumns } from "@/api/helper";
import { publishToSubscriber } from "@/api/ws-events";
import { auth } from "@/lib/auth";
import { db, schemas } from "@/lib/database";

export async function run(
	headers: Headers,
	username: string,
): Promise<ApiSuccessResponse<Friendship>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	if (!hasScope(session, Scope.Friends)) throw new ForbiddenError();

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
			"Cannot accept a friend request that's not yours",
		);

	const friendship = (await db.transaction(async (tx) => {
		const initialFriendship = (
			await tx
				.insert(schemas.friendships)
				.values({
					userAId: session.user.id,
					userBId: friendRequest.fromId,
				})
				.returning()
		)[0];

		await tx
			.update(schemas.friendRequests)
			.set({ status: "accepted" })
			.where(eq(schemas.friendRequests.id, friendRequest.id));

		return await tx.query.friendships.findFirst({
			where: (friendship, { eq }) =>
				eq(friendship.id, initialFriendship.id),
			with: {
				userA: {
					columns: publicUserColumns,
				},
				userB: {
					columns: publicUserColumns,
				},
			},
		});
	})) as Friendship;

	publishToSubscriber<"friend:accepted">(
		`friend:${friendRequest.fromId}`,
		"friend:accepted",
		friendRequest.fromId,
		{ friendship },
	);

	return {
		success: true,
		data: friendship,
	};
}

export default { run };
