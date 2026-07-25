import type {
	Challenge,
	DeviceAuthInitResponse,
	DeviceTokenResponse,
	FriendRequest,
	Friendship,
	Match,
	Move,
	User,
} from "@chess-now/api";

// this type was made with AI
// it's pretty weird lol
export type ReplaceDatesWithStrings<T> = T extends Date
	? string
	: T extends Array<infer U>
		? Array<ReplaceDatesWithStrings<U>>
		: T extends object
			? { [K in keyof T]: ReplaceDatesWithStrings<T[K]> }
			: T;

export const Docs = {
	get User(): ReplaceDatesWithStrings<User> {
		return {
			id: "123e4567-e89b-12d3-a456-426614174000",
			name: "John Doe",
			username: "johndoe",
			createdAt: "2024-01-01T12:00:00Z",
			updatedAt: "2024-01-01T12:00:00Z",
			botOwnerId: null,
			rating: 1200,
			rd: 350,
			vol: 0.06,
		};
	},

	get BotUser(): ReplaceDatesWithStrings<User> {
		return {
			id: "555e4567-e89b-12d3-a456-426614174000",
			name: "Some Bot",
			username: "some_bot",
			createdAt: "2024-01-01T12:00:00Z",
			updatedAt: "2024-01-01T12:00:00Z",
			botOwnerId: "123e4567-e89b-12d3-a456-426614174000",
			rating: 1200,
			rd: 350,
			vol: 0.06,
		};
	},

	get DeviceInit(): ReplaceDatesWithStrings<DeviceAuthInitResponse> {
		return {
			deviceCode: "4krOEOckwOYmrnNLMC01HoHfIdDcIbRLpNXHtpUp",
			userCode: "AN23B5",
			verificationUri: `${process.env.NEXT_PUBLIC_BASE_URL}/device`,
			verificationUriComplete: `${process.env.NEXT_PUBLIC_BASE_URL}/device?code=AN23B5`,
			expiresIn: 300,
			interval: 5,
		};
	},

	get DeviceToken(): ReplaceDatesWithStrings<DeviceTokenResponse> {
		return {
			accessToken: "eyJhbGci...",
			tokenType: "Bearer",
			expiresIn: 604799,
			scope: ["account", "challenges"],
		};
	},

	get FriendRequest(): ReplaceDatesWithStrings<FriendRequest> {
		return {
			id: 1,
			createdAt: "2024-01-01T12:00:00Z",
			fromId: "123e4567-e89b-12d3-a456-426614174000",
			toId: "987e6543-e21b-34d5-a678-426614174000",
			status: "pending",
			from: this.User,
			to: Object.assign({}, this.User, {
				id: "987e6543-e21b-34d5-a678-426614174000",
				name: "Jane Doe",
				username: "janedoe",
			}),
		};
	},

	get Friendship(): ReplaceDatesWithStrings<Friendship> {
		return {
			id: 1,
			createdAt: "2024-01-01T12:00:00Z",
			userAId: "123e4567-e89b-12d3-a456-426614174000",
			userBId: "987e6543-e21b-34d5-a678-426614174000",
			userA: this.User,
			userB: Object.assign({}, this.User, {
				id: "987e6543-e21b-34d5-a678-426614174000",
				name: "Jane Doe",
				username: "janedoe",
			}),
		};
	},

	get Challenge(): ReplaceDatesWithStrings<Challenge> {
		return {
			id: 1,
			createdAt: "2024-01-01T12:00:00Z",
			fromId: "123e4567-e89b-12d3-a456-426614174000",
			toId: "987e6543-e21b-34d5-a678-426614174000",
			challengerColor: "random",
			status: "pending",
			matchId: null,
			from: this.User,
			to: Object.assign({}, this.User, {
				id: "987e6543-e21b-34d5-a678-426614174000",
				name: "Jane Doe",
				username: "janedoe",
			}),
		};
	},

	get Match(): ReplaceDatesWithStrings<Match> {
		return {
			id: 1,
			createdAt: "2024-01-01T12:00:00Z",
			status: "active",
			whiteId: "123e4567-e89b-12d3-a456-426614174000",
			blackId: "987e6543-e21b-34d5-a678-426614174000",
			endReason: null,
			fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
			pgn: `[Event "Casual"]\n[Site "${process.env.NEXT_PUBLIC_BASE_URL ?? "?"}"]\n[Date "2024.01.01"]\n[Round "0"]\n[White "johndoe"]\n[Black "janedoe"]\n[Result "*"]\n\n*`,
			finishedAt: null,
			whitePlayer: this.User,
			blackPlayer: Object.assign({}, this.User, {
				id: "987e6543-e21b-34d5-a678-426614174000",
				name: "Jane Doe",
				username: "janedoe",
			}),
			whiteRatingDiff: null,
			blackRatingDiff: null,
		};
	},

	get Move(): ReplaceDatesWithStrings<Move> {
		return {
			players: {
				whiteId: "123e4567-e89b-12d3-a456-426614174000",
				blackId: "987e6543-e21b-34d5-a678-426614174000",
			},
			turn: {
				before: "w",
				after: "b",
			},
			pgn: {
				before: `[Event "Casual"]\n[Site "${process.env.NEXT_PUBLIC_BASE_URL ?? "?"}"]\n[Date "2024.01.01"]\n[Round "0"]\n[White "johndoe"]\n[Black "janedoe"]\n[Result "*"]\n\n*`,
				after: `[Event "Casual"]\n[Site "${process.env.NEXT_PUBLIC_BASE_URL ?? "?"}"]\n[Date "2024.01.01"]\n[Round "1"]\n[White "johndoe"]\n[Black "janedoe"]\n[Result "*"]\n\n1. e4 *`,
			},
			fen: {
				before: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
				after: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
			},
			san: "e4",
			lan: "e2e4",
			piece: "p",
		};
	},
};

