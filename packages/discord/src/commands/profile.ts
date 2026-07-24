import type { Match, User } from "@chess-now/api";
import { Command } from "@sapphire/framework";
import { EmbedBuilder, MessageFlags } from "discord.js";
import { ensureAuthenticatedDiscordUser } from "../lib/utils";

export class ProfileCommand extends Command {
	public constructor(
		context: Command.LoaderContext,
		options: Command.Options,
	) {
		super(context, { ...options });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName("profile")
				.setDescription("Check a ChessNow profile")
				.addStringOption((option) =>
					option
						.setName("username")
						.setDescription("The user to check the profile of"),
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

		const username = interaction.options.getString("username");

		let user: User;
		let userMatches: Match[];

		if (!username) {
			user = await this.container.chess.getAccountInfo(
				discordUser.accessToken,
			);
			userMatches = await this.container.chess.getMyMatches(
				discordUser.accessToken,
			);
		} else {
			user = await this.container.chess.getUserInfo(
				username,
				discordUser.accessToken,
			);
			userMatches = await this.container.chess.getUserMatches(
				username,
				discordUser.accessToken,
			);
		}

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Profile")
					.setFields(
						{ name: "Name", value: user.name },
						{ name: "Username", value: `@${user.username}` },
						{ name: "ELO Rating", value: `${user.rating}` },
						{ name: "Matches", value: `${userMatches.length}` },
						{
							name: "Win rate",
							value: `${Math.round((userMatches.filter((m) => m.status === "white_won").length / userMatches.length) * 100)}%`,
						},
					)
					.setColor("DarkGreen")
					.setTimestamp(),
			],
		});
	}
}
