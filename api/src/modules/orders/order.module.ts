import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity.js';
import { AgentModule } from '../agents/agent.module.js';
import { OrderController } from './order.controller.js';
import { OrdersService } from './order.service.js';
import { OrdersGateway } from './order.gateway.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity]),
    forwardRef(() => AgentModule),
  ],
  controllers: [OrderController],
  providers: [OrdersService, OrdersGateway],
  exports: [OrdersService, OrdersGateway],
})
export class OrderModule {}
