import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
	@ApiProperty({ example: "user@example.com" })
	@IsEmail()
	email: string;

	@ApiProperty({ example: "password123" })
	@IsString()
	@MinLength(8)
	@MaxLength(128)
	password: string;
}

export class RegisterDto {
	@ApiProperty({ example: "John Doe" })
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	name: string;

	@ApiProperty({ example: "user@example.com" })
	@IsEmail()
	email: string;

	@ApiProperty({ example: "password123" })
	@IsString()
	@MinLength(8)
	@MaxLength(128)
	password: string;

	@ApiProperty({ example: "password123" })
	@IsString()
	@MinLength(8)
	@MaxLength(128)
	confirmPassword: string;
}

export class RefreshTokenDto {
	@ApiProperty()
	@IsString()
	refreshToken: string;
}

export class LogoutDto {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	refreshToken?: string;
}
