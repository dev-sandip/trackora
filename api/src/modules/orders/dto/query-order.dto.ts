import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import type { OrderStatus } from '../entities/order.entity.js';

export class QueryOrderDto {
  @ApiPropertyOptional({ enum: [
    'pending', 'confirmed', 'preparing', 'ready_for_pickup',
    'assigned', 'picked_up', 'on_the_way', 'delivered',
    'cancelled', 'failed',
  ]})
  @IsOptional()
  @IsEnum([
    'pending', 'confirmed', 'preparing', 'ready_for_pickup',
    'assigned', 'picked_up', 'on_the_way', 'delivered',
    'cancelled', 'failed',
  ])
  status?: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  agentId?: string;
}
