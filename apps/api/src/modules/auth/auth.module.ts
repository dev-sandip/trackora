import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./strategies/jwt.strategy.js";
import { JwtRefreshStrategy } from "./strategies/jwt-refresh.strategy.js";
import { LocalStrategy } from "./strategies/local.strategy.js";
import { ENV } from "@app/core/lib/env";


@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: "jwt",
    }),
    JwtModule.register({
      secret: ENV.JWT_SECRET,
      signOptions: {
        expiresIn: ENV.JWT_EXPIRES_IN,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    LocalStrategy,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}