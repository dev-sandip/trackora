import { AuthEntity } from '../entities/auth.entity.js';

/** Public shape of a user — the password hash never leaves the service layer. */
export type SafeAuthUser = Omit<AuthEntity, 'password'>;

/** Strips the password hash (and any other secret) from a user entity. */
export function toSafeUser(user: AuthEntity): SafeAuthUser {
  const { password: _password, ...safeUser } = user as AuthEntity & {
    password?: string;
  };
  return safeUser;
}
