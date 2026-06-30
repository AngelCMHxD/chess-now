import z from "zod";
import { ChessNowError } from "./errors";
import type {
	Challenge,
	ChallengeConfig,
	ClientMessage,
	DeviceAuthInitResponse,
	DeviceAuthPayload,
	DeviceTokenResponse,
	Match,
	Move,
	SubscribeEvents,
	SubscribeMessage,
	User,
	WatchDeviceAuthMessage,
	WebSocketEvent,
} from "./types";
import { VALID_SCOPES } from "./types";

function wsUrl(baseUrl: string): string {
	const protocol = baseUrl.startsWith("https") ? "wss" : "ws";
	const i = baseUrl.indexOf("://");
	const host = i === -1 ? baseUrl : baseUrl.slice(i + 3);
	return `${protocol}://${host}/api/websocket`;
}

type Handler = (msg: WebSocketEvent) => void;

function assert<T>(schema: z.ZodType<T>, value: unknown, label: string): void {
	const result = schema.safeParse(value);
	if (!result.success) {
		throw new ChessNowError(
			400,
			"BAD_REQUEST",
			`${label}: ${result.error.issues.map((i) => i.message).join("; ")}`,
		);
	}
}

const positiveInt = z.number().int().positive("must be a positive integer");
const nonEmptyStr = z.string().refine((s) => s.trim().length > 0, {
	message: "must be a non-empty string",
});
const scopeSchema = z.enum(VALID_SCOPES, {
	error: "must be 'challenges' or 'matches'",
});
const scopesSchema = z
	.array(scopeSchema)
	.min(1, "at least one scope is required");
const eventSchema = z.enum(["challenge", "match"], {
	error: "must be 'challenge' or 'match'",
});
const eventsSchema = z.optional(
	z.array(eventSchema).min(1, "at least one event is required"),
);

export class ChessNowClient {
	/** @internal */
	private baseUrl: string;
	/** @internal */
	private defaultToken?: string;

