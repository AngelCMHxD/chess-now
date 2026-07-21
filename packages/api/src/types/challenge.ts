import type { User } from "./user";

export interface ChallengeConfig {
	color?: "white" | "black" | "random";
}

export interface Challenge {
	id: number;
	createdAt: Date;
	fromId: string;
	from?: User;
	toId: string;
	to?: User;
	challengerColor: "white" | "black" | "random";
	status: "pending" | "denied" | "expired" | "ongoing" | "finished";
	matchId: number | null;
}
