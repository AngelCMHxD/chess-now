import z from "zod";
import { auth } from "@/lib/auth";
import { getMatchInfo } from "../helper";

export const headersType = z.object({
	authorization: z
		.string({
			error: "An 'authorization' header is required",
		})
		.startsWith("Bearer ", {
			error: "'authorization' header must start with 'Bearer '",
		}),
});

export async function run(bearer: string, matchId: string) {
	const session = await auth.api.getSession({
		headers: {
			Authorization: bearer,
		},
	});

	if (!session) {
		return {
			type: "error",
			content: {
				code: 401,
				error: "Unauthorized",
			},
		};
	}

	const mId = parseInt(matchId, 10);

	if (Number.isNaN(mId))
		return {
			type: "error",
			content: {
				code: 400,
				error: "Bad Request",
			},
		};

	const match = await getMatchInfo(mId);

	return {
		type: "success",
		content: match,
	};
}

export default { headersType, run };
