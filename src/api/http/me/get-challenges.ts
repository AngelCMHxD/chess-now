import type { ApiSuccessResponse, Challenge } from "@chess-now/api";
import { UnauthorizedError } from "@/api/errors";
import { getChallenges } from "@/api/helper";
import { auth } from "@/lib/auth";

export async function run(
	headers: Headers,
): Promise<ApiSuccessResponse<Challenge[]>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	const challenges = await getChallenges(session.user.id);

	return {
		success: true,
		data: challenges,
	};
}

export default { run };
