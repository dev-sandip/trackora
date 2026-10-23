import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentEntity } from './entities/agent.entity.js';
import { AgentController } from './agent.controller.js';
import { AgentService } from './agent.service.js';
import { OrderModule } from '../orders/order.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentEntity]),
    forwardRef(() => OrderModule),
  ],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
