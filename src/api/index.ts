import { cors } from "@elysia/cors";
import { fromTypes, openapi } from "@elysia/openapi";
import { Elysia } from "elysia";
import z from "zod";
import { auth } from "@/lib/auth";
import { authHeadersSchema } from "./helper";

import httpGetChallengeInfo from "./http/challenge/get-challenge-info";
import httpRequestChallenge from "./http/challenge/request-challenge";
import httpDeviceApprove from "./http/device/device-approve";
import httpDeviceDeny from "./http/device/device-deny";
import httpDeviceInit from "./http/device/device-init";
import httpDeviceToken from "./http/device/device-token";
import httpGetMatchInfo from "./http/match/get-match-info";
import httpMove from "./http/match/move";
import httpAcceptChallenge from "./http/me/accept-challenge";
import httpDenyChallenge from "./http/me/deny-challenge";
import httpGetAccountInfo from "./http/me/get-account-info";
import httpGetChallenges from "./http/me/get-challenges";
import httpGetMatches from "./http/me/get-matches";

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
						url: process.env.API_BASE_URL ?? "",
						description: "Main Server",
					},
				],
				tags: [
					{
						name: "Challenges",
						description: "Challenge endpoints",
					},
					{
						name: "Matches",
						description: "Match endpoints",
					},
					{
						name: "Me",
						description: "User account endpoints",
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
	.onError(({ error }) => {
		if ("code" in error && error.code === "VALIDATION")
			return {
				type: "validationError",
				content: {
					message: "customError" in error && error.customError,
					found:
						("valueError" in error &&
							error.valueError &&
							"path" in error.valueError &&
							Array.isArray(error.valueError.path) &&
							error.valueError.path.reduce(
								(currentValue, nextKey) =>
									currentValue[nextKey],
								error.value,
							)) ||
						false,
				},
			};

		return error;
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
			const response = await (
				await import(`./websocket/${message.type}`)
			).run(ws, message);
			ws.send(JSON.stringify(response));
		},
	})
	.post(
		"/challenge/request/:uid",
		({ params, body, request }) =>
			httpRequestChallenge.run(request.headers, params.uid, body),
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
	.get("/me", ({ request }) => httpGetAccountInfo.run(request.headers), {
		headers: authHeadersSchema,
		detail: {
			summary: "Get account info",
			tags: ["Me"],
		},
	})
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
	.listen(8080);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
