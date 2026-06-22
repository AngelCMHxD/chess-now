import z from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";

export const headersType = z.object({
	authorization: z
		.string({
			error: "An 'authorization' header is required",
		})
		.startsWith("Bearer ", {
			error: "'authorization' header must start with 'Bearer '",
		}),
});

export async function run(bearer: string) {
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

	const matches = await db.query.matches.findMany({
		where: (matches, { eq, or }) =>
			or(
				eq(matches.whiteId, session.user.id),
				eq(matches.blackId, session.user.id),
			),
	});

	return {
		type: "success",
		content: matches,
	};
}

export default { headersType, run };
