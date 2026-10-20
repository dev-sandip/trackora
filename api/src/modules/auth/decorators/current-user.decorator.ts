import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthEntity } from '../entities/auth.entity.js';

/** Injects the authenticated user resolved by the JWT / local strategy. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, executionContext: ExecutionContext): AuthEntity => {
    const request = executionContext
      .switchToHttp()
      .getRequest<{ user: AuthEntity }>();
    return request.user;
  },
);
