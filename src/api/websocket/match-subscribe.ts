import type { ServerWebSocket } from "elysia/ws/bun";
import z from "zod";
import { auth } from "@/lib/auth";
import { createWSError, createWSResponse, WSErrors } from "../ws-response";

export const bodyType = z.object({
	type: z.literal("match_subscribe"),
	id: z.optional(z.string()),
	content: z.object(
		{
			id: z.number({
				error: "'id' needs to be a number",
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
			"match_subscribe",
			message.id || message.content.authorization,
			WSErrors.UNAUTHORIZED,
		);

	ws.subscribe(`match:${message.content.id}`);

	return createWSResponse(
		"match_subscribe",
		message.id || message.content.authorization,
		{
			matchId: message.content.id,
			userId: session.user.id,
		},
	);
}

export default { bodyType, run };
