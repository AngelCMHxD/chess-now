import { Command } from "@sapphire/framework";
import { EmbedBuilder, MessageFlags } from "discord.js";
import {
	buildErrorEmbed,
	ensureAuthenticatedDiscordUser,
	getErrorMessage,
	getOtherPlayer,
	renderBoard,
} from "../lib/utils";
import { DiscordUserModel } from "../schemas/user";

export class MoveCommand extends Command {
	public constructor(
		context: Command.LoaderContext,
		options: Command.Options,
	) {
		super(context, { ...options });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName("move")
				.setDescription("Play a LAN/SAN move in your active match")
				.addStringOption((option) =>
					option
						.setName("move")
						.setDescription(
							"The LAN/SAN move to play, e.g. Nf3 or e3e4",
						)
						.setRequired(true),
				),
		);
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction,
	) {
		await interaction.deferReply({
			flags: [MessageFlags.Ephemeral],
		});

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

		const move = interaction.options.getString("move", true);

		try {
			const result = await this.container.chess.makeMove(
				discordUser.activeMatchId,
				move,
				discordUser.accessToken,
			);

			await DiscordUserModel.updateOne(
				{ discordId: interaction.user.id },
				{
					$set: {
						activeMatchId:
							result.match.status === "active"
								? result.match.id
								: null,
					},
				},
			);

			const buffer = await renderBoard(
				result.match.fen,
				result.match.blackId === discordUser.userId,
			);

			const oponent = getOtherPlayer(result.match, discordUser.userId);

			const embed = new EmbedBuilder()
				.setTitle(`Move played: ${result.move.lan}`)
				.setDescription(
					[
						`Match #${result.match.id}`,
						`vs. ${oponent?.name} (${oponent?.username})`,
						`Status: ${result.match.status}`,
						result.match.status === "active"
							? "There was a move on your active match."
							: "The match is no longer active. Your active match was cleared.",
					].join("\n"),
				)
				.setColor("Blurple")
				.setImage("attachment://match.png")
				.setTimestamp();

			await interaction.editReply({
				embeds: [embed],
				files: [{ attachment: buffer, name: "match.png" }],
			});
		} catch (error) {
			await interaction.editReply({
				embeds: [
					buildErrorEmbed("Move failed", getErrorMessage(error)),
				],
			});
		}
	}
}
