import type { ApiSuccessResponse, FriendRequest } from "@chess-now/api";
import { eq } from "drizzle-orm";
import { NotFoundError, UnauthorizedError } from "@/api/errors";
import { publicUserColumns } from "@/api/helper";
import { auth } from "@/lib/auth";
import { db, schemas } from "@/lib/database";

export async function run(
	headers: Headers,
	requestId: string,
): Promise<ApiSuccessResponse<FriendRequest>> {
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
		.where(eq(schemas.friendRequests.id, requestIdNum));

	friendRequest.status = "denied";

	return {
		success: true,
		data: friendRequest,
	};
}

export default { run };
