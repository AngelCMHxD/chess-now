import z from "zod";
import { auth } from "@/lib/auth";

const validScopes = ["challenges", "matches"] as const;

export const bodyType = z.object({
	scopes: z
		.array(z.enum(validScopes))
		.min(1)
		.max(validScopes.length)
		.transform((items) => [...new Set(items)]),
});

export async function run(body: z.infer<typeof bodyType>) {
	const headers = new Headers();
	headers.set("x-internal-call", process.env.INTERNAL_API_SECRET as string);

	const deviceAuth = await auth.api.deviceCode({
		body: {
			client_id: "public",
			scope: body.scopes.join(" "),
		},
		headers,
	});

	return {
		type: "success",
		content: deviceAuth,
	};
}

export default { bodyType, run };
