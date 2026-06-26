import type { SubscribeEvents } from "@/api/helper";

export interface WSErrorPayload {
	status: number;
	code: string;
	message: string;
}

export interface WatchDeviceAuthResponsePayload {
	userCode: string;
}

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

export function createWSResponse<T extends WebSocketResponse["type"]>(
	replied: T,
	target: string | undefined,
	payload: Extract<WebSocketResponse, { type: T }>["payload"],
): string {
	const message = {
		replied,
		success: true,
		target,
		payload,
		timestamp: Date.now(),
	} as unknown as ServerResponseSuccess<T>;
	return JSON.stringify(message);
}

export enum WSErrors {
	CONFLICT = 409,
	NOT_FOUND = 404,
	UNAUTHORIZED = 401,
}

const errorMessages = {
	[WSErrors.CONFLICT]: "Conflict with current state",
	[WSErrors.NOT_FOUND]: "Resource not found",
	[WSErrors.UNAUTHORIZED]: "Missing or invalid authentication",
};

export function createWSError<T extends WebSocketResponse["type"]>(
	replied: T,
	target: string | undefined,
	status: WSErrors,
	customMessage?: string,
): string {
	const code = WSErrors[status];

	const payload = {
		status,
		code,
		message: customMessage || errorMessages[status],
	};

	const message = {
		replied,
		success: false,
		target,
		payload,
		timestamp: Date.now(),
	} as ServerResponseError<T>;
	return JSON.stringify(message);
}
