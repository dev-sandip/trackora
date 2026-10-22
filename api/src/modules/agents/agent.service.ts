import { ConflictException, Injectable } from '@nestjs/common';
import { AgentEntity } from './entities/agent.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAgentDto } from './dtos/create-agent.dto.js';

@Injectable()
export class AgentService {
  constructor(
    @InjectRepository(AgentEntity)
    private readonly agentRepository: Repository<AgentEntity>,
  ) {}

  async create(agent: CreateAgentDto): Promise<AgentEntity> {
    const exists = await this.agentRepository.findOne({
      where: { userId: agent.userId },
    });
    if (exists) {
      throw new ConflictException('Agent profile already exists for this user');
    }
    const newAgent = this.agentRepository.create({
      userId: agent.userId,
      vehicleType: agent.vehicleType ?? null,
      vehiclePlate: agent.vehiclePlate ?? null,
      maxConcurrentOrders: agent.maxConcurrentOrders ?? 1,
    });
    return this.agentRepository.save(newAgent);
  }
}
