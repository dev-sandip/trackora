import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ example: 'Thamel, Kathmandu' })
  @IsString()
  @MaxLength(500)
  pickupAddress: string;

  @ApiPropertyOptional({ example: 27.715 })
  @IsOptional()
  @IsNumber()
  pickupLat?: number;

  @ApiPropertyOptional({ example: 85.312 })
  @IsOptional()
  @IsNumber()
  pickupLng?: number;

  @ApiProperty({ example: 'Lazimpat, Kathmandu' })
  @IsString()
  @MaxLength(500)
  deliveryAddress: string;

  @ApiPropertyOptional({ example: 27.721 })
  @IsOptional()
  @IsNumber()
  deliveryLat?: number;

  @ApiPropertyOptional({ example: 85.330 })
  @IsOptional()
  @IsNumber()
  deliveryLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 450 })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  deliveryFee: number;

  @ApiPropertyOptional({ example: 'Ram Bahadur' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: '9800000000' })
  @IsOptional()
  @IsString()
  customerPhone?: string;
}
