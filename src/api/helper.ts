import type { Chess } from "chess.js";
import { eq, or } from "drizzle-orm";
import z from "zod";
import { db, schemas, secondaryStorage } from "@/lib/database";

export const subscribeEventsSchema = z.array(z.enum(["challenge", "match"]));
export type SubscribeEvents = z.infer<typeof subscribeEventsSchema>;

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

export type Move = z.infer<typeof moveSchema>;

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

export type Match = z.infer<typeof matchSchema>;

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

export type Challenge = z.infer<typeof challengeSchema>;

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
	config?: z.infer<typeof challengeConfig>,
): Promise<Challenge> {
	return (
		await db
			.insert(schemas.challenges)
			.values({
				from: challengerId,
				to: challengedId,
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
				eq(schemas.challenges.to, userId),
				eq(schemas.challenges.from, userId),
			),
		);
}

export async function getChallengeInfo(
	challengeId: number,
): Promise<Challenge | undefined> {
	return (
		await db
			.select()
			.from(schemas.challenges)
			.where(eq(schemas.challenges.id, challengeId))
	)[0];
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
		whiteId = challenge.from;
		blackId = challenge.to;
	} else if (challenge.challengerColor === "black") {
		blackId = challenge.from;
		whiteId = challenge.to;
	} else {
		if (Math.random() < 0.5) {
			whiteId = challenge.from;
			blackId = challenge.to;
		} else {
			blackId = challenge.from;
			whiteId = challenge.to;
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
	});
}

export async function getUserInfo(userId: string) {
	return (
		await db.select().from(schemas.user).where(eq(schemas.user.id, userId))
	)[0];
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
