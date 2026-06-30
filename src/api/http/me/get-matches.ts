import type { ApiSuccessResponse, Match } from "@chess-now/api";
import { UnauthorizedError } from "@/api/errors";
import { auth } from "@/lib/auth";
import { db, secondaryStorage } from "@/lib/database";

export async function run(
	headers: Headers,
): Promise<ApiSuccessResponse<Match[]>> {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	const matches = await db.query.matches.findMany({
		where: (matches, { eq, or }) =>
			or(
				eq(matches.whiteId, session.user.id),
				eq(matches.blackId, session.user.id),
			),
		with: {
			blackPlayer: true,
			whitePlayer: true,
		},
	});

	for (const [i, match] of matches.entries()) {
		if (match.status !== "active") continue;

		const activeMatch = (await secondaryStorage.get(
			`match_${match.id}`,
		)) as (typeof matches)[number];
		if (!activeMatch) continue;

		matches[i].fen = activeMatch.fen;
		matches[i].pgn = activeMatch.pgn;
	}

	return {
		success: true,
		data: matches,
	};
}

export default { run };
