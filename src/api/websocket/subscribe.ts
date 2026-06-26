import type { ServerWebSocket } from "elysia/ws/bun";
import z from "zod";
import { subscribeEventsSchema } from "@/api/helper";
import { auth } from "@/lib/auth";
import { createWSError, createWSResponse, WSErrors } from "../ws-response";

const allEvents = subscribeEventsSchema.element.options;

export const bodyType = z.object({
	type: z.literal("subscribe"),
	id: z.optional(z.string()),
	content: z.object(
		{
			events: z.union([subscribeEventsSchema, z.literal("all")], {
				error: `'events' needs to be 'all' or an array of valid events to listen: ${allEvents.map((a) => `'${a}'`).join(", ")}`,
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

	if (!session)
		return createWSError(
			"subscribe",
			message.id || message.content.authorization,
			WSErrors.UNAUTHORIZED,
		);

	if (message.content.events === "all") message.content.events = allEvents;

	for (const event of message.content.events) {
		ws.subscribe(`${event}:${session.user.id}`);
	}

	return createWSResponse(
		"subscribe",
		message.id || message.content.authorization,
		{
			events: message.content.events,
			userId: session.user.id,
		},
	);
}

export default { bodyType, run };
