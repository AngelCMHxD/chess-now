import z from "zod";
import { ForbiddenError, UnauthorizedError } from "@/api/errors";
import { publishToSubscriber } from "@/api/ws-events";
import { auth } from "@/lib/auth";
import { isExternalAuth } from "@/api/helper";

export const bodyType = z.object({
	userCode: z.string(),
});

export async function run(headers: Headers, body: z.infer<typeof bodyType>) {
	headers.set("x-internal-call", process.env.INTERNAL_API_SECRET as string);

	const session = await auth.api.getSession({
		headers,
	});

	if (!session) throw new UnauthorizedError();
	if (isExternalAuth(session)) throw new ForbiddenError();

	const deviceAuth = await auth.api.deviceDeny({
		body,
		headers,
	});

	if (deviceAuth.success)
		publishToSubscriber(
			`device_auth:${body.userCode}`,
			"device_auth",
			body.userCode,
			{
				action: "denied",
				userCode: body.userCode,
			},
		);

	return deviceAuth;
}

export default { bodyType, run };