	/** @internal */
	private ws: WebSocket | null = null;
	/** @internal */
	private wsUrl: string;
	/** @internal */
	private handlers = new Map<string, Handler[]>();
	/** @internal */
	private subscriptions: Array<{ token: string; events: string[] }> = [];
	/** @internal */
	private deviceAuthWatchers: Array<{
		userCode: string;
		deviceCode: string;
	}> = [];
	/** @internal */
	private reconnectAttempts = 0;
	/** @internal */
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	/** @internal */
	private intentionalClose = false;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl.replace(/\/$/, "");
		this.wsUrl = wsUrl(this.baseUrl);
	}

	setDefaultToken(token: string): void {
		assert(nonEmptyStr, token, "token");
		this.defaultToken = token;
	}

	/** @internal */
	private async _fetch<T>(
		path: string,
		init: RequestInit & { token?: string; auth?: false } = {},
	): Promise<T> {
		const token = init.token ?? this.defaultToken;

		if (init.auth !== false && !token) {
			throw new ChessNowError(
				401,
				"UNAUTHORIZED",
				"An authentication token is required. Pass a token or call setDefaultToken before making this request.",
			);
		}

		const headers = new Headers(init.headers);
		headers.set("Content-Type", "application/json");

		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		}

		const res = await fetch(`${this.baseUrl}/api${path}`, {
			...init,
			headers,
		});

		const body = await res.json();

		if (!res.ok) {
			throw ChessNowError.fromResponse(res.status, body);
		}

		return (body as { data: T }).data;
	}

	async getAccountInfo(token?: string): Promise<User> {
		return this._fetch<User>("/me", { token });
	}

	async getMyChallenges(token?: string): Promise<Challenge[]> {
		return this._fetch<Challenge[]>("/me/challenges", { token });
	}

	async getMyMatches(token?: string): Promise<Match[]> {
		return this._fetch<Match[]>("/me/matches", { token });
	}

	async getChallenge(
		challengeId: number,
		token?: string,
	): Promise<Challenge> {
		assert(positiveInt, challengeId, "challengeId");
		return this._fetch<Challenge>(`/challenge/${challengeId}`, { token });
	}

	async requestChallenge(
		uid: string,
		options?: ChallengeConfig,
		token?: string,
	): Promise<Challenge> {
		assert(nonEmptyStr, uid, "uid");
		return this._fetch<Challenge>(`/challenge/request/${uid}`, {
			method: "POST",
			body: options ? JSON.stringify(options) : undefined,
			token,
		});
	}

	async acceptChallenge(
		challengeId: number,
		token?: string,
	): Promise<{ challenge: Challenge; match: Match }> {
		assert(positiveInt, challengeId, "challengeId");
		return this._fetch<{ challenge: Challenge; match: Match }>(
			`/me/challenges/${challengeId}/accept`,
			{ method: "POST", token },
		);
	}

	async denyChallenge(
		challengeId: number,
		token?: string,
	): Promise<{ challenge: Challenge }> {
		assert(positiveInt, challengeId, "challengeId");
		return this._fetch<{ challenge: Challenge }>(
			`/me/challenges/${challengeId}/deny`,
			{ method: "POST", token },
		);
	}

	async getMatch(matchId: number, token?: string): Promise<Match> {
		assert(positiveInt, matchId, "matchId");
		return this._fetch<Match>(`/match/${matchId}`, { token });
	}

	async makeMove(
		matchId: number,
		moveSan: string,
		token?: string,
	): Promise<Move> {
		assert(positiveInt, matchId, "matchId");
		assert(nonEmptyStr, moveSan, "moveSan");
		return this._fetch<Move>(`/match/${matchId}/move`, {
			method: "POST",
			body: JSON.stringify({ move: moveSan }),
			token,
		});
	}

	async initDeviceAuth(
		scopes: ("challenges" | "matches")[],
	): Promise<DeviceAuthInitResponse> {
		assert(scopesSchema, scopes, "scopes");
		return this._fetch<DeviceAuthInitResponse>("/device/init", {
			method: "POST",
			body: JSON.stringify({ scopes }),
			auth: false,
		});
	}

	async getDeviceToken(deviceCode: string): Promise<DeviceTokenResponse> {
		assert(nonEmptyStr, deviceCode, "deviceCode");
		return this._fetch<DeviceTokenResponse>("/device/token", {
			method: "POST",
			body: JSON.stringify({ deviceCode }),
			auth: false,
		});
	}

	connect(): void {
		if (this.ws) return;
		this.intentionalClose = false;
		this._open();
	}

	disconnect(): void {
		this.intentionalClose = true;
		this.reconnectAttempts = 0;

		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		this.subscriptions = [];
		this.deviceAuthWatchers = [];

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}

	subscribe(): void;
	subscribe(events: SubscribeEvents): void;
	subscribe(token: string): void;
	subscribe(token: string, events: SubscribeEvents): void;
	subscribe(
		tokenOrEvents?: string | SubscribeEvents,
		eventsArg?: SubscribeEvents,
	): void {
		let token: string;
		let events: SubscribeEvents;

		if (typeof tokenOrEvents === "string") {
			token = tokenOrEvents;
			events = eventsArg ?? ["challenge", "match"];
		} else if (Array.isArray(tokenOrEvents)) {
			token = this.defaultToken as string;
			events = tokenOrEvents;
		} else {
			token = this.defaultToken as string;
			events = ["challenge", "match"];
		}

		assert(nonEmptyStr, token, "token");
		assert(eventsSchema, events, "events");
		this.subscriptions.push({ token, events });

		if (this.ws?.readyState === WebSocket.OPEN) {
			this._send<SubscribeMessage>({
				type: "subscribe",
				content: {
					events,
					authorization: token.startsWith("Bearer ")
						? token
						: `Bearer ${token}`,
				},
			});
		}
	}

	watchDeviceAuth(userCode: string, deviceCode: string): void {
		assert(nonEmptyStr, userCode, "userCode");
		assert(nonEmptyStr, deviceCode, "deviceCode");
		this.deviceAuthWatchers.push({ userCode, deviceCode });

		if (this.ws?.readyState === WebSocket.OPEN) {
			this._send<WatchDeviceAuthMessage>({
				type: "watch_device_auth",
				content: { userCode, deviceCode },
			});
		}
	}

	on<E extends WebSocketEvent["event"]>(
		event: E,
		handler: (msg: Extract<WebSocketEvent, { event: E }>) => void,
	): void {
		const existing = this.handlers.get(event);

		if (existing) {
			existing.push(handler as Handler);
		} else {
			this.handlers.set(event, [handler as Handler]);
		}
	}

	off(event: string, handler: Handler): void {
		const list = this.handlers.get(event);

		if (!list) return;

		const i = list.indexOf(handler);
		if (i !== -1) list.splice(i, 1);
	}

	/** @internal */
	private _open(): void {
		this.ws = new WebSocket(this.wsUrl);

		this.ws.onopen = () => {
			this.reconnectAttempts = 0;

			for (const sub of this.subscriptions) {
				this._send<SubscribeMessage>({
					type: "subscribe",
					content: {
						events: sub.events,
						authorization: sub.token.startsWith("Bearer ")
							? sub.token
							: `Bearer ${sub.token}`,
					},
				});
			}

			for (const watcher of this.deviceAuthWatchers) {
				this._send<WatchDeviceAuthMessage>({
					type: "watch_device_auth",
					content: {
						userCode: watcher.userCode,
						deviceCode: watcher.deviceCode,
					},
				});
			}
		};

		this.ws.onmessage = (msg: MessageEvent<string>) => {
			this._handleMessage(msg.data);
		};

		this.ws.onclose = () => {
			this.ws = null;
			if (!this.intentionalClose) {
				this._scheduleReconnect();
			}
		};
	}

	/** @internal */
	private _send<T extends ClientMessage>(message: T): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		}
	}

	/** @internal */
	private _handleMessage(data: string): void {
		let parsed: Record<string, unknown>;
		try {
			parsed = JSON.parse(data);
		} catch {
			return;
		}

		const eventKey = "event" in parsed ? "event" : null;
		const type = eventKey
			? (parsed.event as string)
			: "replied" in parsed
				? `response:${parsed.replied}`
				: null;

		if (!type) return;

		if (type === "device_auth") {
			const payload = parsed.payload as DeviceAuthPayload;
			this.deviceAuthWatchers = this.deviceAuthWatchers.filter(
				(w) => w.userCode !== payload.userCode,
			);
		}

		const handlers = this.handlers.get(type);
		if (!handlers) return;

		for (const handler of handlers) {
			try {
				handler(parsed as WebSocketEvent);
			} catch {}
		}
	}

	/** @internal */
	private _scheduleReconnect(): void {
		if (this.intentionalClose) return;

		const delay = Math.min(2 ** this.reconnectAttempts * 1000, 30000);
		this.reconnectAttempts++;

		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			this._open();
		}, delay);
	}
}
