import type { Match } from "@chess-now/api";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import {
	buildErrorEmbed,
	ensureAuthenticatedDiscordUser,
	getErrorMessage,
	getOtherPlayer,
	renderBoard,
} from "../lib/utils";
import { DiscordUserModel } from "../schemas/user";

export class MatchCommand extends Subcommand {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options,
	) {
		super(context, {
			...options,
			name: "match",
			subcommands: [
				{ name: "list", chatInputRun: "chatInputList" },
				{ name: "activate", chatInputRun: "chatInputActivate" },
				{ name: "forfeit", chatInputRun: "chatInputForfeit" },
			],
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName("match")
				.setDescription("Manage your ChessNow matches")
				.addSubcommand((subcommand) =>
					subcommand
						.setName("list")
						.setDescription("List your currently running matches"),
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("activate")
						.setDescription(
							"Set one of your running matches as active",
						)
						.addIntegerOption((option) =>
							option
								.setName("match_id")
								.setDescription(
									"The running match ID you want to set as active",
								)
								.setRequired(true)
								.setMinValue(1),
						),
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("forfeit")
						.setDescription("Forfeit your activematch"),
				),
		);
	}

	public async chatInputList(
		interaction: Subcommand.ChatInputCommandInteraction,
	) {
		const discordUser = await ensureAuthenticatedDiscordUser(interaction);
		if (!discordUser) return;

		try {
			const matches = await this.container.chess.getMyMatches(
				discordUser.accessToken,
			);

			const activeMatches = matches.filter(
				(match) => match.status === "active",
			);
			const embed = new EmbedBuilder()
				.setTitle("Running matches")
				.setColor("Blurple")
				.setTimestamp();

			if (activeMatches.length === 0) {
				embed.setDescription("You have no running matches.");
			} else {
				embed.setDescription(
					activeMatches
						.slice(0, 10)
						.map((match) => {
							const otherPlayer = getOtherPlayer(
								match,
								discordUser.userId,
							);
							return `#${match.id} • vs. ${otherPlayer.username} (${otherPlayer.username})`;
						})
						.join("\n"),
				);
			}

			await interaction.editReply({ embeds: [embed] });
		} catch (error) {
			await interaction.editReply({
				embeds: [
					buildErrorEmbed(
						"Match command failed",
						getErrorMessage(error),
					),
				],
			});
		}
	}

	public async chatInputActivate(
		interaction: Subcommand.ChatInputCommandInteraction,
	) {
		const discordUser = await ensureAuthenticatedDiscordUser(interaction);
		if (!discordUser) return;

		try {
			const matches = await this.container.chess.getMyMatches(
				discordUser.accessToken,
			);

			const activeMatches = matches.filter(
				(match) => match.status === "active",
			);

			const matchId = interaction.options.getInteger("match_id", true);
			const match = activeMatches.find((entry) => entry.id === matchId);

			if (!match) {
				await interaction.editReply({
					embeds: [
						buildErrorEmbed(
							"Match not available",
							"That match is not one of your currently running matches.",
						),
					],
				});
				return;
			}

			await DiscordUserModel.updateOne(
				{ discordId: interaction.user.id },
				{ $set: { activeMatchId: match.id } },
			);

			const buffer = await renderBoard(
				match.fen,
				match.blackId === discordUser.userId,
			);
			const opponent = getOtherPlayer(match, discordUser.userId);

			const embed = new EmbedBuilder()
				.setTitle("Active match updated")
				.setDescription(
					[
						`Match #${match.id} is now your active match.`,
						`Opponent: ${opponent.name} (${opponent.username})`,
					].join("\n"),
				)
				.setColor("DarkGreen")
				.setImage("attachment://match.png")
				.setTimestamp();

			await interaction.editReply({
				embeds: [embed],
				files: [new AttachmentBuilder(buffer, { name: "match.png" })],
			});
		} catch (error) {
			await interaction.editReply({
				embeds: [
					buildErrorEmbed(
						"Match command failed",
						getErrorMessage(error),
					),
				],
			});
		}
	}

	public async chatInputForfeit(
		interaction: Subcommand.ChatInputCommandInteraction,
	) {
		const discordUser = await ensureAuthenticatedDiscordUser(interaction);
		if (!discordUser) return;

		if (!discordUser.activeMatchId) {
			await interaction.editReply({
				embeds: [
					buildErrorEmbed(
						"No active match",
						"Do `/accept` or accept a challenge first.",
					),
				],
			});
			return;
		}

		let match: Match;
		try {
			match = await this.container.chess.forfeitMatch(
				discordUser.activeMatchId,
				discordUser.accessToken,
			);
		} catch {
			await interaction.editReply({
				embeds: [
					buildErrorEmbed(
						"Error",
						"There was an error forfeiting the match. Maybe the match is no longer active?",
					),
				],
			});
			return;
		}

		const otherUser =
			discordUser.userId === match.whiteId
				? match.blackPlayer
				: match.whitePlayer;

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Match forfeited")
					.setDescription(
						`Successfully forfeited the active match vs. ${otherUser.name} (@${otherUser.username}).`,
					)
					.setColor("DarkGreen"),
			],
		});
	}
}
