import type { UserRole } from '../entities/auth.entity.js';

/** Claims embedded in every signed access token. */
export interface JwtPayload {
  /** Subject — the authenticated user's id. */
  sub: string;
  /** Session id — links the token to its `sessions` row for DB-backed revocation. */
  sid: string;
  /** User's email at the time the token was issued. */
  email: string;
  /** User's role at the time the token was issued. */
  role: UserRole;
}
