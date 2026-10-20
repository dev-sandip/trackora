import { AuthGuard } from '@nestjs/passport';

/** Runs the `jwt` strategy (Bearer access token) before the route handler. */
export class JwtAuthGuard extends AuthGuard('jwt') {}
