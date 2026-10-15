import {
	Injectable,
	type NestInterceptor,
	type ExecutionContext,
	type CallHandler,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import { map } from "rxjs/operators";

interface ResponseData<T> {
	success: boolean;
	data?: T;
	error?: unknown;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseData<T>> {
	intercept(_context: ExecutionContext, next: CallHandler): Observable<ResponseData<T>> {
		return next.handle().pipe(
			map((data) => {
				if (data && typeof data === "object" && "success" in data) {
					return data as ResponseData<T>;
				}
				return { success: true, data };
			}),
		);
	}
}
