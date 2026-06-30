import type { ApiSuccessResponse, Friendship } from "@chess-now/api";
import { eq } from "drizzle-orm";
import { NotFoundError, UnauthorizedError } from "@/api/errors";
import { publicUserColumns } from "@/api/helper";
import { auth } from "@/lib/auth";
import { db, schemas } from "@/lib/database";

export async function run(
	headers: Headers,
	requestId: string,
): Promise<ApiSuccessResponse<Friendship>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	if (Number.isNaN(Number(requestId)))
		throw new NotFoundError("Friend request not found");

	const requestIdNum = Number(requestId);

	const friendRequest = await db.query.friendRequests.findFirst({
		where: (request, { eq, and }) =>
			and(eq(request.id, requestIdNum), eq(request.status, "pending")),
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
			.where(eq(schemas.friendRequests.id, requestIdNum));

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

	return {
		success: true,
		data: friendship,
	};
}

export default { run };
