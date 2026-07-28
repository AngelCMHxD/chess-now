import type { Match } from "@chess-now/api";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { EmbedBuilder } from "discord.js";
import { buildErrorEmbed, ensureAuthenticatedDiscordUser } from "../lib/utils";

export class FriendsCommand extends Subcommand {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options,
	) {
		super(context, {
			...options,
			name: "draw",
			subcommands: [
				{ name: "request", chatInputRun: "chatInputRequest" },
				{
					name: "accept",
					chatInputRun: "chatInputAccept",
				},
				{ name: "deny", chatInputRun: "chatInputDeny" },
			],
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName("draw")
				.setDescription("Send/Accept/Deny a draw request")
				.addSubcommand((sub) =>
					sub
						.setName("request")
						.setDescription(
							"Send a draw request on your active match",
						),
				)
				.addSubcommand((sub) =>
					sub
						.setName("accept")
						.setDescription("Accept a draw request"),
				)
				.addSubcommand((sub) =>
					sub.setName("deny").setDescription("Deny a draw request"),
				),
		);
	}

	public async chatInputRequest(
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
			match = await this.container.chess.requestDraw(
				discordUser.activeMatchId,
				discordUser.accessToken,
			);
		} catch {
			await interaction.editReply({
				embeds: [
					buildErrorEmbed(
						"Error",
						"There was an error requesting a draw. Maybe the match is no longer active?",
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
					.setTitle("Draw request sent")
					.setDescription(
						`Successfully sent a draw request to ${otherUser.name} (@${otherUser.username}).`,
					)
					.setColor("DarkGreen"),
			],
		});
	}

	public async chatInputAccept(
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
			match = await this.container.chess.acceptDraw(
				discordUser.activeMatchId,
				discordUser.accessToken,
			);
		} catch {
			await interaction.editReply({
				embeds: [
					buildErrorEmbed(
						"Error",
						"There was an error accepting the draw. Maybe the match is no longer active or there isn't an active draw request?",
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
					.setTitle("Draw request accepted")
					.setDescription(
						`Successfully accepted the draw request from ${otherUser.name} (@${otherUser.username}).`,
					)
					.setColor("DarkGreen"),
			],
		});
	}

	public async chatInputDeny(
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
			match = await this.container.chess.denyDraw(
				discordUser.activeMatchId,
				discordUser.accessToken,
			);
		} catch {
			await interaction.editReply({
				embeds: [
					buildErrorEmbed(
						"Error",
						"There was an error denying the draw. Maybe the match is no longer active or there isn't an active draw request?",
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
					.setTitle("Draw request denied")
					.setDescription(
						`Successfully denied the draw request from ${otherUser.name} (@${otherUser.username}).`,
					)
					.setColor("DarkGreen"),
			],
		});
	}
}
