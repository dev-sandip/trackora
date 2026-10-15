import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";
import   AuthRepository  from "@app/core/services/auth/index";
import { ENV } from "@app/core/lib/env";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
	constructor() {
		const secret = ENV.JWT_REFRESH_SECRET;

		if (!secret) {
			throw new Error("JWT refresh secret not configured");
		}

		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				(request: Request) => request?.cookies?.refreshToken ?? null,
			]),
			ignoreExpiration: false,
			secretOrKey: secret,
			passReqToCallback: true,
		});
	}

	async validate(req: Request, _payload: { sub: string; email?: string; role?: string }) {
		const refreshToken = req.cookies?.refreshToken;

		if (!refreshToken) {
			throw new UnauthorizedException("Refresh token not provided");
		}

		const session = await AuthRepository.validateSession(refreshToken);

		if (!session) {
			throw new UnauthorizedException("Invalid or expired refresh token");
		}

		return {
			id: session.user.id,
			email: session.user.email,
			role: session.user.role,
			name: session.user.name,
		};
	}
}
