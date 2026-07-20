import type { Challenge, FriendRequest, Match } from "@chess-now/api";
import { container } from "@sapphire/framework";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import { DiscordUserModel } from "../schemas/user";
import { renderBoard } from "./utils";

async function notifyByTargetUserId(
	userId: string | undefined,
	embed: EmbedBuilder,
	attachments?: AttachmentBuilder[],
) {
	if (!userId) return;

	const discordUser = await DiscordUserModel.findOne({
		userId,
		notificationsEnabled: true,
	}).lean();

	if (!discordUser) return;

	try {
		const user = await container.client.users.fetch(discordUser.discordId);
		await user.send({ embeds: [embed], files: attachments });
	} catch {}
}

export function registerNotificationHandlers() {
	container.chess.on("challenge:request", async (event) => {
		const challenge: Challenge = event.payload.challenge;

		let challengedColor = "Random";

		if (challenge.challengerColor !== "random") {
			if (challenge.challengerColor === "white") {
				challengedColor = "Black";
			} else {
				challengedColor = "White";
			}
		}

		await notifyByTargetUserId(
			event.target,
			new EmbedBuilder()
				.setTitle("New challenge received")
				.setDescription(
					[
						`From: ${challenge.from?.name} (@${challenge.from?.username})`,
						`Challenge #${challenge.id}`,
						`Your Color: ${challengedColor}`,
						`Time limit: ${challenge.timeLimit}m`,
					].join("\n"),
				)
				.setColor("Blurple")
				.setTimestamp(),
		);
	});

	container.chess.on("challenge:accepted", async (event) => {
		const match: Match = event.payload.match;

		await notifyByTargetUserId(
			event.target,
			new EmbedBuilder()
				.setTitle("Challenge accepted")
				.setDescription(
					[
						`Challenge #${event.payload.challengeId}`,
						`Accepted by user: ${event.payload.acceptedBy.name} (@${event.payload.acceptedBy.username})`,
						`Match #${match.id} was started.`,
					].join("\n"),
				)
				.setColor("DarkGreen")
				.setTimestamp(),
		);
	});

	container.chess.on("challenge:denied", async (event) => {
		await notifyByTargetUserId(
			event.target,
			new EmbedBuilder()
				.setTitle("Challenge denied")
				.setDescription(
					[
						`Challenge #${event.payload.challengeId}`,
						`Denied by user: ${event.payload.deniedBy.name} (@${event.payload.deniedBy.username})`,
					].join("\n"),
				)
				.setColor("DarkOrange")
				.setTimestamp(),
		);
	});

	container.chess.on("friend:request", async (event) => {
		const request: FriendRequest = event.payload.request;

		await notifyByTargetUserId(
			event.target,
			new EmbedBuilder()
				.setTitle("New friend request")
				.setDescription(
					`From: ${request.from?.name} (@${request.from?.username})`,
				)
				.setColor("Blurple")
				.setTimestamp(),
		);
	});

	container.chess.on("friend:accepted", async (event) => {
		const friendship = event.payload.friendship;
		const acceptedBy =
			friendship.userAId === event.target
				? friendship.userB
				: friendship.userA;

		await notifyByTargetUserId(
			event.target,
			new EmbedBuilder()
				.setTitle("Friend request accepted")
				.setDescription(
					`You are now friends with ${acceptedBy.name} (@${acceptedBy.username}).`,
				)
				.setColor("DarkGreen")
				.setTimestamp(),
		);
	});

	container.chess.on("friend:denied", async (event) => {
		const request = event.payload.request;

		await notifyByTargetUserId(
			event.target,
			new EmbedBuilder()
				.setTitle("Friend request denied")
				.setDescription(
					`Request from ${request.to?.name} (@${request.to?.username}) was denied.`,
				)
				.setColor("DarkOrange")
				.setTimestamp(),
		);
	});

	container.chess.on("friend:removed", async (event) => {
		const friendship = event.payload.friendship;
		const removedBy =
			friendship.userAId === event.target
				? friendship.userB
				: friendship.userA;

		await notifyByTargetUserId(
			event.target,
			new EmbedBuilder()
				.setTitle("Friendship removed")
				.setDescription(
					`You are no longer friends with ${removedBy.name} (@${removedBy.username}).`,
				)
				.setColor("DarkOrange")
				.setTimestamp(),
		);
	});

	container.chess.on("match:board-move", async (event) => {
		await notifyByTargetUserId(
			event.target,
			new EmbedBuilder()
				.setTitle("Match update")
				.setDescription(
					[
						`Match #${event.payload.match.id}`,
						`${event.payload.match.whitePlayer?.name} (White) vs ${event.payload.match.blackPlayer?.name} (Black)`,
						`Turn: ${event.payload.move.turn.after === "b" ? "Black" : "White"}`,
						`Move: ${event.payload.move.lan}`,
					].join("\n"),
				)
				.setImage("attachment://board.png")
				.setColor("Blurple")
				.setTimestamp(),
			[
				new AttachmentBuilder(
					await renderBoard(
						event.payload.match.fen,
						event.payload.match.blackId === event.target,
					),
					{ name: "board.png" },
				),
			],
		);
	});

	container.chess.on("match:game_over", async (event) => {
		await notifyByTargetUserId(
			event.target,
			new EmbedBuilder()
				.setTitle("Match ended")
				.setDescription(
					[
						`Match #${event.payload.match.id}`,
						`Result: ${event.payload.match.status.replace("_", " ").toUpperCase()}`,
					].join("\n"),
				)
				.setColor("DarkGreen")
				.setTimestamp(),
		);
	});
}

export async function subscribeDiscordUserToNotifications(accessToken: string) {
	if (container.subscriptions.includes(accessToken)) return;

	container.subscriptions.push(accessToken);
	container.chess.subscribe(accessToken, ["challenge", "friend", "match"]);
}
