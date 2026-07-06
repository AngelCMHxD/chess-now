import type { Command } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { EmbedBuilder } from "discord.js";
import { ensureAuthenticatedDiscordUser } from "../lib/utils";

export class FriendsCommand extends Subcommand {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options,
	) {
		super(context, {
			...options,
			name: "friends",
			subcommands: [
				{ name: "send", chatInputRun: "chatInputSend" },
				{
					name: "list-requests",
					chatInputRun: "chatInputListRequests",
				},
				{ name: "list-friends", chatInputRun: "chatInputListFriends" },
				{ name: "accept", chatInputRun: "chatInputAccept" },
				{ name: "deny", chatInputRun: "chatInputDeny" },
				{ name: "remove", chatInputRun: "chatInputRemove" },
			],
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName("friends")
				.setDescription("Manage your friends")
				.addSubcommand((sub) =>
					sub
						.setName("send")
						.setDescription("Send a friend request")
						.addStringOption((option) =>
							option
								.setName("username")
								.setDescription(
									"The username to send a request to",
								)
								.setRequired(true),
						),
				)
				.addSubcommand((sub) =>
					sub
						.setName("list-requests")
						.setDescription("List all incoming friend requests"),
				)
				.addSubcommand((sub) =>
					sub
						.setName("accept")
						.setDescription("Accept a friend request")
						.addStringOption((option) =>
							option
								.setName("username")
								.setDescription(
									"The username whose request to accept",
								)
								.setRequired(true),
						),
				)
				.addSubcommand((sub) =>
					sub
						.setName("deny")
						.setDescription("Deny a friend request")
						.addStringOption((option) =>
							option
								.setName("username")
								.setDescription(
									"The username whose request to deny",
								)
								.setRequired(true),
						),
				)
				.addSubcommand((sub) =>
					sub
						.setName("remove")
						.setDescription("Remove a friend")
						.addStringOption((option) =>
							option
								.setName("username")
								.setDescription(
									"The username of the friend to remove",
								)
								.setRequired(true),
						),
				)
				.addSubcommand((sub) =>
					sub
						.setName("list-friends")
						.setDescription("List all friends"),
				),
		);
	}

	public async chatInputSend(
		interaction: Command.ChatInputCommandInteraction,
	) {
		const username = interaction.options.getString("username", true);

		const discordUser = await ensureAuthenticatedDiscordUser(interaction);
		if (!discordUser) return;

		await this.container.chess.sendFriendRequest(
			username,
			discordUser.accessToken,
		);
		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Friend Request Sent")
					.setDescription(
						`Successfully sent a friend request to @${username}.`,
					)
					.setColor("Blurple"),
			],
		});
	}

	public async chatInputListRequests(
		interaction: Command.ChatInputCommandInteraction,
	) {
		const discordUser = await ensureAuthenticatedDiscordUser(interaction);
		if (!discordUser) return;

		const requests = await this.container.chess.getFriendRequests(
			discordUser.accessToken,
		);

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Friend Requests")
					.setDescription(
						requests.length > 0
							? requests
									.map(
										(r) =>
											`${r.from.name} (@${r.from.username})`,
									)
									.join("\n")
							: "No pending friend requests.",
					)
					.setColor("Blurple"),
			],
		});
	}

	public async chatInputListFriends(
		interaction: Command.ChatInputCommandInteraction,
	) {
		const discordUser = await ensureAuthenticatedDiscordUser(interaction);
		if (!discordUser) return;

		const friends = await this.container.chess.getFriends(
			discordUser.accessToken,
		);

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Friends List")
					.setDescription(
						friends.length > 0
							? friends
									.map((f) => {
										const otherUser =
											f.userAId === discordUser.userId
												? f.userB
												: f.userA;
										return `${otherUser.name} (@${otherUser.username})`;
									})
									.join("\n")
							: "You have no friends yet.",
					)
					.setColor("Blurple"),
			],
		});
	}

	public async chatInputAccept(
		interaction: Command.ChatInputCommandInteraction,
	) {
		const username = interaction.options.getString("username", true);

		const discordUser = await ensureAuthenticatedDiscordUser(interaction);
		if (!discordUser) return;

		const result = await this.container.chess.acceptFriendRequest(
			username,
			discordUser.accessToken,
		);

		const otherUser =
			discordUser.userId === result.userAId ? result.userB : result.userA;

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Friend Request Accepted")
					.setDescription(
						`Successfully accepted the friend request from ${otherUser.name} (@${otherUser.username}).`,
					)
					.setColor("DarkGreen"),
			],
		});
	}

	public async chatInputDeny(
		interaction: Command.ChatInputCommandInteraction,
	) {
		const username = interaction.options.getString("username", true);

		const discordUser = await ensureAuthenticatedDiscordUser(interaction);
		if (!discordUser) return;

		const deniedFriendRequest =
			await this.container.chess.denyFriendRequest(
				username,
				discordUser.accessToken,
			);

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Friend Request Denied")
					.setDescription(
						`Successfully denied the friend request from ${deniedFriendRequest.from.name} (${deniedFriendRequest.from.username})`,
					)
					.setColor("DarkOrange"),
			],
		});
	}

	public async chatInputRemove(
		interaction: Command.ChatInputCommandInteraction,
	) {
		const username = interaction.options.getString("username", true);

		const discordUser = await ensureAuthenticatedDiscordUser(interaction);
		if (!discordUser) return;

		const removedFriendship = await this.container.chess.removeFriend(
			username,
			discordUser.accessToken,
		);

		const otherUser =
			discordUser.userId === removedFriendship.userAId
				? removedFriendship.userB
				: removedFriendship.userA;

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Friendship Removed")
					.setDescription(
						`Successfully removed ${otherUser.name} (${otherUser.username}) from your friends.`,
					)
					.setColor("DarkOrange"),
			],
		});
	}
}
