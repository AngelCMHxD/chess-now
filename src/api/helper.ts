import type {
	Challenge,
	ChallengeConfig,
	FriendRequest,
	Friendship,
	Match,
	User,
} from "@chess-now/api";
import type { Chess } from "chess.js";
import { eq } from "drizzle-orm";
import z from "zod";
import type { Session } from "@/lib/auth-client";
import { db, schemas, secondaryStorage } from "@/lib/database";

export const publicUserColumns = {
	name: true,
	username: true,
	id: true,
	image: true,
	createdAt: true,
	updatedAt: true,
	botOwnerId: true,
} as Record<keyof User, true>;

export const subscribeEventsSchema = z.array(
	z.enum(["challenge", "match", "friend"]),
);

export const moveSchema = z.object({
	players: z.object({
		whiteId: z.string(),
		blackId: z.string(),
	}),
	turn: z.object({
		before: z.string(),
		after: z.string(),
	}),
	pgn: z.object({
		before: z.string(),
		after: z.string(),
	}),
	fen: z.object({
		before: z.string(),
		after: z.string(),
	}),
	san: z.string(),
	lan: z.string(),
	piece: z.string(),
});

export const matchSchema = z.object({
	id: z.number().int(),
	createdAt: z.date(),
	status: z.enum(["active", "draw", "white_won", "black_won"]),
	whiteId: z.string(),
	blackId: z.string(),
	endReason: z
		.enum([
			"checkmate",
			"draw",
			"stalemate",
			"insufficient-material",
			"50-moves",
		])
		.nullable(),
	fen: z.string(),
	pgn: z.string(),
	finishedAt: z.date().nullable(),
});

export const challengeSchema = z.object({
	id: z.number().int(),
	createdAt: z.date(),
	from: z.string(),
	to: z.string(),
	challengerColor: z.enum(["white", "black", "random"]),
	status: z.enum(["pending", "denied", "expired", "ongoing", "finished"]),
	matchId: z.number().int().nullable(),
});

export const authHeadersSchema = z
	.looseObject({
		cookie: z.string().optional(),
		authorization: z.optional(
			z.string().startsWith("Bearer ", {
				error: "'authorization' header must start with 'Bearer '",
			}),
		),
	})
	.refine((data) => data.cookie || data.authorization, {
		message:
			"Either a 'cookie' or an 'authorization' header must be provided",
		path: ["authorization"],
	});

export const challengeConfig = z.object(
	{
		color: z.optional(
			z.enum(["white", "black", "random"], {
				error: "'color' needs to be one of: 'white', 'black' or 'random'",
			}),
		),
	},
	{
		error: "'options' needs to be an object with valid options",
	},
);

export async function createChallenge(
	challengerId: string,
	challengedId: string,
	config?: ChallengeConfig,
): Promise<Challenge> {
	const inserted = (
		await db
			.insert(schemas.challenges)
			.values({
				fromId: challengerId,
				toId: challengedId,
				challengerColor: config?.color,
			})
			.returning()
	)[0];

	return (await getChallengeInfo(inserted.id)) as Challenge;
}

export async function getChallenges(userId: string): Promise<Challenge[]> {
	return await db.query.challenges.findMany({
		where: (challenges, { eq, or }) =>
			or(eq(challenges.toId, userId), eq(challenges.fromId, userId)),
		with: {
			from: {
				columns: publicUserColumns,
			},
			to: {
				columns: publicUserColumns,
			},
		},
	});
}

export async function getChallengeInfo(
	challengeId: number,
): Promise<Challenge | undefined> {
	const challenge = await db.query.challenges.findFirst({
		where: eq(schemas.challenges.id, challengeId),
		with: {
			match: true,
			from: {
				columns: publicUserColumns,
			},
			to: {
				columns: publicUserColumns,
			},
		},
	});
	return challenge;
}

export async function acceptChallenge(challenge: Challenge): Promise<{
	match: Match;
	challenge: Challenge;
}> {
	let whiteId: string;
	let blackId: string;

	if (challenge.challengerColor === "white") {
		whiteId = challenge.fromId;
		blackId = challenge.toId;
	} else if (challenge.challengerColor === "black") {
		blackId = challenge.fromId;
		whiteId = challenge.toId;
	} else {
		if (Math.random() < 0.5) {
			whiteId = challenge.fromId;
			blackId = challenge.toId;
		} else {
			blackId = challenge.fromId;
			whiteId = challenge.toId;
		}
	}

	const match = (
		await db
			.insert(schemas.matches)
			.values({
				whiteId: whiteId,
				blackId: blackId,
			})
			.returning()
	)[0] as Match;

	if (whiteId === challenge.fromId) {
		match.whitePlayer = challenge.from as User;
		match.blackPlayer = challenge.to as User;
	} else {
		match.whitePlayer = challenge.to as User;
		match.blackPlayer = challenge.from as User;
	}

	await secondaryStorage.set(`match_${match.id}`, match);

	const updatedChallenge = (
		await db
			.update(schemas.challenges)
			.set({
				matchId: match.id,
				status: "ongoing",
			})
			.where(eq(schemas.challenges.id, challenge.id))
			.returning()
	)[0] as Challenge;

	updatedChallenge.from = challenge.from;
	updatedChallenge.to = challenge.to;

	return {
		match,
		challenge: updatedChallenge,
	};
}

