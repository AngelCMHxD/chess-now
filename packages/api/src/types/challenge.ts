import type { PublicUser } from "./user";

export interface ChallengeConfig {
	color?: "white" | "black" | "random";
	timeLimit?: number;
}

export interface Challenge {
	id: number;
	createdAt: Date;
	fromId: string;
	from?: PublicUser;
	toId: string;
	to?: PublicUser;
	challengerColor: "white" | "black" | "random";
	timeLimit: number;
	status: "pending" | "denied" | "expired" | "ongoing" | "finished";
	matchId: number | null;
}
