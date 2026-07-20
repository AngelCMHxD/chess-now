import type { PublicUser } from "./user";

export interface ChallengeConfig {
	color?: "white" | "black" | "random";
}

export interface Challenge {
	id: number;
	createdAt: Date;
	fromId: string;
	from?: PublicUser;
	toId: string;
	to?: PublicUser;
	challengerColor: "white" | "black" | "random";
	status: "pending" | "denied" | "expired" | "ongoing" | "finished";
	matchId: number | null;
}
