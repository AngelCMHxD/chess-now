import { ChessNowError, type Match } from "@chess-now/api";
import ChessImageGenerator from "chess-fen2img";
import type { ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { type DiscordUser, DiscordUserModel } from "../schemas/user";

export async function renderBoard(fen: string, flipped = false) {
	const chessImageGenerator = new ChessImageGenerator({
		style: "neo",
		light: "#EEEED2",
		dark: "#769657",
		flipped,
	});

	await chessImageGenerator.loadFEN(fen);
	return chessImageGenerator.generateBuffer();
}

export function getOtherPlayer(match: Match, me: string) {
	return match.whiteId === me ? match.blackPlayer : match.whitePlayer;
}

export async function getAuthenticatedDiscordUser(discordId: string) {
	return DiscordUserModel.findOne({
		discordId,
	}).lean<DiscordUser | null>();
}

export function buildErrorEmbed(title: string, description: string) {
	return new EmbedBuilder()
		.setTitle(title)
		.setDescription(description)
		.setColor("DarkRed")
		.setTimestamp();
}

export async function ensureAuthenticatedDiscordUser(
	interaction: ChatInputCommandInteraction,
) {
	const user = await getAuthenticatedDiscordUser(interaction.user.id);

	if (!user) {
		await interaction.editReply({
			embeds: [
				buildErrorEmbed(
					"Not authenticated",
					"Run `/auth` before using this command.",
				),
			],
			components: [],
		});
		return null;
	}

	return user;
}

export function getErrorMessage(error: unknown) {
	if (error instanceof ChessNowError || error instanceof Error) {
		return error.message;
	}

	return "An unexpected error occurred.";
}
