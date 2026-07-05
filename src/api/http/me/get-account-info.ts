import type { ApiSuccessResponse, User } from "@chess-now/api";
import { UnauthorizedError } from "@/api/errors";
import { auth } from "@/lib/auth";

export async function run(headers: Headers): Promise<ApiSuccessResponse<User>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	const { isAnonymous, ...user } = session.user;

	return {
		success: true,
		data: user,
	};
}

export default { run };
