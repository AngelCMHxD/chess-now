export class APIError extends Error {
	status = 500;
	code = "INTERNAL_ERROR";

	constructor(message = "An unexpected server error occurred.") {
		super(message);
		this.name = this.constructor.name;
	}

	toResponse() {
		return {
			success: false,
			error: {
				status: this.status,
				code: this.code,
				message: this.message,
			},
		};
	}
}

export class UnauthorizedError extends APIError {
	status = 401;
	code = "UNAUTHORIZED";

	constructor(message: string = "Missing or invalid authentication") {
		super(message);
	}
}

export class ForbiddenError extends APIError {
	status = 403;
	code = "FORBIDDEN";

	constructor(
		message: string = "The authenticated entity lacks the required permissions",
	) {
		super(message);
	}
}

export class BadRequestError extends APIError {
	status = 400;
	code = "BAD_REQUEST";

	constructor(message: string = "The request is malformed or invalid") {
		super(message);
	}
}

export class NotFoundError extends APIError {
	status = 404;
	code = "NOT_FOUND";

	constructor(message: string = "Resource not found") {
		super(message);
	}
}

export class ConflictError extends APIError {
	status = 409;
	code = "CONFLICT";

	constructor(message: string = "Conflict with current state") {
		super(message);
	}
}

export class UnprocessableContentError extends APIError {
	status = 422;
	code = "UNPROCESSABLE_CONTENT";

	constructor(message: string = "Content provided is invalid") {
		super(message);
	}
}
