import type { ApiSuccessResponse, User } from "@chess-now/api";
import { UnauthorizedError } from "@/api/errors";
import { removePrivateUserFields } from "@/api/helper";
import { auth } from "@/lib/auth";

export async function run(headers: Headers): Promise<ApiSuccessResponse<User>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	return {
		success: true,
		data: removePrivateUserFields(session.user),
	};
}

export default { run };
