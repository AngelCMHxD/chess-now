import type { ServerWebSocket } from "elysia/ws/bun";
import z from "zod";
import { auth } from "@/lib/auth";

export const validEvents = ["challenge"] as const;

export const bodyType = z.object({
	type: z.literal("subscribe"),
	content: z.object(
		{
			events: z.union([z.array(z.enum(validEvents)), z.literal("all")], {
				error: `'events' needs to be 'all' or an array of valid events to listen: ${validEvents.map((a) => `'${a}'`).join(", ")}`,
			}),
			authorization: z.string({
				error: "'authorization' needs to be a string containing the user's Bearer token: 'Bearer <token>'",
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
	const session = await auth.api.getSession({
		headers: {
			Authorization: message.content.authorization as string,
		},
	});

	if (!session) {
		return {
			type: "error",
			content: {
				code: 401,
				error: "Unauthorized",
				from: "subscribe",
			},
		};
	}

	if (message.content.events === "all")
		message.content.events =
			validEvents as unknown as (typeof validEvents)[number][];

	for (const event of message.content.events) {
		ws.subscribe(`${event}:${session.user.id}`);
	}

	return {
		type: "success",
		content: {
			type: "subscribe",
			events: message.content.events,
			from: "subscribe",
			userId: session.user.id,
		},
	};
}

export default { bodyType, run };
