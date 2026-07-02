import type { ServerMessage, WsPushEvent } from "./ws-events";

export interface WSErrorPayload {
	status: number;
	code: string;
	message: string;
}

export interface WatchDeviceAuthResponsePayload {
	userCode: string;
}

export type SubscribeEvents = ("challenge" | "match" | "friend")[];

export interface SubscribeResponsePayload {
	userId: string;
	events: SubscribeEvents;
}

export type WebSocketResponse =
	| {
			type: "watch_device_auth";
			payload: WatchDeviceAuthResponsePayload;
	  }
	| {
			type: "subscribe";
			payload: SubscribeResponsePayload;
	  };

export type ServerResponseSuccess<T extends WebSocketResponse["type"]> = {
	replied: T;
	success: true;
	target: string | undefined;
	payload: Extract<WebSocketResponse, { type: T }>["payload"];
	timestamp: number;
};

export type ServerResponseError<T extends WebSocketResponse["type"]> = {
	replied: T;
	success: false;
	target: string | undefined;
	payload: WSErrorPayload;
	timestamp: number;
};

export type ServerResponse<T extends WebSocketResponse["type"]> =
	| ServerResponseSuccess<T>
	| ServerResponseError<T>;

export type WebSocketEvent =
	| ServerMessage<WsPushEvent["event"]>
	| ({ event: "response:subscribe" } & ServerResponse<"subscribe">)
	| ({
			event: "response:watch_device_auth";
	  } & ServerResponse<"watch_device_auth">);
