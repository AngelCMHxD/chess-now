import { ChessNowClient } from "@chess-now/api";
import { createApp } from "vue-termui";
import App from "./App.vue";
import { router } from "./router";
import { state } from "./store";

export const chessClient = new ChessNowClient();

const app = await createApp(App);
await chessClient.connect();
app.use(router);
await router.push("/loading");
await router.isReady();
app.mount();

const accessToken = await Bun.secrets.get({
	name: "access-token",
	service: "chess-now-tui",
});

if (accessToken) {
	chessClient.setDefaultToken(accessToken);
	try {
		state.user = await chessClient.getAccountInfo();
		state.matches = await chessClient.getMyMatches();
		state.challenges = await chessClient.getMyChallenges();
		state.friends = await chessClient.getFriends();
		state.friendRequests = await chessClient.getFriendRequests();

		chessClient.subscribe();

		// we listen to all events at update the state
		// that way we don't do a huge amount of requests
		// it's kind of a cache, but it's always updated (so not like a cache? lol)
		chessClient.on("match:game_over", (e) => {
			const index = state.matches.findIndex(
				(m) => m.id === e.payload.match.id,
			);
			if (index !== -1) {
				state.matches[index] = e.payload.match;
			}
		});

		chessClient.on("match:board_move", (e) => {
			const index = state.matches.findIndex(
				(m) => m.id === e.payload.match.id,
			);
			if (index !== -1) {
				state.matches[index] = e.payload.match;
			}
		});

		chessClient.on("challenge:request", (e) => {
			state.challenges.push(e.payload.challenge);
		});

		chessClient.on("challenge:accepted", (e) => {
			state.challenges = state.challenges.filter(
				(c) => c.id !== e.payload.challengeId,
			);
			state.matches.push(e.payload.match);
		});

		chessClient.on("challenge:denied", (e) => {
			state.challenges = state.challenges.filter(
				(c) => c.id !== e.payload.challengeId,
			);
		});

		chessClient.on("friend:request", (e) => {
			state.friendRequests.push(e.payload.request);
		});

		chessClient.on("friend:accepted", (e) => {
			state.friends.push(e.payload.friendship);
			state.friendRequests = state.friendRequests.filter(
				(r) => r.id !== e.payload.friendship.id,
			);
		});

		chessClient.on("friend:denied", (e) => {
			state.friendRequests = state.friendRequests.filter(
				(r) => r.id !== e.payload.request.id,
			);
		});

		chessClient.on("friend:removed", (e) => {
			state.friends = state.friends.filter(
				(f) => f.id !== e.payload.friendship.id,
			);
		});

		await router.replace("/matches");
	} catch (_e) {
		await router.replace("/login");
	}
} else {
	await router.replace("/login");
}
await router.isReady();

await app.waitUntilExit();
