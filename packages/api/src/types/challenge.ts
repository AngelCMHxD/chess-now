export interface ChallengeConfig {
	color?: "white" | "black" | "random";
	rules?: ("noRematch" | "noDraw")[];
	timeLimit?: number;
}

export interface Challenge {
	id: number;
	createdAt: Date;
	from: string;
	to: string;
	rules: ("noRematch" | "noDraw")[];
	challengerColor: "white" | "black" | "random";
	timeLimit: number;
	status: "pending" | "denied" | "expired" | "ongoing" | "finished";
	matchId: number | null;
}
