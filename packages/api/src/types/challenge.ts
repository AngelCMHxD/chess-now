import type { PublicUser } from "./user";

export interface ChallengeConfig {
	color?: "white" | "black" | "random";
	rules?: ("noRematch" | "noDraw")[];
	timeLimit?: number;
}

export interface Challenge {
	id: number;
	createdAt: Date;
	fromId: string;
	from?: PublicUser;
	toId: string;
	to?: PublicUser;
	rules: ("noRematch" | "noDraw")[];
	challengerColor: "white" | "black" | "random";
	timeLimit: number;
	status: "pending" | "denied" | "expired" | "ongoing" | "finished";
	matchId: number | null;
}
