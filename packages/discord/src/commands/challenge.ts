import { ChessNowError } from "@chess-now/api";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { EmbedBuilder } from "discord.js";
import {
	buildErrorEmbed,
	ensureAuthenticatedDiscordUser,
	getErrorMessage,
	renderBoard,
} from "../lib/utils";
import { DiscordUserModel } from "../schemas/user";

export class ChallengeCommand extends Subcommand {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options,
	) {
		super(context, {
			...options,
			name: "challenge",
			subcommands: [
				{ name: "send", chatInputRun: "chatInputSend" },
				{ name: "list", chatInputRun: "chatInputList" },
				{ name: "accept", chatInputRun: "chatInputAccept" },
				{ name: "deny", chatInputRun: "chatInputDeny" },
			],
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName("challenge")
				.setDescription("Manage ChessNow challenges")
				.addSubcommand((subcommand) =>
					subcommand
						.setName("send")
						.setDescription("Send a challenge to a ChessNow user")
						.addStringOption((option) =>
							option
								.setName("username")
								.setDescription(
									"The ChessNow username to challenge",
								)
								.setRequired(true),
						)
						.addStringOption((option) =>
							option
								.setName("color")
								.setDescription("Preferred challenger color")
								.addChoices(
									{ name: "Random", value: "random" },
									{ name: "White", value: "white" },
									{ name: "Black", value: "black" },
								),
						),
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("list")
						.setDescription(
							"List your pending ChessNow challenges",
						),
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("accept")
						.setDescription("Accept a pending ChessNow challenge")
						.addIntegerOption((option) =>
							option
								.setName("challenge_id")
								.setDescription("The challenge ID to accept")
								.setRequired(true)
								.setMinValue(1),
						),
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("deny")
						.setDescription("Deny a pending ChessNow challenge")
						.addIntegerOption((option) =>
							option
								.setName("challenge_id")
								.setDescription("The challenge ID to deny")
								.setRequired(true)
								.setMinValue(1),
						),
				),
		);
	}

	public async chatInputSend(
		interaction: Subcommand.ChatInputCommandInteraction,
	) {
		const discordUser = await ensureAuthenticatedDiscordUser(interaction);
		if (!discordUser) return;

		try {
			const username = interaction.options.getString("username", true);
			const color = (interaction.options.getString("color") ||
				undefined) as "white" | "black" | "random" | undefined;

			const challenge = await this.container.chess.requestChallenge(
				username,
				{
					color,
				},
				discordUser.accessToken,
			);

			const embed = new EmbedBuilder()
				.setTitle("Challenge sent")
				.setDescription(
					[
						`Challenge #${challenge.id} sent to \`${challenge.to.name} (${challenge.to.username})\`.`,
						`Your color: ${challenge.challengerColor}`,
					].join("\n"),
				)
				.setColor("DarkGreen")
				.setTimestamp();

			await interaction.editReply({ embeds: [embed] });
		} catch (error) {
			await interaction.editReply({
				embeds: [
					buildErrorEmbed(
						"Challenge command failed",
						getErrorMessage(error),
					),
				],
				components: [],
			});
		}
	}

	public async chatInputList(
		interaction: Subcommand.ChatInputCommandInteraction,
	) {
		const discordUser = await ensureAuthenticatedDiscordUser(interaction);
		if (!discordUser) return;

		try {
			const challenges = await this.container.chess.getMyChallenges(
				discordUser.accessToken,
			);

			const pendingChallenges = challenges.filter(
				(challenge) => challenge.status === "pending",
			);

			const incoming = pendingChallenges.filter(
				(challenge) => challenge.toId === discordUser.userId,
			);

			const outgoing = pendingChallenges.filter(
				(challenge) => challenge.fromId === discordUser.userId,
			);

			const embed = new EmbedBuilder()
				.setTitle("Pending challenges")
				.setColor("Blurple")
				.setTimestamp();

			embed.addFields(
				{
					name: "Incoming",
					value:
						incoming.length > 0
							? incoming
									.slice(0, 10)
									.map(
										(challenge) =>
											`#${challenge.id} - From: ${challenge.from.name} (@${challenge.from.username})`,
									)
									.join("\n")
							: "No incoming challenges.",
				},
				{
					name: "Outgoing",
					value:
						outgoing.length > 0
							? outgoing
									.slice(0, 10)
									.map(
										(challenge) =>
											`#${challenge.id} - To: ${challenge.to.name} (@${challenge.to.username})`,
									)
									.join("\n")
							: "No outgoing challenges.",
				},
			);

			await interaction.editReply({ embeds: [embed] });
		} catch (error) {
			await interaction.editReply({
				embeds: [
					buildErrorEmbed(
						"Challenge command failed",
						getErrorMessage(error),
					),
				],
				components: [],
			});
		}
	}

	public async chatInputAccept(
		interaction: Subcommand.ChatInputCommandInteraction,
	) {
		const discordUser = await ensureAuthenticatedDiscordUser(interaction);
		if (!discordUser) return;

		const challengeId = interaction.options.getInteger(
			"challenge_id",
			true,
		);

		try {
			const accepted = await this.container.chess.acceptChallenge(
				challengeId,
				discordUser.accessToken,
			);

			await DiscordUserModel.updateOne(
				{ discordId: interaction.user.id },
				{ $set: { activeMatchId: accepted.match.id } },
			);

			const buffer = await renderBoard(
				accepted.match.fen,
				accepted.match.blackId === discordUser.userId,
			);

			const embed = new EmbedBuilder()
				.setTitle("Challenge accepted")
				.setDescription(
					[
						`Challenge #${accepted.challenge.id} accepted.`,
						`Active match set to #${accepted.match.id}.`,
					].join("\n"),
				)
				.setColor("DarkGreen")
				.setImage("attachment://match.png")
				.setTimestamp();

			await interaction.editReply({
				embeds: [embed],
				files: [{ attachment: buffer, name: "match.png" }],
			});
		} catch (error) {
			if (error instanceof ChessNowError && error.status === 404) {
				await interaction.editReply({
					embeds: [
						buildErrorEmbed(
							"Challenge not found",
							`Challenge #${challengeId} not found.`,
						),
					],
					components: [],
				});
			} else {
				await interaction.editReply({
					embeds: [
						buildErrorEmbed(
							"Challenge command failed",
							getErrorMessage(error),
						),
					],
					components: [],
				});
			}
		}
	}

	public async chatInputDeny(
		interaction: Subcommand.ChatInputCommandInteraction,
	) {
		const discordUser = await ensureAuthenticatedDiscordUser(interaction);
		if (!discordUser) return;

		const challengeId = interaction.options.getInteger(
			"challenge_id",
			true,
		);

		try {
			const denied = await this.container.chess.denyChallenge(
				challengeId,
				discordUser.accessToken,
			);

			const embed = new EmbedBuilder()
				.setTitle("Challenge denied")
				.setDescription(
					`Challenge #${denied.challenge.id} has been denied.`,
				)
				.setColor("DarkOrange")
				.setTimestamp();

			await interaction.editReply({ embeds: [embed] });
		} catch (error) {
			if (error instanceof ChessNowError && error.status === 404) {
				await interaction.editReply({
					embeds: [
						buildErrorEmbed(
							"Challenge not found",
							`Challenge #${challengeId} not found.`,
						),
					],
					components: [],
				});
			} else {
				await interaction.editReply({
					embeds: [
						buildErrorEmbed(
							"Challenge command failed",
							getErrorMessage(error),
						),
					],
					components: [],
				});
			}
		}
	}
}
