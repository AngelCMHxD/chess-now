import type { Challenge } from "./challenge";
import type { Match, Move } from "./match";
import type { FriendRequest, Friendship, PublicUser } from "./user";

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
	deniedBy: PublicUser;
}

export interface ChallengeAcceptedPayload {
	challengeId: number;
	acceptedBy: PublicUser;
	match: Match;
}

export interface FriendRequestPayload {
	request: FriendRequest;
}

export interface FriendDeniedPayload {
	request: FriendRequest;
}

export interface FriendAcceptedPayload {
	friendship: Friendship;
}

export interface FriendRemovedPayload {
	friendship: Friendship;
}

export type WsPushEvent =
	| { event: "device_auth"; payload: DeviceAuthPayload }
	| { event: "match:game_over"; payload: MatchGameOverPayload }
	| { event: "match:board-move"; payload: MatchMovePayload }
	| { event: "challenge:request"; payload: ChallengeRequestPayload }
	| { event: "challenge:accepted"; payload: ChallengeAcceptedPayload }
	| { event: "challenge:denied"; payload: ChallengeDeniedPayload }
	| { event: "friend:request"; payload: FriendRequestPayload }
	| { event: "friend:accepted"; payload: FriendAcceptedPayload }
	| { event: "friend:denied"; payload: FriendDeniedPayload }
	| { event: "friend:removed"; payload: FriendRemovedPayload };

export type ServerMessage<T extends WsPushEvent["event"]> = Extract<
	WsPushEvent,
	{ event: T }
> & {
	timestamp: number;
	target: string | undefined;
};
