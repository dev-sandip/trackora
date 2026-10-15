import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import   AuthRepository  from "@app/core/services/auth/index";
import { verifyPassword } from "../lib/hash.js";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, "local") {
  constructor() {
    super({ usernameField: "email", passwordField: "password" });
  }

  async validate(email: string, password: string) {
    const user = await AuthRepository.getUserByEmail(email);
    if (!user?.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return { id: user.id, email: user.email, role: user.role, name: user.name };
  }
}