import { UnauthorizedError } from "@/api/errors";
import { auth } from "@/lib/auth";

export async function run(headers: Headers) {
	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();

	return {
		type: "success",
		content: session.user,
	};
}

export default { run };
