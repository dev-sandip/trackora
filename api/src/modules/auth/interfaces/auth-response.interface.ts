import { AuthEntity } from '../entities/auth.entity.js';
import { AuthSessionEntity } from '../entities/session.entity.js';
import { SafeAuthUser } from '../lib/index.js';

/** Internal result produced by AuthService when issuing a token pair. */
export interface AuthTokensResult {
  user: AuthEntity;
  session: AuthSessionEntity;
  accessToken: string;
  refreshToken: string;
}

/** Payload returned by `POST /auth/login` and `POST /auth/refresh`. */
export interface AuthTokensResponse {
  user: SafeAuthUser;
  accessToken: string;
  /** null when AUTH_REFRESH_TOKEN_TRANSPORT=cookie (token is in the httpOnly cookie). */
  refreshToken: string | null;
  tokenType: 'Bearer';
  /** Access token lifetime in seconds. */
  expiresIn: number;
}
