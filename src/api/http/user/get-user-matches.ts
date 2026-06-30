import type { ApiSuccessResponse, Match } from "@chess-now/api";
import { UnauthorizedError } from "@/api/errors";
import { getUserMatches } from "@/api/helper";
import { auth } from "@/lib/auth";

export async function run(
	headers: Headers,
	userId: string,
): Promise<ApiSuccessResponse<Match[]>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	const matches = await getUserMatches(userId);

	return {
		success: true,
		data: matches,
	};
}

export default { run };
