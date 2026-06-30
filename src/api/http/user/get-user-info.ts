import type { ApiSuccessResponse, PublicUser } from "@chess-now/api";
import { NotFoundError, UnauthorizedError } from "@/api/errors";
import { getUserInfo } from "@/api/helper";
import { auth } from "@/lib/auth";

export async function run(
	headers: Headers,
	userId: string,
): Promise<ApiSuccessResponse<PublicUser>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	const user = await getUserInfo(userId, true);

	if (!user) throw new NotFoundError();

	return {
		success: true,
		data: user,
	};
}

export default { run };
