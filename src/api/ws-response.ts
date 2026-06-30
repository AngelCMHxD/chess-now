import type {
	ServerResponseError,
	ServerResponseSuccess,
	WebSocketResponse,
} from "@chess-now/api";

export type {
	ServerResponse,
	ServerResponseError,
	ServerResponseSuccess,
	SubscribeEvents,
	SubscribeResponsePayload,
	WatchDeviceAuthResponsePayload,
	WebSocketResponse,
	WSErrorPayload,
} from "@chess-now/api";

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
