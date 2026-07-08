import type { ApiSuccessResponse, Friendship } from "@chess-now/api";
import { eq } from "drizzle-orm";
import { NotFoundError, UnauthorizedError } from "@/api/errors";
import { getUserByUsername, publicUserColumns } from "@/api/helper";
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

	const otherUser = await getUserByUsername(username);

	if (!otherUser) throw new NotFoundError("User not found");

	const friendship = await db.query.friendships.findFirst({
		where: (request, { eq, or, and }) =>
			or(
				and(
					eq(request.userAId, session.user.id),
					eq(request.userBId, otherUser.id),
				),
				and(
					eq(request.userAId, otherUser.id),
					eq(request.userBId, session.user.id),
				),
			),
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

	await db
		.delete(schemas.friendships)
		.where(eq(schemas.friendships.id, friendship.id));

	publishToSubscriber<"friend:removed">(
		`friend:${otherUser.id}`,
		"friend:removed",
		otherUser.id,
		{ friendship },
	);

	return {
		success: true,
		data: friendship,
	};
}

export default { run };
