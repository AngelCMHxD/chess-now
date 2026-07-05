import type { PublicUser } from "./user";

export interface Move {
	players: {
		whiteId: string;
		blackId: string;
	};
	turn: {
		before: "b" | "w";
		after: "b" | "w";
	};
	pgn: {
		before: string;
		after: string;
	};
	fen: {
		before: string;
		after: string;
	};
	san: string;
	lan: string;
	piece: string;
}

export interface Match {
	id: number;
	createdAt: Date;
	status: "active" | "draw" | "white_won" | "black_won";
	whiteId: string;
	blackId: string;
	endReason:
		| "checkmate"
		| "draw"
		| "stalemate"
		| "insufficient-material"
		| "50-moves"
		| null;
	fen: string;
	pgn: string;
	finishedAt: Date | null;
	whitePlayer?: PublicUser;
	blackPlayer?: PublicUser;
}
