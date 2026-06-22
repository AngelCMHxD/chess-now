import type { ServerWebSocket } from "elysia/ws/bun";
import z from "zod";
import { db } from "@/lib/database";

export const bodyType = z.object({
	type: z.literal("watch-device-auth"),
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

	if (!auth) {
		return JSON.stringify({
			type: "error",
			content: {
				code: 404,
				error: "Not Found",
				from: "watch-device-auth",
			},
		});
	}

	if (auth.status !== "pending")
		return JSON.stringify({
			type: "error",
			content: {
				code: 409,
				error: "Conflict",
				from: "watch-device-auth",
			},
		});

	ws.subscribe(`device-auth:${auth.userCode}`);

	setTimeout(() => {
		ws.publish(
			`device-auth:${auth.userCode}`,
			JSON.stringify({
				type: "device-auth",
				content: {
					action: "expired",
					userCode: auth.userCode,
				},
			}),
		);
		ws.unsubscribe(`device-auth:${auth.userCode}`);
	}, auth.expiresAt.getTime() - Date.now());

	return JSON.stringify({
		type: "success",
		content: {
			type: "watch-device-auth",
			userCode: auth.userCode,
		},
	});
}

export default { bodyType, run };
