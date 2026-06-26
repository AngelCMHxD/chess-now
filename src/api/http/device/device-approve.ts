import z from "zod";
import { ForbiddenError } from "@/api/errors";
import { publishToSubscriber } from "@/api/ws-events";
import { auth } from "@/lib/auth";

export const bodyType = z.object({
	userCode: z.string(),
});

export async function run(headers: Headers, body: z.infer<typeof bodyType>) {
	headers.set("x-internal-call", process.env.INTERNAL_API_SECRET as string);

	const session = await auth.api.getSession({
		headers,
	});

	if ((session?.session?.scopes?.length ?? 0) > 0) throw new ForbiddenError();

	const deviceAuth = await auth.api.deviceApprove({
		body,
		headers,
	});

	if (deviceAuth.success)
		publishToSubscriber(
			`device_auth:${body.userCode}`,
			"device_auth",
			body.userCode,
			{
				action: "approved",
				userCode: body.userCode,
			},
		);

	return deviceAuth;
}

export default { bodyType, run };
