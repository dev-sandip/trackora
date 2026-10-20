import {
  Injectable,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthEntity } from './entities/auth.entity.js';
import { IsNull, Repository } from 'typeorm';
import { AuthSessionEntity } from './entities/session.entity.js';
import { RegisterDto } from './dtos/regsiter.dto.js';
import { SafeAuthUser, toSafeUser } from './lib/index.js';
import { compare, hash } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dtos/login.dto.js';
import { AuthTokensResult } from './interfaces/auth-response.interface.js';
import { TokenService } from './token.service.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
    @InjectRepository(AuthSessionEntity)
    private readonly authSessionRepository: Repository<AuthSessionEntity>,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto): Promise<SafeAuthUser> {
    const existingUser = await this.authRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }
    var saltRounds = this.configService.getOrThrow<number>(
      'BCRYPT_SALT_ROUNDS',
      10,
    );
    saltRounds = Number(saltRounds);
    if (!saltRounds || saltRounds < 1) {
      throw new NotImplementedException('Invalid BCRYPT_SALT_ROUNDS value');
    }
    const passwordHash = await hash(dto.password, saltRounds);
    const newUser = this.authRepository.create({
      ...dto,
      password: passwordHash,
    });
    const savedUser = await this.authRepository.save(newUser);
    return toSafeUser(savedUser);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<SafeAuthUser | null> {
    const user = await this.authRepository
      .createQueryBuilder('user')
      .addSelect('user.password') // password is `select: false` on the entity
      .where('user.email = :email', { email: email.trim().toLowerCase() })
      .getOne();

    if (!user || !user.isActive) {
      return null;
    }
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }
    return toSafeUser(user);
  }

  async login(user: AuthEntity): Promise<AuthTokensResult> {
    return this.issueTokenPair(user);
  }
  private signAccessToken(
    sessionId: string,
    user: AuthEntity,
  ): Promise<string> {
    return this.tokenService.signAccessToken({
      sub: user.id,
      sid: sessionId,
      email: user.email,
      role: user.role,
    });
  }
  /**
   * Exchanges a valid refresh token for a new pair. The presented token is
   * rotated in place (single-use); replaying a revoked token revokes every
   * session of that user — a standard mitigation for stolen tokens.
   */
  async refresh(rawRefreshToken: string): Promise<AuthTokensResult> {
    const session = await this.authSessionRepository.findOne({
      where: { tokenHash: this.tokenService.hashToken(rawRefreshToken) },
      relations: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (session.revokedAt) {
      await this.revokeAllSessions(session.userId);
      throw new UnauthorizedException('Refresh token has been revoked');
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token has expired');
    }
    if (!session.user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const refreshToken = this.tokenService.generateRefreshToken();
    session.tokenHash = this.tokenService.hashToken(refreshToken);
    session.expiresAt = new Date(
      Date.now() + this.tokenService.getRefreshTokenTtlMs(),
    );
    await this.authSessionRepository.save(session);

    return {
      user: session.user,
      session,
      accessToken: await this.signAccessToken(session.id, session.user),
      refreshToken,
    };
  }

  /** Revokes the session that owns the presented refresh token (idempotent). */
  async logout(rawRefreshToken: string): Promise<void> {
    const session = await this.authSessionRepository.findOne({
      where: { tokenHash: this.tokenService.hashToken(rawRefreshToken) },
    });
    if (session && !session.revokedAt) {
      session.revokedAt = new Date();
      await this.authSessionRepository.save(session);
    }
  }

  /** Revokes every active session of a user ("logout everywhere"). */
  async revokeAllSessions(userId: string): Promise<void> {
    await this.authSessionRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  /**
   * Per-request validation used by JwtStrategy: a single joined query confirms
   * the session is alive (not revoked, not expired) and its user is active.
   */
  async validateSession(
    userId: string,
    sessionId: string,
  ): Promise<AuthEntity> {
    const session = await this.authSessionRepository.findOne({
      where: { id: sessionId, userId },
      relations: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Session no longer exists');
    }
    if (session.revokedAt) {
      throw new UnauthorizedException('Session has been revoked');
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Session has expired');
    }
    if (!session.user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    return session.user;
  }

  /** Housekeeping: delete sessions that expired more than `olderThanDays` ago. */
  async purgeExpiredSessions(olderThanDays = 30): Promise<void> {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1_000);
    await this.authSessionRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :cutoff', { cutoff })
      .execute();
  }

  private async issueTokenPair(user: AuthEntity): Promise<AuthTokensResult> {
    const refreshToken = this.tokenService.generateRefreshToken();
    const session = this.authSessionRepository.create({
      userId: user.id,
      tokenHash: this.tokenService.hashToken(refreshToken),
      expiresAt: new Date(
        Date.now() + this.tokenService.getRefreshTokenTtlMs(),
      ),
    });
    await this.authSessionRepository.save(session);

    return {
      user,
      session,
      accessToken: await this.signAccessToken(session.id, user),
      refreshToken,
    };
  }
}