export const Responses = {
	get Success() {
		return { success: true, data: {} };
	},
	get SuccessResult() {
		return { success: true, data: { success: true } };
	},

	get User() {
		return { success: true, data: Docs.User };
	},
	get BotUser() {
		return { success: true, data: Docs.BotUser };
	},
	get Users() {
		return { success: true, data: [Docs.User] };
	},
	get BotUsers() {
		return { success: true, data: [Docs.BotUser] };
	},

	get FriendRequest() {
		return { success: true, data: Docs.FriendRequest };
	},
	get FriendRequests() {
		return { success: true, data: [Docs.FriendRequest] };
	},
	get Friendship() {
		return { success: true, data: Docs.Friendship };
	},
	get Friendships() {
		return { success: true, data: [Docs.Friendship] };
	},

	get Challenge() {
		return { success: true, data: Docs.Challenge };
	},
	get Challenges() {
		return { success: true, data: [Docs.Challenge] };
	},
	get ChallengeResult() {
		return { success: true, data: { challenge: Docs.Challenge } };
	},
	get ChallengeMatchResult() {
		return {
			success: true,
			data: { challenge: Docs.Challenge, match: Docs.Match },
		};
	},

	get Match() {
		return { success: true, data: Docs.Match };
	},
	get Matches() {
		return { success: true, data: [Docs.Match] };
	},
	get MoveResult() {
		return { success: true, data: { move: Docs.Move, match: Docs.Match } };
	},

	get CreateBot() {
		return {
			success: true,
			data: {
				bot: Docs.BotUser,
				apiKey: "bot_QeAQxBylNEjzEuUbWkQfQTlJZfgOmOKDebDsgzRQdXGQdOjpYSEuustFmEBakMua",
			},
		};
	},
	get ResetToken() {
		return {
			success: true,
			data: "bot_QeAQxBylNEjzEuUbWkQfQTlJZfgOmOKDebDsgzRQdXGQdOjpYSEuustFmEBakMua",
		};
	},

	get DeviceInit() {
		return { success: true, data: Docs.DeviceInit };
	},
	get DeviceToken() {
		return { success: true, data: Docs.DeviceToken };
	},
};
