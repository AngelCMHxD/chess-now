export interface ApiSuccessResponse<T> {
	success: true;
	data: T;
}

export interface ApiErrorResponse {
	success: false;
	error: {
		status: number;
		code: string;
		message: string;
	};
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
