import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service.js';
import type { AuthEntity } from '../entities/auth.entity.js';
import type { JwtPayload } from '../interfaces/jwt-payload.interface.js';

/**
 * Validates Bearer access tokens and re-checks the backing session in the DB
 * on every request, so logout / revoke / account-disable take effect instantly.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /** Runs after the signature/expiry check; the result is exposed as req.user. */
  async validate(payload: JwtPayload): Promise<AuthEntity> {
    return this.authService.validateSession(payload.sub, payload.sid);
  }
}
