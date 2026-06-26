import type { ServerWebSocket } from "elysia/ws/bun";
import z from "zod";
import { publishToSubscriber } from "@/api/ws-events";
import { db } from "@/lib/database";
import { createWSError, createWSResponse, WSErrors } from "../ws-response";

export const bodyType = z.object({
	type: z.literal("watch_device_auth"),
	id: z.optional(z.string()),
	content: z.object(
		{
			userCode: z.string({
				error: "'userCode' needs to be a string containing the user code to watch",
			}),
			deviceCode: z.string({
				error: "'deviceCode' needs to be a string containing the device code assigned to the user code",
			}),
		},
		{
			error: "'content' is a required property",
		},
	),
});

export async function run(
	ws: ServerWebSocket<unknown>,
	message: z.infer<typeof bodyType>,
) {
	const auth = await db.query.deviceCode.findFirst({
		where: (deviceCode, { eq, and }) =>
			and(
				eq(deviceCode.userCode, message.content.userCode),
				eq(deviceCode.deviceCode, message.content.deviceCode),
			),
	});

	if (!auth)
		return createWSError(
			"watch_device_auth",
			message.id || message.content.userCode,
			WSErrors.NOT_FOUND,
		);

	if (auth.status !== "pending")
		return createWSError(
			"watch_device_auth",
			message.id || auth.userCode,
			WSErrors.CONFLICT,
		);

	ws.subscribe(`device_auth:${auth.userCode}`);

	setTimeout(() => {
		publishToSubscriber(
			`device_auth:${auth.userCode}`,
			"device_auth",
			auth.userCode,
			{
				action: "expired",
				userCode: auth.userCode,
			},
		);

		ws.unsubscribe(`device_auth:${auth.userCode}`);
	}, auth.expiresAt.getTime() - Date.now());

	return createWSResponse("watch_device_auth", message.id || auth.userCode, {
		userCode: auth.userCode,
	});
}

export default { bodyType, run };
