import { Command } from "@sapphire/framework";
import { EmbedBuilder, MessageFlags } from "discord.js";
import { subscribeDiscordUserToNotifications } from "../lib/notifications";
import { DiscordUserModel } from "../schemas/user";

export class NotificationsCommand extends Command {
	public constructor(
		context: Command.LoaderContext,
		options: Command.Options,
	) {
		super(context, { ...options });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName("notifications")
				.setDescription("Manage ChessNow Discord notifications")
				.addSubcommand((subcommand) =>
					subcommand
						.setName("disable")
						.setDescription("Disable Discord notifications"),
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("enable")
						.setDescription("Enable Discord notifications"),
				),
		);
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction,
	) {
		await interaction.deferReply({
			flags: [MessageFlags.Ephemeral],
		});

		const discordUser = await DiscordUserModel.findOne({
			discordId: interaction.user.id,
		});

		if (!discordUser) {
			await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Not authenticated")
						.setDescription(
							"Run `/auth` before managing notifications.",
						)
						.setColor("DarkRed")
						.setTimestamp(),
				],
			});
			return;
		}

		const subcommand = interaction.options.getSubcommand();

		if (subcommand === "enable") {
			discordUser.notificationsEnabled = true;
			await subscribeDiscordUserToNotifications(discordUser.accessToken);
		} else {
			discordUser.notificationsEnabled = false;
		}

		await discordUser.save();

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Notifications updated")
					.setDescription(
						`You will ${subcommand === "enable" ? "now" : "no longer"} receive ChessNow notifications through this Discord bot.`,
					)
					.setColor("DarkOrange")
					.setTimestamp(),
			],
		});
	}
}
