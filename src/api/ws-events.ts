import { app } from "@/api";
import type { Challenge, Match, Move } from "@/api/helper";

export interface DeviceAuthPayload {
	action: "approved" | "denied" | "expired";
	userCode: string;
}

export interface MatchGameOverPayload {
	match: Match;
	lastMove: Move;
}

export interface MatchMovePayload {
	match: Match;
	move: Move;
}

export interface ChallengeRequestPayload {
	challenge: Challenge;
}

export interface ChallengeDeniedPayload {
	challengeId: number;
	deniedBy: string;
}

export interface ChallengeAcceptedPayload {
	challengeId: number;
	acceptedBy: string;
	match: Match;
}

export type WebSocketEvent =
	| { event: "device_auth"; payload: DeviceAuthPayload }
	| { event: "match:game_over"; payload: MatchGameOverPayload }
	| { event: "match:board-move"; payload: MatchMovePayload }
	| { event: "challenge:request"; payload: ChallengeRequestPayload }
	| { event: "challenge:accepted"; payload: ChallengeAcceptedPayload }
	| { event: "challenge:denied"; payload: ChallengeDeniedPayload };

export type ServerMessage<T extends WebSocketEvent["event"]> = Extract<
	WebSocketEvent,
	{ event: T }
> & {
	timestamp: number;
	target: string | undefined;
};

export function createWSMessage<T extends WebSocketEvent["event"]>(
	event: T,
	target: string | undefined,
	payload: Extract<WebSocketEvent, { event: T }>["payload"],
): string {
	const message = {
		event,
		target,
		payload,
		timestamp: Date.now(),
	} as ServerMessage<T>;
	return JSON.stringify(message);
}

export function publishToSubscriber<T extends WebSocketEvent["event"]>(
	subscriber: string,
	event: T,
	target: string | undefined,
	payload: Extract<WebSocketEvent, { event: T }>["payload"],
) {
	// biome-ignore lint/suspicious/noExplicitAny: still typesafe, as we are still forcing them on the argument
	const messageString = createWSMessage(event, target, payload as any);
	app.server?.publish(subscriber, messageString);
}
