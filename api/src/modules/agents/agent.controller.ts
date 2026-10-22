import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AgentService } from './agent.service.js';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CreateAgentDto } from './dtos/create-agent.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Agent')
@Controller('agent')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create agent profile (Admin only)' })
  @ApiResponse({ status: 201, description: 'Agent created' })
  create(@Body() dto: CreateAgentDto) {
    return this.agentService.create(dto);
  }
}
