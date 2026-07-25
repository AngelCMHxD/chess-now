import { cors } from "@elysia/cors";
import { openapi } from "@elysia/openapi";
import { Elysia } from "elysia";
import z from "zod";
import { auth } from "@/lib/auth";
import { Responses } from "./docs";
import { APIError, UnprocessableContentError } from "./errors";
import { authHeadersSchema } from "./helper";
import httpCreateBot from "./http/bot/create-bot";
import httpDeleteBot from "./http/bot/delete-bot";
import httpResetBotToken from "./http/bot/reset-bot-token";
import httpUpdateBotInfo from "./http/bot/update-bot-info";
import httpGetChallengeInfo from "./http/challenge/get-challenge-info";
import httpRequestChallenge from "./http/challenge/request-challenge";
import httpDeviceApprove from "./http/device/device-approve";
import httpDeviceDeny from "./http/device/device-deny";
import httpDeviceInfo from "./http/device/device-info";
import httpDeviceInit from "./http/device/device-init";
import httpDeviceToken from "./http/device/device-token";
import httpForfeit from "./http/match/forfeit";
import httpGetMatchInfo from "./http/match/get-match-info";
import httpMove from "./http/match/move";
import httpAcceptChallenge from "./http/me/accept-challenge";
import httpDeleteAccount from "./http/me/delete-account";
import httpDenyChallenge from "./http/me/deny-challenge";
import httpAcceptFriendRequest from "./http/me/friendships/accept-friend-request";
import httpDeleteFriendship from "./http/me/friendships/delete-friendship";
import httpDenyFriendRequest from "./http/me/friendships/deny-friend-request";
import httpGetFriendRequests from "./http/me/friendships/get-friend-requests";
import httpSendFriendRequest from "./http/me/friendships/send-friend-request";
import httpGetAccountInfo from "./http/me/get-account-info";
import httpGetBots from "./http/me/get-bots";
import httpGetChallenges from "./http/me/get-challenges";
import httpGetFriends from "./http/me/get-friends";
import httpGetMatches from "./http/me/get-matches";
import httpUpdateAccountInfo from "./http/me/update-account-info";
import httpGetUserFriends from "./http/user/get-user-friends";
import httpGetUserInfo from "./http/user/get-user-info";
import httpGetUserMatches from "./http/user/get-user-matches";

import wsMatchSubscribe from "./websocket/match-subscribe";
import wsSubscribe from "./websocket/subscribe";
import watchDeviceAuth from "./websocket/watch-device-auth";

