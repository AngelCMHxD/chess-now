import type { ApiSuccessResponse, Match } from "@chess-now/api";
import { NotFoundError, UnauthorizedError } from "@/api/errors";
import { getUserByUsername, getUserMatches } from "@/api/helper";
import { auth } from "@/lib/auth";

export async function run(
	headers: Headers,
	username: string,
): Promise<ApiSuccessResponse<Match[]>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	const user = await getUserByUsername(username);
	if (!user) throw new NotFoundError();

	const matches = await getUserMatches(user.id);

	return {
		success: true,
		data: matches,
	};
}

export default { run };
