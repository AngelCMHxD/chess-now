import { cors } from "@elysia/cors";
import { fromTypes, openapi } from "@elysia/openapi";
import { Elysia } from "elysia";
import z from "zod";
import { auth } from "@/lib/auth";

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
						url: "http://localhost:8080",
						description: "Development Server",
					},
				],
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
		({ params, body, headers }) =>
			httpRequestChallenge.run(headers.authorization, params.uid, body),
		{
			body: httpRequestChallenge.bodyType,
			headers: httpRequestChallenge.headersType,
		},
	)
	.get(
		"/challenge/:challenge_id",
		({ params, headers }) =>
			httpGetChallengeInfo.run(
				headers.authorization,
				params.challenge_id,
			),
		{
			headers: httpGetChallengeInfo.headersType,
		},
	)
	.get(
		"/me/challenges",
		({ headers }) => httpGetChallenges.run(headers.authorization),
		{
			headers: httpGetChallenges.headersType,
		},
	)
	.post(
		"/me/challenges/:challenge_id/accept",
		({ headers, params }) =>
			httpAcceptChallenge.run(headers.authorization, params.challenge_id),
		{
			headers: httpAcceptChallenge.headersType,
		},
	)
	.post(
		"/me/challenges/:challenge_id/deny",
		({ headers, params }) =>
			httpDenyChallenge.run(headers.authorization, params.challenge_id),
		{
			headers: httpDenyChallenge.headersType,
		},
	)
	.get(
		"/me/matches",
		({ headers }) => httpGetMatches.run(headers.authorization),
		{
			headers: httpGetMatches.headersType,
		},
	)
	.get(
		"/me",
		({ headers }) => httpGetAccountInfo.run(headers.authorization),
		{
			headers: httpGetAccountInfo.headersType,
		},
	)
	.get(
		"/match/:match_id",
		({ params, headers }) =>
			httpGetMatchInfo.run(headers.authorization, params.match_id),
		{
			headers: httpGetMatchInfo.headersType,
		},
	)
	.post(
		"/match/:match_id/move",
		({ params, body, headers }) =>
			httpMove.run(headers.authorization, params.match_id, body),
		{
			body: httpMove.bodyType,
			headers: httpMove.headersType,
		},
	)
	.post("/device/init", ({ body }) => httpDeviceInit.run(body), {
		body: httpDeviceInit.bodyType,
	})
	.post(
		"/device/approve",
		({ request, body }) => httpDeviceApprove.run(request.headers, body),
		{
			body: httpDeviceApprove.bodyType,
		},
	)
	.post(
		"/device/deny",
		({ request, body }) => httpDeviceDeny.run(request.headers, body),
		{
			body: httpDeviceDeny.bodyType,
		},
	)
	.post("/device/token", ({ body }) => httpDeviceToken.run(body), {
		body: httpDeviceToken.bodyType,
	})
	.listen(8080);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
