import { ChessNowClient, type Match, type User } from "@chess-now/api";
import { Stockfish } from "@se-oss/stockfish";
import { ai, status } from "js-chess-engine";

export class ChessBot {
	private client: ChessNowClient;
	private user: User | null = null;
	private stockfish: Stockfish | null = null;

	constructor(
		token: string,
		private level: number,
		private acceptDraws: boolean = false,
		isStockfish: boolean = false,
	) {
		acceptDraws;
		this.client = new ChessNowClient("http://localhost:3000");
		this.client.setDefaultToken(token);
		if (isStockfish) {
			this.stockfish = new Stockfish();
		}
	}

	async start() {
		try {
			const user = await this.client.getAccountInfo();
			this.user = user;
			this.log(`connected as ${this.user.name} (@${this.user.username})`);

			this.setupHandlers();

			this.client.subscribe();
			await this.client.connect();

			const matches = await this.client.getMyMatches();
			for (const match of matches) {
				if (match.status === "active") {
					await this.handleDrawRequest(match);
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

						this.tryPlayMove(match);

						this.log(
							`accepted pending challenge on startup from ${challenge.from.username}, match ${match.id} started.`,
						);
					} catch (e) {
						this.log(
							`couldnt accept pending challenge on startup:`,
							e,
						);
					}
				}
			}

			const friendRequests = await this.client.getFriendRequests();
			for (const request of friendRequests) {
				if (request.status !== "pending") continue;
				await this.client.acceptFriendRequest(request.from.username);
				this.log(
					`accepted friend request from ${request.from.username}.`,
				);
			}
		} catch (e) {
			this.log(`Error starting bot:`, e);
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

				this.log(
					`accepted challenge from ${challenge.from.username}, match ${match.id} started.`,
				);
			} catch (e) {
				this.log(`couldnt accept challenge:`, e);
			}
		});

		this.client.on("match:board_move", (msg) => {
			this.tryPlayMove(msg.payload.match);
		});

		this.client.on("match:draw_request", async (msg) => {
			await this.handleDrawRequest(msg.payload.match);
		});

		this.client.on("challenge:accepted", (msg) => {
			this.tryPlayMove(msg.payload.match);
		});

		this.client.on("friend:request", async (msg) => {
			const request = msg.payload.request;
			try {
				await this.client.acceptFriendRequest(request.from.username);
				this.log(
					`accepted friend request from ${request.from.username}.`,
				);
			} catch (e) {
				this.log(`couldnt accept friend request:`, e);
			}
		});
	}

	private async tryPlayStockfishMove(
		match: Match,
	): Promise<string | undefined> {
		if (!this.stockfish) return;
		await this.stockfish.waitReady();

		const analysis = await this.stockfish.analyze(match.fen, this.level);

		return analysis.bestmove;
	}

	private tryPlayJsChessEngineMove(match: Match): string | undefined {
		const result = ai(match.fen, { level: this.level, play: false });
		if (!result.move) {
			this.log(`no move returned for match ${match.id}`);
			return;
		}

		// js-chess-engine returns move like {"E2": "E4"} or {"E7": "E8Q"}
		const moveEntry = Object.entries(result.move)[0];
		if (!moveEntry) return;

		const [from, to] = moveEntry;
		return `${from.toLowerCase()}${to.toLowerCase()}`;
	}

	private async handleDrawRequest(match: Match) {
		if (!this.user || match.status !== "active" || !match.activeDrawRequest)
			return;

		const requesterId =
			match.activeDrawRequest === "white"
				? match.whiteId
				: match.activeDrawRequest === "black"
					? match.blackId
					: null;

		if (!requesterId || requesterId === this.user.id) return;

		try {
			if (this.acceptDraws) {
				await this.client.acceptDraw(match.id);
				this.log(`accepted draw request on match ${match.id}`);
			} else {
				await this.client.denyDraw(match.id);
				this.log(`denied draw request on match ${match.id}`);
			}
		} catch (e) {
			this.log(`Error handling draw request on match ${match.id}:`, e);
		}
	}

	private async tryPlayMove(match: Match) {
		const chess = status(match.fen);
		if (match.status !== "active" || chess.isFinished) return;
		if (!this.user) return;

		const botColor = match.whiteId === this.user.id ? "w" : "b";
		const turnChar = match.fen.split(" ")[1];

		if (botColor !== turnChar) return;

		try {
			let move: string | undefined;
			if (this.stockfish) {
				move = await this.tryPlayStockfishMove(match);
			} else {
				move = this.tryPlayJsChessEngineMove(match);
			}
			if (!move) return;

			this.log(`moved ${move} on match ${match.id}`);
			await this.client.makeMove(match.id, move);
		} catch (e) {
			this.log(`Error moving on match ${match.id}:`, e);
		}
	}

	// biome-ignore lint/suspicious/noExplicitAny: i mean, console.log uses any anyways
	private log(...message: any) {
		if (this.stockfish) {
			console.log(`[Stockfish]`, ...message);
		} else {
			console.log(`[Level ${this.level}]`, ...message);
		}
	}
}
