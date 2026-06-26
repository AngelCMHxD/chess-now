import {
	BadRequestError,
	NotFoundError,
	UnauthorizedError,
} from "@/api/errors";
import { getMatchInfo } from "@/api/helper";
import { auth } from "@/lib/auth";

export async function run(headers: Headers, matchId: string) {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	const mId = parseInt(matchId, 10);

	if (Number.isNaN(mId)) throw new BadRequestError();

	const match = await getMatchInfo(mId);

	if (!match) throw new NotFoundError("Match Not Found");

	return {
		type: "success",
		content: match,
	};
}

export default { run };
