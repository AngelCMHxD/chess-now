import { ChessBot } from "./bot";

async function main() {
	console.log("Starting Bots...");

	const bots = [];

	for (let level = 1; level <= 5; level++) {
		const token = process.env[`BOT_TOKEN_${level}`];
		if (!token) {
			console.warn(
				`BOT_TOKEN_${level} not provided. skipping level ${level} bot.`,
			);
			continue;
		}

		const bot = new ChessBot(token, level);
		bots.push(bot);
		bot.start();
	}

	if (bots.length === 0) {
		console.error(
			"no bots started. provide any of the following environment variables:",
		);
		console.error("- BOT_TOKEN_1");
		console.error("- BOT_TOKEN_2");
		console.error("- BOT_TOKEN_3");
		console.error("- BOT_TOKEN_4");
		console.error("- BOT_TOKEN_5");
		console.error(
			"the number at the end (1-5) indicates the bot level/difficulty",
		);
		process.exit(1);
	}
}

main().catch(console.error);
