import type { Challenge } from "./challenge";
import type { Match, Move } from "./match";

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

export type WsPushEvent =
	| { event: "device_auth"; payload: DeviceAuthPayload }
	| { event: "match:game_over"; payload: MatchGameOverPayload }
	| { event: "match:board-move"; payload: MatchMovePayload }
	| { event: "challenge:request"; payload: ChallengeRequestPayload }
	| { event: "challenge:accepted"; payload: ChallengeAcceptedPayload }
	| { event: "challenge:denied"; payload: ChallengeDeniedPayload };

export type ServerMessage<T extends WsPushEvent["event"]> = Extract<
	WsPushEvent,
	{ event: T }
> & {
	timestamp: number;
	target: string | undefined;
};
