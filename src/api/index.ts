import { cors } from "@elysia/cors";
import { Elysia } from "elysia";
import z from "zod";
import { auth } from "@/lib/auth";

import httpGetChallengeInfo from "./http/get-challenge-info";
import httpGetChallenges from "./http/get-challenges";
import httpGetMatchInfo from "./http/get-match-info";
import httpMove from "./http/move";
import httpRequestChallenge from "./http/request-challenge";

import wsSubscribe from "./websocket/subscribe";

export const app = new Elysia({ prefix: "/api", normalize: "typebox" })
	.use(cors())
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
		body: z.discriminatedUnion("type", [wsSubscribe.bodyType], {
			error: "Invalid message type",
		}),
		async message(ws, message) {
			const response = await (
				await import(`./websocket/${message.type}`)
			).run(ws, message);
			ws.send(response);
		},
	})
	.get("/account", async ({ headers, status }) => {
		const session = await auth.api.getSession({
			headers: {
				Authorization: headers.authorization as string,
			},
		});

		if (!session) {
			return status(401, { error: "Unauthorized" });
		}

		return session.user;
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
			headers: httpRequestChallenge.headersType,
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
	.listen(8080);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
