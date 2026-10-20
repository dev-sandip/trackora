import { IsOptional, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDto {
  /** Raw refresh token. Optional when it is sent via the httpOnly cookie instead. */
  @ApiPropertyOptional({
    description:
      'Raw refresh token. Optional when sent via the httpOnly cookie.',
    minLength: 32,
    maxLength: 255,
    example: 'your-refresh-token',
  })
  @IsOptional()
  @IsString()
  @Length(32, 255)
  refreshToken?: string;
}
