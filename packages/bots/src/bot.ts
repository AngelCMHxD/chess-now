import { ChessNowClient, type Match, type User } from "@chess-now/api";
import { ai, status } from "js-chess-engine";

export class ChessBot {
	private client: ChessNowClient;
	private user: User | null = null;

	constructor(
		token: string,
		private level: number,
	) {
		this.client = new ChessNowClient("http://localhost:3000");
		this.client.setDefaultToken(token);
	}

	async start() {
		try {
			const user = await this.client.getAccountInfo();
			this.user = user;
			console.log(
				`[Level ${this.level}] connected as ${this.user.name} (@${this.user.username})`,
			);

			this.setupHandlers();

			this.client.subscribe();
			await this.client.connect();

			const matches = await this.client.getMyMatches();
			for (const match of matches) {
				if (match.status === "active") {
					this.tryPlayMove(match);
				}
			}

			const challenges = await this.client.getMyChallenges();
			for (const challenge of challenges) {
				if (
					challenge.status === "pending" &&
					challenge.toId === this.user.id
				) {
					try {
						const { match } = await this.client.acceptChallenge(
							challenge.id,
						);
						console.log(
							`[Level ${this.level}] accepted pending challenge on startup from ${challenge.from.username}, match ${match.id} started.`,
						);
					} catch (e) {
						console.error(
							`[Level ${this.level}] couldnt accept pending challenge on startup:`,
							e,
						);
					}
				}
			}

			const friendRequests = await this.client.getFriendRequests();
			for (const request of friendRequests) {
				if (request.status !== "pending") continue;
				await this.client.acceptFriendRequest(request.from.username);
				console.log(
					`[Level ${this.level}] accepted friend request from ${request.from.username}.`,
				);
			}
		} catch (e) {
			console.error(`[Level ${this.level}] Error starting bot:`, e);
		}
	}

	private setupHandlers() {
		this.client.on("challenge:request", async (msg) => {
			const challenge = msg.payload.challenge;
			try {
				const { match } = await this.client.acceptChallenge(
					challenge.id,
				);

				this.tryPlayMove(match);

				console.log(
					`[Level ${this.level}] accepted challenge from ${challenge.from.username}, match ${match.id} started.`,
				);
			} catch (e) {
				console.error(
					`[Level ${this.level}] couldnt accept challenge:`,
					e,
				);
			}
		});

		this.client.on("match:board_move", (msg) => {
			this.tryPlayMove(msg.payload.match);
		});

		this.client.on("challenge:accepted", (msg) => {
			this.tryPlayMove(msg.payload.match);
		});

		this.client.on("friend:request", async (msg) => {
			const request = msg.payload.request;
			try {
				await this.client.acceptFriendRequest(request.from.username);
				console.log(
					`[Level ${this.level}] accepted friend request from ${request.from.username}.`,
				);
			} catch (e) {
				console.error(
					`[Level ${this.level}] couldnt accept friend request:`,
					e,
				);
			}
		});
	}

	private async tryPlayMove(match: Match) {
		const chess = status(match.fen);
		if (match.status !== "active" || chess.isFinished) return;
		if (!this.user) return;

		const botColor = match.whiteId === this.user.id ? "w" : "b";
		const turnChar = match.fen.split(" ")[1];

		if (botColor !== turnChar) return;

		try {
			const result = ai(match.fen, { level: this.level, play: false });
			if (!result.move) {
				console.log(
					`[Level ${this.level}] no move returned for match ${match.id}`,
				);
				return;
			}

			// js-chess-engine returns move like {"E2": "E4"} or {"E7": "E8Q"}
			const moveEntry = Object.entries(result.move)[0];
			if (!moveEntry) return;
			const [from, to] = moveEntry;
			const moveLan = `${from.toLowerCase()}${to.toLowerCase()}`;

			console.log(
				`[Level ${this.level}] moved ${moveLan} on match ${match.id}`,
			);
			await this.client.makeMove(match.id, moveLan);
		} catch (e) {
			console.error(
				`[Level ${this.level}] Error moving on match ${match.id}:`,
				e,
			);
		}
	}
}
