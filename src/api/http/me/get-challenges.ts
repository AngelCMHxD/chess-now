import z from "zod";
import { getChallenges } from "@/api/helper";
import { auth } from "@/lib/auth";

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

	const challenges = await getChallenges(session.user.id);

	return {
		type: "success",
		content: challenges,
	};
}

export default { headersType, run };
