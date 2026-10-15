import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { ENV } from "@app/core/lib/env";
import   AuthRepository  from "@app/core/services/auth/index";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
	constructor() {
		const secret = ENV.JWT_SECRET;
		if (!secret) {
			throw new Error("JWT secret not configured");
		}
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: secret,
		});
	}

	async validate(payload: { sub: string; email: string; role: string }) {
		const user = await AuthRepository.findUserById(payload.sub);
		if (!user?.isActive) {
			throw new UnauthorizedException("User not found or inactive");
		}
		return { id: user.id, email: user.email, role: user.role, name: user.name };
	}
}
