import { UnauthorizedError } from "@/api/errors";
import { getChallenges } from "@/api/helper";
import { auth } from "@/lib/auth";

export async function run(headers: Headers) {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	const challenges = await getChallenges(session.user.id);

	return {
		type: "success",
		content: challenges,
	};
}

export default { run };
