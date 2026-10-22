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
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

const REFRESH_COOKIE = 'refresh_token';
type RefreshTransport = 'both' | 'cookie' | 'body';

// SafeAuthUser is a TypeScript type, not a runtime Swagger model. Keep its
// schema generic rather than documenting AuthEntity and exposing private fields.
const SAFE_USER_SCHEMA = {
  type: 'object' as const,
  description: 'Safe user representation returned by toSafeUser; excludes private authentication fields.',
  additionalProperties: true,
};

const AUTH_TOKENS_SCHEMA = {
  type: 'object' as const,
  required: ['user', 'accessToken', 'refreshToken', 'tokenType', 'expiresIn'],
  properties: {
    user: SAFE_USER_SCHEMA,
    accessToken: {
      type: 'string' as const,
      description: 'Access token to send as Authorization: Bearer <accessToken>.',
    },
    refreshToken: {
      type: 'string' as const,
      nullable: true,
      description: 'Refresh token for body or both transport modes; null in cookie-only mode.',
    },
    tokenType: {
      type: 'string' as const,
      enum: ['Bearer'],
      example: 'Bearer',
    },
    expiresIn: {
      type: 'integer' as const,
      description: 'Access token lifetime in seconds.',
      example: 900,
    },
  },
};

const REFRESH_COOKIE_HEADERS = {
  'Set-Cookie': {
    description: 'In cookie or both transport modes, sets the HttpOnly refresh_token cookie. SameSite=Lax; Secure in production; path defaults to /auth and is configurable via AUTH_REFRESH_COOKIE_PATH.',
    schema: { type: 'string' as const },
  },
};

const CLEAR_REFRESH_COOKIE_HEADERS = {
  'Set-Cookie': {
    description: 'Clears the refresh_token cookie using its configured path and cookie attributes.',
    schema: { type: 'string' as const },
  },
};

@Controller('auth')
@ApiTags('Auth')
@ApiConsumes('application/json')
@ApiProduces('application/json')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a user and returns the safe user representation. Does not issue authentication tokens.',
  })
  @ApiBody({ type: RegisterDto, required: true, description: 'New user registration data.' })
  @ApiCreatedResponse({ description: 'User registered successfully', schema: SAFE_USER_SCHEMA })
  @ApiBadRequestResponse({ description: 'Invalid registration data' })
  async register(@Body() dto: RegisterDto): Promise<SafeAuthUser> {
    return this.authService.register(dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({
    summary: 'Log in and issue authentication tokens',
    description: 'Authenticates credentials and creates a session. AUTH_REFRESH_TOKEN_TRANSPORT controls refresh token delivery: both (default) returns it in JSON and an HttpOnly cookie; cookie returns null in JSON and sets the cookie; body returns it only in JSON. This POST returns HTTP 201.',
  })
  @ApiBody({ type: LoginDto, required: true, description: 'User login credentials.' })
  @ApiCreatedResponse({
    description: 'Authentication tokens issued successfully',
    schema: AUTH_TOKENS_SCHEMA,
    headers: REFRESH_COOKIE_HEADERS,
  })
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
  @ApiOperation({
    summary: 'Refresh authentication tokens',
    description: 'Exchanges a refresh token for new authentication tokens. Reads refresh_token from the cookie first, falling back to refreshToken in the JSON body. No access token is required. Token delivery follows AUTH_REFRESH_TOKEN_TRANSPORT, as for login. This POST returns HTTP 201. Browser clients must send cookies with credentials enabled when using cookie transport.',
  })
  @ApiHeader({
    name: 'Cookie',
    required: false,
    description: 'Alternative to the JSON refreshToken field; takes precedence when present. Browsers manage this header automatically, subject to cookie policy.',
    schema: { type: 'string', example: 'refresh_token=<refresh-token>' },
  })
  @ApiBody({
    type: RefreshTokenDto,
    required: false,
    description: 'Refresh token when not supplied by cookie. A token must be supplied through either the cookie or body.',
  })
  @ApiCreatedResponse({
    description: 'Authentication tokens refreshed successfully',
    schema: AUTH_TOKENS_SCHEMA,
    headers: REFRESH_COOKIE_HEADERS,
  })
  @ApiBadRequestResponse({ description: 'Refresh token is missing or request data is invalid' })
  @ApiUnauthorizedResponse({ description: 'Refresh token is invalid, expired, revoked, or otherwise unauthorized' })
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
  @ApiOperation({
    summary: 'Log out the current session',
    description: 'Requires a valid bearer access token. Revokes the session identified by the refresh token, preferring the refresh_token cookie over the JSON refreshToken field, and clears the refresh cookie. If no refresh token is supplied, only the cookie is cleared. Returns no response body.',
  })
  @ApiHeader({
    name: 'Cookie',
    required: false,
    description: 'Optional refresh token cookie; takes precedence over the JSON refreshToken field. Browsers manage this header automatically.',
    schema: { type: 'string', example: 'refresh_token=<refresh-token>' },
  })
  @ApiBody({
    type: RefreshTokenDto,
    required: false,
    description: 'Optional refresh token identifying the session to revoke when no refresh cookie is supplied.',
  })
  @ApiNoContentResponse({
    description: 'Logout completed and refresh cookie cleared',
    headers: CLEAR_REFRESH_COOKIE_HEADERS,
  })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required or the access token is invalid or expired' })
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
  @ApiOperation({
    summary: 'Log out all sessions',
    description: 'Revokes all sessions belonging to the authenticated user and clears the refresh cookie. Requires a valid bearer access token; no request body is needed. This POST returns HTTP 201.',
  })
  @ApiCreatedResponse({
    description: 'All user sessions revoked successfully',
    schema: {
      type: 'object',
      required: ['revokedSessions'],
      properties: {
        revokedSessions: { type: 'boolean', enum: [true], example: true },
      },
    },
    headers: CLEAR_REFRESH_COOKIE_HEADERS,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required or the access token is invalid or expired' })
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
  @ApiOperation({
    summary: 'Get the current user',
    description: 'Returns the safe user representation for the user identified by the bearer access token.',
  })
  @ApiOkResponse({ description: 'Returns the authenticated user', schema: SAFE_USER_SCHEMA })
  @ApiUnauthorizedResponse({ description: 'Authentication is required or the access token is invalid or expired' })
  me(@CurrentUser() user: AuthEntity): SafeAuthUser {
    return toSafeUser(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('all-users')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all users',
    description: 'Returns an unpaginated array of safe user representations. Requires a valid bearer access token and the admin role.',
  })
  @ApiOkResponse({
    description: 'Returns all users safe for client exposure',
    schema: { type: 'array', items: SAFE_USER_SCHEMA },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required or the access token is invalid or expired' })
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
