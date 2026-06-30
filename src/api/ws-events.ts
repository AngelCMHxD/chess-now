import type { ServerMessage, WsPushEvent } from "@chess-now/api";
import { app } from "@/api";

export type {
	ServerMessage,
	WsPushEvent,
} from "@chess-now/api";

export function createWSMessage<T extends WsPushEvent["event"]>(
	event: T,
	target: string | undefined,
	payload: Extract<WsPushEvent, { event: T }>["payload"],
): string {
	const message = {
		event,
		target,
		payload,
		timestamp: Date.now(),
	} as ServerMessage<T>;
	return JSON.stringify(message);
}

export function publishToSubscriber<T extends WsPushEvent["event"]>(
	subscriber: string,
	event: T,
	target: string | undefined,
	payload: Extract<WsPushEvent, { event: T }>["payload"],
) {
	// biome-ignore lint/suspicious/noExplicitAny: still typesafe, as we are still forcing them on the argument
	const messageString = createWSMessage(event, target, payload as any);
	app.server?.publish(subscriber, messageString);
}
