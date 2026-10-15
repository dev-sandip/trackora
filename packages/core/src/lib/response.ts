export class AppError extends Error {
	public readonly code: string;
	public readonly statusCode: number;
	public readonly details?: unknown;

	constructor(code: string, message: string, statusCode: number = 400, details?: unknown) {
		super(message);
		this.name = "AppError";
		this.code = code;
		this.statusCode = statusCode;
		this.details = details;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export const Errors = {
	badRequest: (message: string, details?: unknown) =>
		new AppError("BAD_REQUEST", message, 400, details),
	unauthorized: (message = "Unauthorized", details?: unknown) =>
		new AppError("UNAUTHORIZED", message, 401, details),
	forbidden: (message = "Forbidden", details?: unknown) =>
		new AppError("FORBIDDEN", message, 403, details),
	notFound: (message = "Not found", details?: unknown) =>
		new AppError("NOT_FOUND", message, 404, details),
	conflict: (message: string, details?: unknown) => new AppError("CONFLICT", message, 409, details),
	internal: (message = "Internal server error", details?: unknown) =>
		new AppError("INTERNAL_ERROR", message, 500, details),
	validation: (details: unknown) =>
		new AppError("VALIDATION_ERROR", "Validation failed", 400, details),
};

export const successResponse = <T>(data: T, meta?: Record<string, unknown>) => ({
	success: true as const,
	data,
	...(meta && { meta }),
});

export const errorResponse = (error: AppError) => ({
	success: false as const,
	error: {
		code: error.code,
		message: error.message,
		...(error.details !== undefined ? { details: error.details } : {}),
	},
});

export type SuccessResponse<T> = ReturnType<typeof successResponse<T>>;
export type ErrorResponse = ReturnType<typeof errorResponse>;
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
