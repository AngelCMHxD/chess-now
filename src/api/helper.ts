import { eq, or } from "drizzle-orm";
import z from "zod";
import { db, schemas } from "@/lib/database";

const challengeRules = ["noRematch", "noDraw"] as const;

export const challengeConfig = z.object(
	{
		color: z.optional(
			z.union(
				[z.literal("white"), z.literal("black"), z.literal("random")],
				{
					error: "'color' needs to be one of: 'white', 'black' or 'random'",
				},
			),
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
) {
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

export async function getChallenges(userId: string) {
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

export async function getChallengeInfo(challengeId: number) {
	return (
		await db
			.select()
			.from(schemas.challenges)
			.where(eq(schemas.challenges.id, challengeId))
	)[0];
}

export async function acceptChallenge(
	challenge: typeof schemas.challenges.$inferSelect,
) {
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

export async function getMatchInfo(matchId: number) {
	return (
		await db
			.select()
			.from(schemas.matches)
			.where(eq(schemas.matches.id, matchId))
	)[0];
}

export async function getUserInfo(userId: string) {
	return (
		await db.select().from(schemas.user).where(eq(schemas.user.id, userId))
	)[0];
}
