import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import type { JwtPayload } from './interfaces/jwt-payload.interface.js';

const DURATION_PATTERN = /^(\d+)([smhd])?$/;
const UNIT_MS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/**
 * Creates the artifacts of the token pair:
 * - short-lived signed JWT access tokens,
 * - opaque random refresh tokens (only their SHA-256 hash is ever persisted).
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /** Signs a short-lived access token for the given session. */
  signAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  /**
   * Cryptographically random refresh token (96 hex chars, fits varchar(255)).
   * Raw value lives only with the client; the DB keeps the SHA-256 digest.
   */
  generateRefreshToken(): string {
    return randomBytes(48).toString('hex');
  }

  /** SHA-256 digest stored in `sessions.tokenHash`. */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Access token lifetime in seconds (exposed as `expiresIn` in responses). */
  getAccessTokenTtlSeconds(): number {
    const value = this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m';
    return Math.floor(this.parseDuration(value) / 1_000);
  }

  /** Refresh token lifetime in milliseconds (session expiry + cookie expiry). */
  getRefreshTokenTtlMs(): number {
    const value =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    return this.parseDuration(value);
  }

  /** Accepts `30s`, `15m`, `12h`, `7d` or a plain number of seconds. */
  private parseDuration(value: string): number {
    const match = DURATION_PATTERN.exec(value.trim().toLowerCase());
    if (!match) {
      throw new Error(
        `Invalid duration "${value}" — expected formats like 30s, 15m, 12h, 7d.`,
      );
    }
    const unit = (match[2] ?? 's') as keyof typeof UNIT_MS;
    return Number(match[1]) * UNIT_MS[unit];
  }
}
