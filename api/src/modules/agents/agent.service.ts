import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgentEntity } from './entities/agent.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAgentDto } from './dtos/create-agent.dto.js';
import { QueryAgentDto } from './dtos/query-agent.dto.js';
import { UpdateAgentDto } from './dtos/update-agent.dto.js';
import { UpdateLocationDto } from './dtos/update-location.dto.js';

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
  async listAllRegisteredAgents(query: QueryAgentDto): Promise<AgentEntity[]> {
    const qb = this.agentRepository
      .createQueryBuilder('agent')
      .leftJoinAndSelect('agent.user', 'user')
      .cache(true);
    if (query.status) {
      qb.andWhere('agent.status = :status', { status: query.status });
    }
    if (query.isOnline !== undefined) {
      qb.andWhere('agent.isOnline = :isOnline', { isOnline: query.isOnline });
    }
    if (query.vehicleType) {
      qb.andWhere('agent.vehicleType = :vehicleType', {
        vehicleType: query.vehicleType,
      });
    }
    if (query.isActive !== undefined) {
      qb.andWhere('agent.isActive = :isActive', { isActive: query.isActive });
    }

    return qb.getMany();
  }
  async findOne(id: string): Promise<AgentEntity> {
    const agent = await this.agentRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }
    return agent;
  }

  async update(id: string, dto: UpdateAgentDto): Promise<AgentEntity> {
    const agent = await this.findOne(id);
    Object.assign(agent, dto);
    return this.agentRepository.save(agent);
  }

  async findByUserId(userId: string): Promise<AgentEntity> {
    const agent = await this.agentRepository.findOne({
      where: { userId },
      relations: { user: true },
    });
    if (!agent) {
      throw new NotFoundException(`Agent profile not found for user ${userId}`);
    }
    return agent;
  }

  /** Real-time location update – called very frequently */
  async updateLocation(
    userId: string,
    dto: UpdateLocationDto,
  ): Promise<AgentEntity> {
    const agent = await this.agentRepository.findOneBy({ userId });
    if (!agent) {
      throw new NotFoundException(`Agent with user ID ${userId} not found`);
    }

    agent.location = {
      type: 'Point',
      coordinates: [dto.longitude, dto.latitude], // GeoJSON order: [lng, lat]
    };
    agent.locationUpdatedAt = new Date();

    if (dto.heading !== undefined) agent.heading = dto.heading;
    if (dto.speed !== undefined) agent.speed = dto.speed;

    // Auto-set online when location is received
    if (!agent.isOnline) {
      agent.isOnline = true;
      if (agent.status === 'offline') {
        agent.status = 'available';
      }
    }

    return this.agentRepository.save(agent);
  }

  async goOnline(userId: string): Promise<AgentEntity> {
    const agent = await this.findByUserId(userId);
    agent.isOnline = true;
    agent.status = 'available';
    return this.agentRepository.save(agent);
  }

  async goOffline(userId: string): Promise<AgentEntity> {
    const agent = await this.findByUserId(userId);
    agent.isOnline = false;
    agent.status = 'offline';
    agent.currentOrderId = null;
    return this.agentRepository.save(agent);
  }

  async setStatus(
    userId: string,
    status: AgentEntity['status'],
  ): Promise<AgentEntity> {
    const agent = await this.findByUserId(userId);
    agent.status = status;

    if (status === 'offline') {
      agent.isOnline = false;
      agent.currentOrderId = null;
    } else if (status === 'available' || status === 'busy') {
      agent.isOnline = true;
    }

    return this.agentRepository.save(agent);
  }

  async remove(id: string): Promise<void> {
    const agent = await this.findOne(id);
    await this.agentRepository.remove(agent);
  }

  async findNearestAvailable(
      latitude: number,
      longitude: number,
      limit = 10,
    ): Promise<AgentEntity[]> {
      // Requires PostGIS
      return this.agentRepository
        .createQueryBuilder('agent')
        .where('agent.isOnline = true')
        .andWhere('agent.status = :status', { status: 'available' })
        .andWhere('agent.isActive = true')
        .orderBy(
          `ST_Distance(
            agent.location,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
          )`,
        )
        .setParameters({ lat: latitude, lng: longitude })
        .limit(limit)
        .getMany();
    }
  }
