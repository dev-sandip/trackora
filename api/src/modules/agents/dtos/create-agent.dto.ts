import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateAgentDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({
    example: 'bike',
    enum: ['bike', 'scooter', 'car', 'van'],
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  vehicleType?: string;

  @ApiPropertyOptional({ example: 'BA 12 PA 3456' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  vehiclePlate?: string;

  @ApiPropertyOptional({ example: 2, minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxConcurrentOrders?: number;
}
