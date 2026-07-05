import { cors } from "@elysia/cors";
import { fromTypes, openapi } from "@elysia/openapi";
import { Elysia } from "elysia";
import z from "zod";
import { auth } from "@/lib/auth";

import { APIError, UnprocessableContentError } from "./errors";
import { authHeadersSchema } from "./helper";
import httpCreateBot from "./http/bot/create-bot";
import httpDeleteBot from "./http/bot/delete-bot";
import httpResetBotToken from "./http/bot/reset-bot-token";
import httpGetChallengeInfo from "./http/challenge/get-challenge-info";
import httpRequestChallenge from "./http/challenge/request-challenge";
import httpDeviceApprove from "./http/device/device-approve";
import httpDeviceDeny from "./http/device/device-deny";
import httpDeviceInit from "./http/device/device-init";
import httpDeviceToken from "./http/device/device-token";
import httpGetMatchInfo from "./http/match/get-match-info";
import httpMove from "./http/match/move";
import httpAcceptChallenge from "./http/me/accept-challenge";
import httpAcceptFriendRequest from "./http/me/accept-friend-request";
import httpDeleteFriendship from "./http/me/delete-friendship";
import httpDenyChallenge from "./http/me/deny-challenge";
import httpDenyFriendRequest from "./http/me/deny-friend-request";
import httpGetAccountInfo from "./http/me/get-account-info";
import httpGetBots from "./http/me/get-bots";
import httpGetChallenges from "./http/me/get-challenges";
import httpGetFriendRequests from "./http/me/get-friend-requests";
import httpGetFriends from "./http/me/get-friends";
import httpGetMatches from "./http/me/get-matches";
import httpSendFriendRequest from "./http/me/send-friend-request";
import httpGetUserFriends from "./http/user/get-user-friends";
import httpGetUserInfo from "./http/user/get-user-info";
import httpGetUserMatches from "./http/user/get-user-matches";

import wsSubscribe from "./websocket/subscribe";
import watchDeviceAuth from "./websocket/watch-device-auth";

export const app = new Elysia({ prefix: "/api", normalize: "typebox" })
	.use(cors())
	.use(
		openapi({
			provider: null,
			specPath: "/openapi",
			references: fromTypes("src/api/index.ts"),
			documentation: {
				servers: [
					{
						url: process.env.NEXT_PUBLIC_API_ENDPOINT ?? "",
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
			[wsSubscribe.bodyType, watchDeviceAuth.bodyType],
			{
				error: "Invalid message type",
			},
		),
		async message(ws, message) {
			const response =
				message.type === "subscribe"
					? await wsSubscribe.run(ws, message)
					: await watchDeviceAuth.run(ws, message);

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
				summary: "Request a challenge",
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
				summary: "Get challenge info",
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
				summary: "Get your challenge history",
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
				summary: "Accept a challenge",
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
				summary: "Deny a challenge",
				tags: ["Challenges"],
			},
		},
	)
	.get("/me/matches", ({ request }) => httpGetMatches.run(request.headers), {
		headers: authHeadersSchema,
		detail: {
			summary: "Get your match history",
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
				summary: "Send a friend request",
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
				summary: "Get your pending friend requests",
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
				summary: "Accept a friend request",
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
				summary: "Deny a friend request",
				tags: ["Friends"],
			},
		},
	)
	.get("/me/friends", ({ request }) => httpGetFriends.run(request.headers), {
		headers: authHeadersSchema,
		detail: {
			summary: "Get your friends list",
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
				summary: "Remove a friend",
				tags: ["Friends"],
			},
		},
	)
	.get("/me/bots", ({ request }) => httpGetBots.run(request.headers), {
		headers: authHeadersSchema,
		detail: {
			summary: "Get your registered bots",
			tags: ["Me"],
		},
	})
	.post(
		"/me/bots",
		({ request, body }) => httpCreateBot.run(request.headers, body),
		{
			headers: authHeadersSchema,
			body: httpCreateBot.bodyType,
			detail: {
				summary: "Register a new bot",
				tags: ["Me"],
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
				summary: "Delete a bot",
				tags: ["Me"],
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
				summary: "Reset a bot's token",
				tags: ["Me"],
			},
		},
	)
	.get("/me", ({ request }) => httpGetAccountInfo.run(request.headers), {
		headers: authHeadersSchema,
		detail: {
			summary: "Get account info",
			tags: ["Me"],
		},
	})
	.get(
		"/user/:username",
		({ request, params }) =>
			httpGetUserInfo.run(request.headers, params.username),
		{
			headers: authHeadersSchema,
			detail: {
				summary: "Get user info",
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
				summary: "Get user matches",
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
				summary: "Get user friends",
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
				summary: "Get match info",
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
				summary: "Make a move",
				tags: ["Matches"],
			},
		},
	)
	.post("/device/init", ({ body }) => httpDeviceInit.run(body), {
		body: httpDeviceInit.bodyType,
		detail: {
			summary: "Start device auth",
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
			summary: "Get token by device auth",
			tags: ["Device auth"],
		},
	})
	.listen(Number(process.env.INTERNAL_API_PORT) || 8080);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
