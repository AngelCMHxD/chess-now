import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ChessNowClient } from "@chess-now/api";
import {
	ApplicationCommandRegistries,
	container,
	RegisterBehavior,
	SapphireClient,
} from "@sapphire/framework";
import { GatewayIntentBits } from "discord.js";
import mongoose from "mongoose";

import "@sapphire/plugin-hmr/register";
import {
	registerNotificationHandlers,
	subscribeDiscordUserToNotifications,
} from "./lib/notifications";
import { DiscordUserModel } from "./schemas/user";

const baseUserDirectory = dirname(fileURLToPath(import.meta.url));

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(
	RegisterBehavior.BulkOverwrite,
);

async function setupBot() {
	const botToken = process.env.DISCORD_BOT_TOKEN;
	if (!botToken) {
		throw new Error("DISCORD_BOT_TOKEN is not set");
	}

	container.chess = new ChessNowClient("http://localhost:3000");
	container.subscriptions = [];
	await container.chess.connect();
	registerNotificationHandlers();
	console.log("Connected to ChessNow API WebSocket");

	const existingUsers = await DiscordUserModel.find({}).lean();
	for (const user of existingUsers) {
		if (user.notificationsEnabled)
			await subscribeDiscordUserToNotifications(user.accessToken);
	}

	const client = new SapphireClient({
		baseUserDirectory,
		intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
	});

	await client.login(botToken);
}

async function connectDatabase() {
	const mongoUri = process.env.DISCORD_BOT_MONGO_URI;

	if (!mongoUri) {
		throw new Error("DISCORD_BOT_MONGO_URI is not set");
	}

	if (mongoose.connection.readyState === 1) {
		return mongoose.connection;
	}

	await mongoose.connect(mongoUri);
	return mongoose.connection;
}

declare module "@sapphire/pieces" {
	interface Container {
		chess: InstanceType<typeof ChessNowClient>;
		subscriptions: string[];
	}
}

async function main() {
	await connectDatabase();
	await setupBot();
}

main().catch((error) => {
	console.error("Failed to start Discord bot", error);
	process.exit(1);
});
