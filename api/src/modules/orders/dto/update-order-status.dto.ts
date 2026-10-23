import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import type { OrderStatus } from '../entities/order.entity.js';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: [
      'pending', 'confirmed', 'preparing', 'ready_for_pickup',
      'assigned', 'picked_up', 'on_the_way', 'delivered',
      'cancelled', 'failed',
    ],
  })
  @IsEnum([
    'pending', 'confirmed', 'preparing', 'ready_for_pickup',
    'assigned', 'picked_up', 'on_the_way', 'delivered',
    'cancelled', 'failed',
  ])
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Required when status = assigned' })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
