import type { ApiSuccessResponse, PublicUser } from "@chess-now/api";
import { NotFoundError, UnauthorizedError } from "@/api/errors";
import {
	getUserByUsername,
	getUserInfo,
	removePrivateUserFields,
} from "@/api/helper";
import { auth } from "@/lib/auth";

export async function run(
	headers: Headers,
	username: string,
): Promise<ApiSuccessResponse<PublicUser>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	const resolvedUser = await getUserByUsername(username);
	if (!resolvedUser) throw new NotFoundError();

	const user = await getUserInfo(resolvedUser.id);

	if (!user) throw new NotFoundError();

	return {
		success: true,
		data: removePrivateUserFields(user),
	};
}

export default { run };
