import {
	type ExceptionFilter,
	Catch,
	type ArgumentsHost,
	HttpException,
	HttpStatus,
	Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AppError } from "@app/core/lib/response";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	private readonly logger = new Logger(AllExceptionsFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		let status = HttpStatus.INTERNAL_SERVER_ERROR;
		let code = "INTERNAL_ERROR";
		let message = "Internal server error";
		let details: unknown;

		if (exception instanceof AppError) {
			status = exception.statusCode;
			code = exception.code;
			message = exception.message;
			details = exception.details;
		} else if (exception instanceof HttpException) {
			status = exception.getStatus();
			const res = exception.getResponse();
			if (typeof res === "object" && res !== null) {
				const errorRes = res as Record<string, unknown>;
				code =
					(errorRes.code as string) || exception.name.toUpperCase().replace("EXCEPTION", "_ERROR");
				message = (errorRes.message as string) || exception.message;
				details = errorRes.details;
			} else {
				message = exception.message;
			}
		} else if (exception instanceof Error) {
			message = exception.message;
			this.logger.error(exception.stack);
		}

		const errorResponse = {
			success: false,
			error: { code, message, ...(details !== undefined ? { details } : {}) },
			timestamp: new Date().toISOString(),
			path: request.url,
		};

		if (status >= 500) {
			this.logger.error(
				`${request.method} ${request.url} - ${status} - ${message}`,
				exception instanceof Error ? exception.stack : "",
			);
		}

		response.status(status).json(errorResponse);
	}
}
