import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    minLength: 2,
    maxLength: 100,
    example: 'Sandip Sapkota',
    description: 'Display name shown across the app.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    maxLength: 255,
    format: 'email',
    example: 'contact@thesandip.dev',
    description: 'Unique email used as the login identifier.',
  })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    minLength: 8,
    maxLength: 72,
    format: 'password',
    example: 'P@ssw0rd!',
    description: 'Plain password; hashed with bcrypt before storage.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
