import z from "zod";
import { app } from "@/api";
import { auth } from "@/lib/auth";

export const bodyType = z.object({
	userCode: z.string(),
});

export async function run(headers: Headers, body: z.infer<typeof bodyType>) {
	headers.set("x-internal-call", process.env.INTERNAL_API_SECRET as string);

	const deviceAuth = await auth.api.deviceApprove({
		body,
		headers,
	});

	if (deviceAuth.success)
		app.server.publish(
			`device-auth:${body.userCode}`,
			JSON.stringify({
				type: "device-auth",
				content: {
					action: "approved",
					userCode: body.userCode,
				},
			}),
		);

	return deviceAuth;
}

export default { bodyType, run };
