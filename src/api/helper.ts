import type {
	Challenge,
	ChallengeConfig,
	Match,
	PublicUser,
	User,
} from "@chess-now/api";
import type { Chess } from "chess.js";
import { eq, or } from "drizzle-orm";
import z from "zod";
import { db, schemas, secondaryStorage } from "@/lib/database";

export const subscribeEventsSchema = z.array(z.enum(["challenge", "match"]));

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
	rules: z.array(z.enum(["noRematch", "noDraw"])),
	challengerColor: z.enum(["white", "black", "random"]),
	timeLimit: z.number().int(),
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

const challengeRules = ["noRematch", "noDraw"] as const;

export const challengeConfig = z.object(
	{
		color: z.optional(
			z.enum(["white", "black", "random"], {
				error: "'color' needs to be one of: 'white', 'black' or 'random'",
			}),
		),
		rules: z.optional(
			z.array(
				z.enum(challengeRules, {
					error: `'rules' needs to be an array of valid rules inside: ${challengeRules.map((a) => `'${a}'`).join(", ")}`,
				}),
				{
					error: "'rules' needs to be an array of valid rules",
				},
			),
		),
		timeLimit: z.optional(
			z
				.number({
					error: "'timeLimit' needs to be a number",
				})
				.min(0, {
					error: "'timeLimit' needs to be a minimum of 30 seconds",
				})
				.max(60 * 24, {
					error: "'timeLimit' needs to be a maximum of 1440 seconds (24 hours)",
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
	return (
		await db
			.insert(schemas.challenges)
			.values({
				fromId: challengerId,
				toId: challengedId,
				rules: config?.rules,
				challengerColor: config?.color,
			})
			.returning()
	)[0];
}

export async function getChallenges(userId: string): Promise<Challenge[]> {
	return await db
		.select()
		.from(schemas.challenges)
		.where(
			or(
				eq(schemas.challenges.toId, userId),
				eq(schemas.challenges.fromId, userId),
			),
		);
}

export async function getChallengeInfo(
	challengeId: number,
): Promise<Challenge | undefined> {
	const challenge = await db.query.challenges.findFirst({
		where: eq(schemas.challenges.id, challengeId),
		with: {
			match: true,
			from: {
				columns: {
					name: true,
					id: true,
					image: true,
					createdAt: true,
					updatedAt: true,
				},
			},
			to: {
				columns: {
					name: true,
					id: true,
					image: true,
					createdAt: true,
					updatedAt: true,
				},
			},
		},
	});
	return challenge;
}

export async function acceptChallenge(
	challenge: typeof schemas.challenges.$inferSelect,
): Promise<{
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
	)[0];

	await secondaryStorage.set(match.id, match);

	challenge = (
		await db
			.update(schemas.challenges)
			.set({
				matchId: match.id,
				status: "ongoing",
			})
			.where(eq(schemas.challenges.id, challenge.id))
			.returning()
	)[0];

	return {
		match,
		challenge,
	};
}

export async function getMatchInfo(
	matchId: number,
): Promise<Match | undefined> {
	const activeMatch = (await secondaryStorage.get(
		`match_${matchId}`,
	)) as typeof schemas.matches.$inferSelect;

	if (activeMatch) return activeMatch;

	return await db.query.matches.findFirst({
		where: (matches, { eq }) => eq(matches.id, matchId),
		with: {
			blackPlayer: {
				columns: {
					name: true,
					id: true,
					image: true,
					createdAt: true,
					updatedAt: true,
				},
			},
			whitePlayer: {
				columns: {
					name: true,
					id: true,
					image: true,
					createdAt: true,
					updatedAt: true,
				},
			},
		},
	});
}

export async function getUserInfo(
	userId: string,
	publicUser?: undefined,
): Promise<User | undefined>;
export async function getUserInfo(
	userId: string,
	publicUser: true,
): Promise<PublicUser | undefined>;
export async function getUserInfo(
	userId: string,
	publicUser: false,
): Promise<User | undefined>;
export async function getUserInfo(
	userId: string,
	publicUser: boolean = false,
): Promise<User | PublicUser | undefined> {
	const user = await db.query.user.findFirst({
		where: (user, { eq }) => eq(user.id, userId),
	});

	if (!user || !publicUser) return user;

	const { email, emailVerified, ...userWithoutEmail } = user;

	return userWithoutEmail;
}

export async function updateBoard(
	matchId: number,
	chess: Chess,
): Promise<Match> {
	const activeMatch = (await secondaryStorage.get(
		`match_${matchId}`,
	)) as typeof schemas.matches.$inferSelect;

	if (activeMatch) {
		activeMatch.fen = chess.fen();
		activeMatch.pgn = chess.pgn();
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
	)[0];

	if (match) await secondaryStorage.set(`match_${matchId}`, match);

	return match;
}

export async function endMatch(
	matchId: number,
	chess: Chess,
	endReason: Match["endReason"],
	status: Match["status"],
) {
	await secondaryStorage.delete(`match_${matchId}`);

	await db
		.update(schemas.matches)
		.set({
			fen: chess.fen(),
			pgn: chess.pgn(),
			endReason,
			status,
		})
		.where(eq(schemas.matches.id, matchId));
}

export async function getUserMatches(userId: string): Promise<Match[]> {
	const matches = await db.query.matches.findMany({
		where: (matches, { eq, or }) =>
			or(eq(matches.whiteId, userId), eq(matches.blackId, userId)),
		with: {
			blackPlayer: {
				columns: {
					name: true,
					id: true,
					image: true,
					createdAt: true,
					updatedAt: true,
				},
			},
			whitePlayer: {
				columns: {
					name: true,
					id: true,
					image: true,
					createdAt: true,
					updatedAt: true,
				},
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