export const app = new Elysia({ prefix: "/api", normalize: "typebox" })
	.use(cors())
	.use(
		openapi({
			provider: null,
			specPath: "/openapi",
			documentation: {
				servers: [
					{
						url: process.env.NEXT_PUBLIC_BASE_URL ?? "",
						description: "Main Server",
					},
				],
				tags: [
					{
						name: "Challenges",
						description: "Challenge endpoints",
					},
					{
						name: "Friends",
						description: "Friend request and friendship endpoints",
					},
					{
						name: "Matches",
						description: "Match endpoints",
					},
					{
						name: "Me",
						description: "Authenticated user data endpoints",
					},
					{
						name: "User",
						description: "User data endpoints",
					},
					{
						name: "Device auth",
						description: "Device authentication endpoints",
					},
					{
						name: "Bots",
						description: "Bot management endpoints",
					},
				],
			},
			exclude: {
				tags: ["Internal"],
			},
		}),
	)
	.mount(auth.handler)
	.onError(({ error, set }) => {
		if (error instanceof APIError) {
			set.status = error.status;
			return error.toResponse();
		}

		if ("code" in error && error.code === "VALIDATION") {
			set.status = 422;
			return new UnprocessableContentError(
				"customError" in error && typeof error.customError === "string"
					? error.customError
					: "Invalid request",
			).toResponse();
		}

		console.log(error);

		set.status = 500;
		return new APIError(
			error instanceof Error
				? error.message
				: "An unexpected server error occurred.",
		).toResponse();
	})
	.ws("/websocket", {
		body: z.discriminatedUnion(
			"type",
			[
				wsSubscribe.bodyType,
				watchDeviceAuth.bodyType,
				wsMatchSubscribe.bodyType,
			],
			{
				error: "Invalid message type",
			},
		),
		async message(ws, message) {
			let response: unknown;

			switch (message.type) {
				case "subscribe":
					response = await wsSubscribe.run(ws, message);
					break;
				case "watch_device_auth":
					response = await watchDeviceAuth.run(ws, message);
					break;
				case "match_subscribe":
					response = await wsMatchSubscribe.run(ws, message);
					break;
				default:
					throw new Error("Invalid message type");
			}

			ws.send(response);
		},
	})
	.post(
		"/challenge/request/:username",
		({ params, body, request }) =>
			httpRequestChallenge.run(request.headers, params.username, body),
		{
			headers: authHeadersSchema,
			body: httpRequestChallenge.bodyType,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.ChallengeResult,
							},
						},
					},
				},
				summary: "Request a challenge",
				description: [
					"Requests a new chess challenge to a user by their username. This creates a pending challenge record which, once the target user accepts, starts a match.",
					"Triggers the `challenge:request` ws event to the target user.",
				].join("\n\n"),
				tags: ["Challenges"],
			},
		},
	)
	.get(
		"/challenge/:challenge_id",
		({ params, request }) =>
			httpGetChallengeInfo.run(request.headers, params.challenge_id),
		{
			headers: authHeadersSchema,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.ChallengeResult,
							},
						},
					},
				},
				summary: "Get challenge info",
				description:
					"Retrieves the full details of a specific challenge by its ID, including information about the challenger and the opponent.",
				tags: ["Challenges"],
			},
		},
	)
	.get(
		"/me/challenges",
		({ request }) => httpGetChallenges.run(request.headers),
		{
			headers: authHeadersSchema,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.Challenges,
							},
						},
					},
				},
				summary: "Get your challenge history",
				description:
					"Fetches a list of all challenges associated with your account, regardless of their current status.",
				tags: ["Me"],
			},
		},
	)
	.post(
		"/me/challenges/:challenge_id/accept",
		({ request, params }) =>
			httpAcceptChallenge.run(request.headers, params.challenge_id),
		{
			headers: authHeadersSchema,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.ChallengeMatchResult,
							},
						},
					},
				},
				summary: "Accept a challenge",
				description: [
					"Accepts a pending incoming challenge from another user. After accepting, a new chess match is created between both players.",
					"Triggers the `challenge:accepted` ws event to the target user.",
				].join("\n\n"),
				tags: ["Challenges"],
			},
		},
	)
	.post(
		"/me/challenges/:challenge_id/deny",
		({ request, params }) =>
			httpDenyChallenge.run(request.headers, params.challenge_id),
		{
			headers: authHeadersSchema,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.ChallengeResult,
							},
						},
					},
				},
				summary: "Deny a challenge",
				description: [
					"Declines a pending incoming challenge. This updates the challenge status to declined. Doesn't create a match.",
					"Triggers the `challenge:denied` ws event to the target user.",
				].join("\n\n"),
				tags: ["Challenges"],
			},
		},
	)
	.get("/me/matches", ({ request }) => httpGetMatches.run(request.headers), {
		headers: authHeadersSchema,
		detail: {
			responses: {
				200: {
					description: "Success",
					content: {
						"application/json": {
							example: Responses.Matches,
						},
					},
				},
			},
			summary: "Get your match history",
			description:
				"Retrieves a list of all your active and past matches.",
			tags: ["Me"],
		},
	})
	.post(
		"/me/friends/add/:username",
		({ params, request }) =>
			httpSendFriendRequest.run(request.headers, params.username),
		{
			headers: authHeadersSchema,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.FriendRequest,
							},
						},
					},
				},
				summary: "Send a friend request",
				description: [
					"Sends a friend request to a target user by their username. It stays pending until the target user either accepts or denies it.",
					"Triggers the `friend:request` ws event to the target user.",
				].join("\n\n"),
				tags: ["Friends"],
			},
		},
	)
	.get(
		"/me/friend-requests",
		({ request }) => httpGetFriendRequests.run(request.headers),
		{
			headers: authHeadersSchema,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.FriendRequests,
							},
						},
					},
				},
				summary: "Get your pending friend requests",
				description:
					"Fetches all pending incoming and outgoing friend requests.",
				tags: ["Friends"],
			},
		},
	)
	.post(
		"/me/friend-requests/:username/accept",
		({ request, params }) =>
			httpAcceptFriendRequest.run(request.headers, params.username),
		{
			headers: authHeadersSchema,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.Friendship,
							},
						},
					},
				},
				summary: "Accept a friend request",
				description: [
					"Accepts a pending incoming friend request from the specified user. This creates a friendship between both accounts.",
					"Triggers the `friend:accepted` ws event to the target user.",
				].join("\n\n"),
				tags: ["Friends"],
			},
		},
	)
	.post(
		"/me/friend-requests/:username/deny",
		({ request, params }) =>
			httpDenyFriendRequest.run(request.headers, params.username),
		{
			headers: authHeadersSchema,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.FriendRequest,
							},
						},
					},
				},
				summary: "Deny a friend request",
				description: [
					"Rejects a pending incoming friend request from the specified user. The request is rejected and no friendship is created.",
					"Triggers the `friend:denied` ws event to the target user.",
				].join("\n\n"),
				tags: ["Friends"],
			},
		},
	)
	.get("/me/friends", ({ request }) => httpGetFriends.run(request.headers), {
		headers: authHeadersSchema,
		detail: {
			responses: {
				200: {
					description: "Success",
					content: {
						"application/json": {
							example: Responses.Friendships,
						},
					},
				},
			},
			summary: "Get your friends list",
			description:
				"Retrieves the list of users you are currently friends with, providing their basic profile information.",
			tags: ["Friends"],
		},
	})
	.delete(
		"/me/friends/:username",
		({ request, params }) =>
			httpDeleteFriendship.run(request.headers, params.username),
		{
			headers: authHeadersSchema,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.SuccessResult,
							},
						},
					},
				},
				summary: "Remove a friend",
				description: [
					"Removes an existing friendship with the specified user.",
					"Triggers the `friend:removed` ws event to the target user.",
				].join("\n\n"),
				tags: ["Friends"],
			},
		},
	)
	.get("/me/bots", ({ request }) => httpGetBots.run(request.headers), {
		headers: authHeadersSchema,
		detail: {
			responses: {
				200: {
					description: "Success",
					content: {
						"application/json": {
							example: Responses.BotUsers,
						},
					},
				},
			},
			summary: "Get your registered bots",
			description:
				"Fetches a list of all bot accounts that are owned by your account.",
			tags: ["Bots"],
		},
	})
	.post(
		"/me/bots",
		({ request, body }) => httpCreateBot.run(request.headers, body),
		{
			headers: authHeadersSchema,
			body: httpCreateBot.bodyType,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.CreateBot,
							},
						},
					},
				},
				summary: "Register a new bot",
				description:
					"Creates a new bot account under your ownership. An API key is generated so you can auth the bot against the API.",
				tags: ["Bots"],
			},
		},
	)
	.delete(
		"/me/bots/:bot_id",
		({ request, params }) =>
			httpDeleteBot.run(request.headers, params.bot_id),
		{
			headers: authHeadersSchema,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.SuccessResult,
							},
						},
					},
				},
				summary: "Delete a bot",
				description: "Deletes a specific bot account that you own.",
				tags: ["Bots"],
			},
		},
	)
	.put(
		"/me",
		({ request, body }) => httpUpdateBotInfo.run(request.headers, body),
		{
			headers: authHeadersSchema,
			body: httpUpdateBotInfo.bodyType,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.BotUser,
							},
						},
					},
				},
				summary: "Update the bot account info",
				description:
					"Updates the profile information and settings for a specific bot account that you own.",
				tags: ["Bots"],
			},
		},
	)
	.post(
		"/me/bots/:bot_id/reset_token",
		({ request, params }) =>
			httpResetBotToken.run(request.headers, params.bot_id),
		{
			headers: authHeadersSchema,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.ResetToken,
							},
						},
					},
				},
				summary: "Reset a bot's token",
				description:
					"Invalidates the current API key for a specified bot you own and generates a new API key.",
				tags: ["Bots"],
			},
		},
	)
	.get("/me", ({ request }) => httpGetAccountInfo.run(request.headers), {
		headers: authHeadersSchema,
		detail: {
			responses: {
				200: {
					description: "Success",
					content: {
						"application/json": {
							example: Responses.User,
						},
					},
				},
			},
			summary: "Get account info",
			description: "Retrieves the profile of your account.",
			tags: ["Me"],
		},
	})
	.delete("/me", ({ request }) => httpDeleteAccount.run(request.headers), {
		headers: authHeadersSchema,
		detail: {
			responses: {
				200: {
					description: "Success",
					content: {
						"application/json": {
							example: Responses.SuccessResult,
						},
					},
				},
			},
			summary: "Delete your account",
			tags: ["Internal"],
		},
	})
	.put(
		"/me",
		({ request, body }) => httpUpdateAccountInfo.run(request.headers, body),
		{
			headers: authHeadersSchema,
			body: httpUpdateAccountInfo.bodyType,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.User,
							},
						},
					},
				},
				summary: "Update your account info",
				description: "Updates the profile information of your account.",
				tags: ["Me"],
			},
		},
	)
	.get(
		"/user/:username",
		({ request, params }) =>
			httpGetUserInfo.run(request.headers, params.username),
		{
			headers: authHeadersSchema,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.User,
							},
						},
					},
				},
				summary: "Get user info",
				description:
					"Fetches the profile information of a specific user by their username.",
				tags: ["User"],
			},
		},
	)
	.get(
		"/user/:username/matches",
		({ request, params }) =>
			httpGetUserMatches.run(request.headers, params.username),
		{
			headers: authHeadersSchema,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.Matches,
							},
						},
					},
				},
				summary: "Get user matches",
				description:
					"Retrieves the match history of a specific user by their username.",
				tags: ["User"],
			},
		},
	)
	.get(
		"/user/:username/friends",
		({ request, params }) =>
			httpGetUserFriends.run(request.headers, params.username),
		{
			headers: authHeadersSchema,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.Friendships,
							},
						},
					},
				},
				summary: "Get user friends",
				description:
					"Fetches the friends list for a specific user by their username.",
				tags: ["User"],
			},
		},
	)
	.get(
		"/match/:match_id",
		({ params, request }) =>
			httpGetMatchInfo.run(request.headers, params.match_id),
		{
			headers: authHeadersSchema,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.Match,
							},
						},
					},
				},
				summary: "Get match info",
				description:
					"Retrieves all of the match information by its ID. Includes player details.",
				tags: ["Matches"],
			},
		},
	)
	.post(
		"/match/:match_id/move",
		({ params, body, request }) =>
			httpMove.run(request.headers, params.match_id, body),
		{
			headers: authHeadersSchema,
			body: httpMove.bodyType,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.MoveResult,
							},
						},
					},
				},
				summary: "Make a move",
				description: [
					"Submits a new move for an active chess match. The move is validated and then the board state is updated.",
					"Triggers the `match:board_move` ws event to the match subscribers and the opponent.",
					"Also triggers `match:game_over` to both players and subscribers if the move causes the match to end",
				].join("\n\n"),
				tags: ["Matches"],
			},
		},
	)
	.post(
		"/match/:match_id/forfeit",
		({ params, request }) =>
			httpForfeit.run(request.headers, params.match_id),
		{
			headers: authHeadersSchema,
			detail: {
				responses: {
					200: {
						description: "Success",
						content: {
							"application/json": {
								example: Responses.ForfeitResult,
							},
						},
					},
				},
				summary: "Forfeit a match",
				description: [
					"Forfeits a match and grants the win to the oponent.",
					"Triggers the `match:game_over` ws event to the players and match subscribers.",
				].join("\n\n"),
				tags: ["Matches"],
			},
		},
	)
	.get(
		"/device/:user_code",
		({ request, params }) =>
			httpDeviceInfo.run(request.headers, params.user_code),
		{
			headers: authHeadersSchema,
			detail: {
				tags: ["Internal"],
			},
		},
	)
	.post("/device/init", ({ body }) => httpDeviceInit.run(body), {
		body: httpDeviceInit.bodyType,
		detail: {
			responses: {
				200: {
					description: "Success",
					content: {
						"application/json": {
							example: Responses.DeviceInit,
						},
					},
				},
			},
			summary: "Start device auth",
			description: [
				"Initiates a device auth flow by generating a device code and user code.",
				"It's not an OAuth 2.0 Device Authorization Grant, as this doesn't follow the format, but it's pretty similar to it.",
				"Triggers the `device_auth` ws event once the user denies/accepts the device auth request (or it expires).",
			].join("\n\n"),
			tags: ["Device auth"],
		},
	})
	.post(
		"/device/approve",
		({ request, body }) => httpDeviceApprove.run(request.headers, body),
		{
			body: httpDeviceApprove.bodyType,
			detail: {
				tags: ["Internal"],
			},
		},
	)
	.post(
		"/device/deny",
		({ request, body }) => httpDeviceDeny.run(request.headers, body),
		{
			body: httpDeviceDeny.bodyType,
			detail: {
				tags: ["Internal"],
			},
		},
	)
	.post("/device/token", ({ body }) => httpDeviceToken.run(body), {
		body: httpDeviceToken.bodyType,
		detail: {
			responses: {
				200: {
					description: "Success",
					content: {
						"application/json": {
							example: Responses.DeviceToken,
						},
					},
				},
			},
			summary: "Get token by device auth",
			description:
				"Exchanges the device token and returns the access token once the user has authorized the device.",
			tags: ["Device auth"],
		},
	})
	.listen(Number(process.env.INTERNAL_API_PORT) || 8080);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
