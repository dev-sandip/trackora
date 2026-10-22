import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentEntity } from './entities/agent.entity.js';
import { Module } from '@nestjs/common';

import { AgentController } from './agent.controller.js';
import { AgentService } from './agent.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([AgentEntity])],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [],
})
export class AgentModule {}
