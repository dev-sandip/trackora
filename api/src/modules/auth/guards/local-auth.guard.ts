import { AuthGuard } from '@nestjs/passport';

/** Runs the `local` strategy (email + password) before the route handler. */
export class LocalAuthGuard extends AuthGuard('local') {}
