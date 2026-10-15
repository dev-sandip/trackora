import   AuthRepository  from '@app/core/services/auth/index';
import { Injectable } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { LoginDto, RegisterDto } from './dtos/auth.dto.js';
import { NewUser, User } from '@app/core/db/user';
import { hashPassword } from './lib/hash.js';
import { ENV } from '@app/core/lib/env';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
  ) {}

  async validateUser(email:string):Promise<User | null> {
    return AuthRepository.getUserByEmail(email);
  }
  async register(data:RegisterDto):Promise<NewUser> {
    const hashedPassword = await hashPassword(data.password);
    return AuthRepository.createUser({
      email: data.email,
      name: data.name,
      password:  hashedPassword,
    });
  }

  async generateTokens(user:User):Promise<{accessToken:string, refreshToken:string}> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    

    const accessToken = this.jwtService.sign(payload, {
      secret: ENV.JWT_SECRET,
      expiresIn: ENV.JWT_EXPIRES_IN,
    });

    const refreshToken = randomBytes(32).toString("hex");
    
    await AuthRepository.createSession(user.id, 7, refreshToken);

    return { accessToken, refreshToken };
  }

}


