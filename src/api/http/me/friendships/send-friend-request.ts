import {
	type ApiSuccessResponse,
	type FriendRequest,
	Scope,
} from "@chess-now/api";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/api/errors";
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

	if (
		session.session.scopes &&
		!session.session.scopes.includes(Scope.Friends)
	)
		throw new ForbiddenError();

	const user = await getUserByUsername(username);

	if (!user) throw new NotFoundError("User not found");

	if (user.id === session.user.id)
		throw new UnauthorizedError("Cannot send a friend request to yourself");

	const existingRequest = await db.query.friendRequests.findFirst({
		where: (request, { eq, and, or }) =>
			and(
				or(
					and(
						eq(request.fromId, session.user.id),
						eq(request.toId, user.id),
					),
					and(
						eq(request.fromId, user.id),
						eq(request.toId, session.user.id),
					),
				),
				eq(request.status, "pending"),
			),
	});

	if (existingRequest)
		throw new UnauthorizedError(
			"There is a pending friend request already sent",
		);

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
			with: {
				from: {
					columns: publicUserColumns,
				},
				to: {
					columns: publicUserColumns,
				},
			},
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
