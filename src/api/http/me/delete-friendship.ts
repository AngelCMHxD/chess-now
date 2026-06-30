import type { ApiSuccessResponse, Friendship } from "@chess-now/api";
import { eq } from "drizzle-orm";
import { NotFoundError, UnauthorizedError } from "@/api/errors";
import { publicUserColumns } from "@/api/helper";
import { auth } from "@/lib/auth";
import { db, schemas } from "@/lib/database";

export async function run(
	headers: Headers,
	friendshipId: string,
): Promise<ApiSuccessResponse<Friendship>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	if (Number.isNaN(Number(friendshipId)))
		throw new NotFoundError("Friendship not found");

	const friendshipIdNum = Number(friendshipId);

	const friendship = await db.query.friendships.findFirst({
		where: (request, { eq }) => eq(request.id, friendshipIdNum),
		with: {
			userA: {
				columns: publicUserColumns,
			},
			userB: {
				columns: publicUserColumns,
			},
		},
	});

	if (!friendship) throw new NotFoundError("Friendship not found");

	if (![friendship.userAId, friendship.userBId].includes(session.user.id))
		throw new UnauthorizedError(
			"Cannot delete a friendship that you are not involved in",
		);

	await db
		.delete(schemas.friendships)
		.where(eq(schemas.friendships.id, friendshipIdNum));

	return {
		success: true,
		data: friendship,
	};
}

export default { run };
