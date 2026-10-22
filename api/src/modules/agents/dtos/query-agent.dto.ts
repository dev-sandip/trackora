import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import type { AgentStatus } from '../entities/agent.entity.js';

export class QueryAgentDto {
  @ApiPropertyOptional({
    enum: ['offline', 'available', 'busy', 'break', 'suspended'],
  })
  @IsOptional()
  @IsEnum(['offline', 'available', 'busy', 'break', 'suspended'])
  status?: AgentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isOnline?: boolean;

  @ApiPropertyOptional({ example: 'bike' })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
