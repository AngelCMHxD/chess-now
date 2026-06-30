import type { ApiSuccessResponse, Challenge } from "@chess-now/api";
import {
	BadRequestError,
	NotFoundError,
	UnauthorizedError,
} from "@/api/errors";
import { getChallengeInfo } from "@/api/helper";
import { auth } from "@/lib/auth";

export async function run(
	headers: Headers,
	challengeId: string,
): Promise<ApiSuccessResponse<Challenge>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	const cId = parseInt(challengeId, 10);

	if (Number.isNaN(cId)) throw new BadRequestError();

	const challenge = await getChallengeInfo(cId);

	if (!challenge) throw new NotFoundError("Challenge Not Found");

	return {
		success: true,
		data: challenge,
	};
}

export default { run };
