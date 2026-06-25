import { auth } from "@/lib/auth";

export async function run(headers: Headers) {
	const session = await auth.api.getSession({
		headers,
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

	return {
		type: "success",
		content: session.user,
	};
}

export default { run };
