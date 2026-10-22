import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MaxLength,
} from 'class-validator';
import type { AgentStatus } from '../entities/agent.entity.js';

export class UpdateAgentDto {
  @ApiPropertyOptional({
    enum: ['offline', 'available', 'busy', 'break', 'suspended'],
  })
  @IsOptional()
  @IsEnum(['offline', 'available', 'busy', 'break', 'suspended'])
  status?: AgentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @ApiPropertyOptional({ example: 'bike' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  vehicleType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  vehiclePlate?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxConcurrentOrders?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  currentOrderId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