export async function getMatchInfo(
	matchId: number,
): Promise<Match | undefined> {
	const activeMatch = (await secondaryStorage.get(
		`match_${matchId}`,
	)) as Match;

	if (activeMatch) {
		if (activeMatch.whitePlayer && activeMatch.blackPlayer) {
			return activeMatch;
		}

		// just in case the match is not populated, load it from the database

		activeMatch.whitePlayer = (await getUserInfo(
			activeMatch.whiteId,
		)) as User;
		activeMatch.blackPlayer = (await getUserInfo(
			activeMatch.blackId,
		)) as User;

		await secondaryStorage.set(`match_${matchId}`, activeMatch);
		return activeMatch;
	}

	return await db.query.matches.findFirst({
		where: (matches, { eq }) => eq(matches.id, matchId),
		with: {
			blackPlayer: {
				columns: publicUserColumns,
			},
			whitePlayer: {
				columns: publicUserColumns,
			},
		},
	});
}

export async function getUserInfo(userId: string): Promise<User | undefined> {
	const user = await db.query.user.findFirst({
		where: (user, { eq }) => eq(user.id, userId),
	});

	if (!user) return;

	return removePrivateUserFields(user);
}

export async function getUserByUsername(username: string) {
	return await db.query.user.findFirst({
		where: (user, { eq }) => eq(user.username, username),
	});
}

export async function updateBoard(
	matchId: number,
	chess: Chess,
): Promise<Match> {
	const activeMatch = (await secondaryStorage.get(
		`match_${matchId}`,
	)) as Match;

	if (activeMatch) {
		activeMatch.fen = chess.fen();
		activeMatch.pgn = chess.pgn();

		if (!activeMatch.whitePlayer) {
			activeMatch.whitePlayer = (await getUserInfo(
				activeMatch.whiteId,
			)) as User;
		}

		if (!activeMatch.blackPlayer) {
			activeMatch.blackPlayer = (await getUserInfo(
				activeMatch.blackId,
			)) as User;
		}

		await secondaryStorage.set(`match_${matchId}`, activeMatch);
		return activeMatch;
	}

	const match = (
		await db
			.update(schemas.matches)
			.set({
				fen: chess.fen(),
				pgn: chess.pgn(),
			})
			.where(eq(schemas.matches.id, matchId))
			.returning()
	)[0] as Match;

	if (match) {
		if (!match.whitePlayer) {
			match.whitePlayer = (await getUserInfo(match.whiteId)) as User;
		}

		if (!match.blackPlayer) {
			match.blackPlayer = (await getUserInfo(match.blackId)) as User;
		}

		await secondaryStorage.set(`match_${matchId}`, match);
	}

	return match;
}

export async function getUserMatches(userId: string): Promise<Match[]> {
	const matches = await db.query.matches.findMany({
		where: (matches, { eq, or }) =>
			or(eq(matches.whiteId, userId), eq(matches.blackId, userId)),
		with: {
			blackPlayer: {
				columns: publicUserColumns,
			},
			whitePlayer: {
				columns: publicUserColumns,
			},
		},
	});

	for (const [i, match] of matches.entries()) {
		if (match.status !== "active") continue;

		const activeMatch = (await secondaryStorage.get(
			`match_${match.id}`,
		)) as (typeof matches)[number];
		if (!activeMatch) continue;

		matches[i].fen = activeMatch.fen;
		matches[i].pgn = activeMatch.pgn;
	}

	return matches;
}

export async function getFriendRequests(
	userId: string,
): Promise<FriendRequest[]> {
	const requests = await db.query.friendRequests.findMany({
		where: (requests, { eq, or }) =>
			or(eq(requests.toId, userId), eq(requests.fromId, userId)),
		with: {
			from: {
				columns: publicUserColumns,
			},
			to: {
				columns: publicUserColumns,
			},
		},
	});

	return requests;
}

export async function getFriendships(userId: string): Promise<Friendship[]> {
	const friends = await db.query.friendships.findMany({
		where: (friends, { eq, or }) =>
			or(eq(friends.userAId, userId), eq(friends.userBId, userId)),
		with: {
			userA: {
				columns: publicUserColumns,
			},
			userB: {
				columns: publicUserColumns,
			},
		},
	});

	return friends;
}

export function removePrivateUserFields(user: Session["user"]): User {
	return Object.fromEntries(
		Object.entries(user).filter(([key]) => key in publicUserColumns),
	) as unknown as User; // it worked without the cast before, don't know why it doesnt now
}

// only external auth sessions (like device auth) have scopes
export function isExternalAuth(session: Session) {
	return (session?.session?.scopes?.length ?? 0) > 0;
}
