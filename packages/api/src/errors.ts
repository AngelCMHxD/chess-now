export interface ErrorPayload {
	status: number;
	code: string;
	message: string;
}

export class ChessNowError extends Error {
	status: number;
	code: string;

	constructor(status: number, code: string, message: string) {
		super(message);
		this.name = this.constructor.name;
		this.status = status;
		this.code = code;
	}

	static fromResponse(status: number, body: unknown): ChessNowError {
		if (
			typeof body === "object" &&
			body !== null &&
			"success" in body &&
			(body as Record<string, unknown>).success === false &&
			"error" in body
		) {
			const err = (body as Record<string, unknown>).error as ErrorPayload;
			return new ChessNowError(err.status, err.code, err.message);
		}

		return new ChessNowError(
			status,
			"UNKNOWN_ERROR",
			`Request failed with status ${status}`,
		);
	}
}

export class UnauthorizedError extends ChessNowError {
	constructor(message = "Missing or invalid authentication") {
		super(401, "UNAUTHORIZED", message);
	}
}

export class ForbiddenError extends ChessNowError {
	constructor(
		message = "The authenticated entity lacks the required permissions",
	) {
		super(403, "FORBIDDEN", message);
	}
}

export class NotFoundError extends ChessNowError {
	constructor(message = "Resource not found") {
		super(404, "NOT_FOUND", message);
	}
}

export class ConflictError extends ChessNowError {
	constructor(message = "Conflict with current state") {
		super(409, "CONFLICT", message);
	}
}

export class BadRequestError extends ChessNowError {
	constructor(message = "The request is malformed or invalid") {
		super(400, "BAD_REQUEST", message);
	}
}

export class UnprocessableContentError extends ChessNowError {
	constructor(message = "Content provided is invalid") {
		super(422, "UNPROCESSABLE_CONTENT", message);
	}
}
