import {
	type DeviceAuthInitResponse,
	type DeviceAuthPayload,
	SCOPES,
} from "@chess-now/api";
import { Command } from "@sapphire/framework";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} from "discord.js";
import { subscribeDiscordUserToNotifications } from "../lib/notifications";
import { DiscordUserModel } from "../schemas/user";

export class AuthCommand extends Command {
	public constructor(
		context: Command.LoaderContext,
		options: Command.Options,
	) {
		super(context, { ...options });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName("auth")
				.setDescription("Authenticate with the ChessNow! API"),
		);
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction,
	) {
		const existingUser = await DiscordUserModel.findOne({
			discordId: interaction.user.id,
		}).lean();

		if (existingUser) {
			await interaction.editReply({
				content: "You are already authenticated.",
			});
			return;
		}

		let deviceAuth: DeviceAuthInitResponse;
		try {
			deviceAuth = await this.container.chess.initDeviceAuth([...SCOPES]);
		} catch (error) {
			console.error(error);

			const errorEmbed = new EmbedBuilder()
				.setTitle("Error")
				.setDescription("Failed to start authentication.")
				.setColor("DarkRed")
				.setFooter({ text: "ChessNow! - Authentication" })
				.setTimestamp();

			await interaction.editReply({
				embeds: [errorEmbed],
				components: [],
			});
			return;
		}

		const successEmbed = new EmbedBuilder()
			.setTitle("Success")
			.setDescription(
				"You have successfully authenticated with the ChessNow! API.",
			)
			.setColor("DarkGreen")
			.setFooter({ text: "ChessNow! - Authentication" })
			.setTimestamp();

		const deniedEmbed = new EmbedBuilder()
			.setTitle("Denied")
			.setDescription("You have denied the authentication request.")
			.setColor("DarkRed")
			.setFooter({ text: "ChessNow! - Authentication" })
			.setTimestamp();

		const timeoutEmbed = new EmbedBuilder()
			.setTitle("Timeout")
			.setDescription("The authentication request has timed out.")
			.setColor("DarkRed")
			.setFooter({ text: "ChessNow! - Authentication" })
			.setTimestamp();

		const loginEmbed = new EmbedBuilder()
			.setTitle("Login")
			.setDescription(
				"Click the button below to authenticate with the ChessNow! API. Authentication will be completed in your browser.",
			)
			.setFields([{ name: "Code", value: deviceAuth.userCode }])
			.setColor("DarkGreen")
			.setFooter({ text: "ChessNow! - Authentication" })
			.setTimestamp();

		const loginButton = new ButtonBuilder()
			.setLabel("Login")
			.setStyle(ButtonStyle.Link)
			.setURL(deviceAuth.verificationUriComplete);

		const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
			loginButton,
		);

		const deviceAuthHandler = async (deviceAuthEvent: {
			event: "device_auth";
			payload: DeviceAuthPayload;
		}) => {
			if (deviceAuthEvent.payload.userCode !== deviceAuth.userCode)
				return;

			try {
				if (deviceAuthEvent.payload.action === "denied") {
					await interaction.editReply({
						embeds: [deniedEmbed],
						components: [],
					});
					return;
				}

				if (deviceAuthEvent.payload.action === "expired") {
					await interaction.editReply({
						embeds: [timeoutEmbed],
						components: [],
					});
					return;
				}

				const token = await this.container.chess.getDeviceToken(
					deviceAuth.deviceCode,
				);

				const account = await this.container.chess.getAccountInfo(
					token.accessToken,
				);

				await DiscordUserModel.create({
					discordId: interaction.user.id,
					userId: account.id,
					accessToken: token.accessToken,
					expiresAt: new Date(Date.now() + token.expiresIn * 1000),
					activeMatchId: null,
					notificationsEnabled: true,
				});
				await subscribeDiscordUserToNotifications(token.accessToken);

				await interaction.editReply({
					embeds: [successEmbed],
					components: [],
				});
			} catch (error) {
				const errorEmbed = new EmbedBuilder()
					.setTitle("Error")
					.setDescription("An error occurred while authenticating.")
					.setTimestamp();

				console.error(error);

				await interaction.editReply({
					embeds: [errorEmbed],
					components: [],
				});
			} finally {
				this.container.chess.off("device_auth", deviceAuthHandler);
			}
		};

		this.container.chess.on("device_auth", deviceAuthHandler);
		this.container.chess.watchDeviceAuth(
			deviceAuth.userCode,
			deviceAuth.deviceCode,
		);

		await interaction.editReply({
			embeds: [loginEmbed],
			components: [buttonRow],
		});
	}
}
