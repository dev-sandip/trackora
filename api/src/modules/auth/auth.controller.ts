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
import { LocalAuthGuard } from './guards/local-auth.guard.js';
import { LoginDto } from './dtos/login.dto.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { AuthEntity } from './entities/auth.entity.js';
import { RefreshTokenDto } from './dtos/refresh-token.js';
import { RolesGuard } from './guards/roles.guard.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { Roles } from './decorators/roles.decorator.js';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

const REFRESH_COOKIE = 'refresh_token';
type RefreshTransport = 'both' | 'cookie' | 'body';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ description: 'User registered successfully' })
  @ApiBadRequestResponse({ description: 'Invalid registration data' })
  async register(@Body() dto: RegisterDto): Promise<SafeAuthUser> {
    return this.authService.register(dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Log in and issue authentication tokens' })
  @ApiOkResponse({ description: 'Authentication tokens issued successfully' })
  @ApiBadRequestResponse({ description: 'Invalid login data' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(
    @Body() _dto: LoginDto, // present so the global ValidationPipe runs first
    @CurrentUser() user: AuthEntity,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthTokensResponse> {
    const result = await this.authService.login(user);
    return this.buildTokensResponse(response, result);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh authentication tokens' })
  @ApiOkResponse({
    description: 'Authentication tokens refreshed successfully',
  })
  @ApiBadRequestResponse({ description: 'Refresh token is missing or invalid' })
  @ApiUnauthorizedResponse({ description: 'Refresh token is unauthorized' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out the current session' })
  @ApiNoContentResponse({ description: 'Session logged out successfully' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out all sessions' })
  @ApiOkResponse({ description: 'All user sessions revoked successfully' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user' })
  @ApiOkResponse({ description: 'Returns the authenticated user' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  me(@CurrentUser() user: AuthEntity): SafeAuthUser {
    return toSafeUser(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('all-users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users' })
  @ApiOkResponse({ description: 'Returns all users safe for client exposure' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @ApiForbiddenResponse({ description: 'Admin role is required' })
  async getAllUsers(): Promise<SafeAuthUser[]> {
    return await this.authService.getAllUsers();
  }

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
