import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type {
  AuthTokensResponse,
  AuthTokensResult,
} from './interfaces/auth-response.interface.js';
import { TokenService } from './token.service.js';
import { AuthService } from './auth.service.js';
import { type SafeAuthUser, toSafeUser } from './lib/index.js';
import { RegisterDto } from './dtos/regsiter.dto.js';
import { LocalAuthGuard } from './decorators/local-auth.guard.js';
import { LoginDto } from './dtos/login.dto.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { AuthEntity } from './entities/auth.entity.js';
import { RefreshTokenDto } from './dtos/refresh-token.js';
import { RolesGuard } from './decorators/roles.guard.js';
import { JwtAuthGuard } from './decorators/jwt-auth.guard.js';
import { Roles } from './decorators/roles.decorator.js';

const REFRESH_COOKIE = 'refresh_token';
type RefreshTransport = 'both' | 'cookie' | 'body';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<SafeAuthUser> {
    return this.authService.register(dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Body() _dto: LoginDto, // present so the global ValidationPipe runs first
    @CurrentUser() user: AuthEntity,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthTokensResponse> {
    const result = await this.authService.login(user);
    return this.buildTokensResponse(response, result);
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: RefreshTokenDto,
  ): Promise<AuthTokensResponse> {
    const rawToken = this.extractRefreshToken(request, dto.refreshToken);
    const result = await this.authService.refresh(rawToken);
    return this.buildTokensResponse(response, result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: RefreshTokenDto,
  ): Promise<void> {
    const rawToken = this.extractOptionalRefreshToken(
      request,
      dto.refreshToken,
    );
    if (rawToken) {
      await this.authService.logout(rawToken);
    }
    this.clearRefreshTokenCookie(response);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(
    @CurrentUser() user: AuthEntity,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ revokedSessions: true }> {
    await this.authService.revokeAllSessions(user.id);
    this.clearRefreshTokenCookie(response);
    return { revokedSessions: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthEntity): SafeAuthUser {
    return toSafeUser(user);
  }

  /** Demo of route-level RBAC — remove or adapt to your feature modules. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin-dashboard')
  adminDashboard(@CurrentUser() user: AuthEntity): {
    message: string;
    requestedBy: string;
  } {
    return { message: 'Welcome, admin.', requestedBy: user.email };
  }

  // --- helpers -------------------------------------------------------------

  /** Reads the raw refresh token from the httpOnly cookie, else the body. */
  private extractRefreshToken(request: Request, bodyToken?: string): string {
    const rawToken = this.extractOptionalRefreshToken(request, bodyToken);
    if (!rawToken) {
      throw new BadRequestException(
        'Refresh token is required (cookie or body)',
      );
    }
    return rawToken;
  }

  private extractOptionalRefreshToken(
    request: Request,
    bodyToken?: string,
  ): string | undefined {
    const cookieToken = (
      request as Request & { cookies?: Record<string, string> }
    ).cookies?.[REFRESH_COOKIE];
    return cookieToken ?? bodyToken;
  }

  private buildTokensResponse(
    response: Response,
    result: AuthTokensResult,
  ): AuthTokensResponse {
    const transport =
      this.configService.get<RefreshTransport>(
        'AUTH_REFRESH_TOKEN_TRANSPORT',
      ) ?? 'both';
    const expiresIn = this.tokenService.getAccessTokenTtlSeconds();

    if (transport === 'body') {
      // The client stores the token itself; do not duplicate it into a cookie.
      return {
        user: toSafeUser(result.user),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        tokenType: 'Bearer',
        expiresIn,
      };
    }

    this.attachRefreshTokenCookie(
      response,
      result.refreshToken,
      result.session.expiresAt,
    );
    return {
      user: toSafeUser(result.user),
      accessToken: result.accessToken,
      refreshToken: transport === 'both' ? result.refreshToken : null,
      tokenType: 'Bearer',
      expiresIn,
    };
  }

  private attachRefreshTokenCookie(
    response: Response,
    token: string,
    expiresAt: Date,
  ): void {
    response.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: this.refreshCookiePath(),
      expires: expiresAt,
    });
  }

  private clearRefreshTokenCookie(response: Response): void {
    response.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: this.refreshCookiePath(),
    });
  }

  /** If the app uses `setGlobalPrefix('api')`, set AUTH_REFRESH_COOKIE_PATH=/api/auth. */
  private refreshCookiePath(): string {
    return (
      this.configService.get<string>('AUTH_REFRESH_COOKIE_PATH') ?? '/auth'
    );
  }
}
