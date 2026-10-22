import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AgentService } from './agent.service.js';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CreateAgentDto } from './dtos/create-agent.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { QueryAgentDto } from './dtos/query-agent.dto.js';
import { UpdateAgentDto } from './dtos/update-agent.dto.js';
import { UpdateLocationDto } from './dtos/update-location.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthEntity } from '../auth/entities/auth.entity.js';

@ApiTags('Agent')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT access token' })
@ApiForbiddenResponse({
  description: 'The authenticated user does not have the required role',
})
@Controller('agent')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create agent profile (Admin only)' })
  @ApiBody({ type: CreateAgentDto, description: 'Agent profile to create' })
  @ApiResponse({ status: 201, description: 'Agent created' })
  @ApiBadRequestResponse({ description: 'Invalid agent profile data' })
  create(@Body() dto: CreateAgentDto) {
    return this.agentService.create(dto);
  }
  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all registered agents (Admin only)' })
  @ApiQuery({ type: QueryAgentDto })
  @ApiResponse({ status: 200, description: 'List of agents' })
  @ApiBadRequestResponse({ description: 'Invalid agent query parameters' })
  list(@Query() query: QueryAgentDto) {
    return this.agentService.listAllRegisteredAgents(query);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get agent by ID (Admin only)' })
  @ApiParam({
    name: 'id',
    type: 'string',
    required: true,
    description: 'Agent ID',
  })
  @ApiResponse({ status: 200, description: 'Agent profile retrieved' })
  @ApiNotFoundResponse({ description: 'Agent not found' })
  findOne(@Param('id') id: string) {
    return this.agentService.findOne(id);
  }
  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update agent (Admin only)' })
  @ApiParam({
    name: 'id',
    type: 'string',
    required: true,
    description: 'Agent ID',
  })
  @ApiBody({
    type: UpdateAgentDto,
    description: 'Agent profile fields to update',
  })
  @ApiResponse({ status: 200, description: 'Agent updated' })
  @ApiBadRequestResponse({ description: 'Invalid agent update data' })
  @ApiNotFoundResponse({ description: 'Agent not found' })
  update(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.agentService.update(id, dto);
  }

  @Patch('me/location')
  @Roles('agent')
  @ApiOperation({
    summary: 'Update my real-time location (called frequently by mobile app)',
    description:
      'Updates the location of the authenticated agent. Requires the agent role.',
  })
  @ApiBody({ type: UpdateLocationDto, description: 'Current agent location' })
  @ApiResponse({ status: 200, description: 'Agent location updated' })
  @ApiBadRequestResponse({ description: 'Invalid location data' })
  @ApiNotFoundResponse({ description: 'Agent profile not found' })
  updateMyLocation(
    @CurrentUser() user: AuthEntity,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.agentService.updateLocation(user.id, dto);
  }

  @Get('me/profile')
  @Roles('agent')
  @ApiOperation({
    summary: 'Get my agent profile',
    description:
      'Returns the profile of the authenticated agent. Requires the agent role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authenticated agent profile retrieved',
  })
  @ApiNotFoundResponse({ description: 'Agent profile not found' })
  getMyProfile(@CurrentUser() user: AuthEntity) {
    return this.agentService.findByUserId(user.id);
  }

  @Post('me/online')
  @Roles('agent')
  @ApiOperation({
    summary: 'Go online / available',
    description:
      'Marks the authenticated agent as online and available. Requires the agent role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Agent is now online and available',
  })
  @ApiNotFoundResponse({ description: 'Agent profile not found' })
  goOnline(@CurrentUser() user: AuthEntity) {
    return this.agentService.goOnline(user.id);
  }

  @Post('me/offline')
  @Roles('agent')
  @ApiOperation({
    summary: 'Go offline',
    description:
      'Marks the authenticated agent as offline. Requires the agent role.',
  })
  @ApiResponse({ status: 201, description: 'Agent is now offline' })
  @ApiNotFoundResponse({ description: 'Agent profile not found' })
  goOffline(@CurrentUser() user: AuthEntity) {
    return this.agentService.goOffline(user.id);
  }
  @Patch('me/status')
  @Roles('agent')
  @ApiOperation({
    summary: 'Change my status (available / busy / break)',
    description:
      'Updates the status of the authenticated agent. Requires the agent role.',
  })
  @ApiBody({
    description: 'New agent availability status',
    required: true,
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['available', 'busy', 'break'],
          description: 'Agent availability status',
          example: 'available',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Agent status updated' })
  @ApiBadRequestResponse({ description: 'Invalid agent status' })
  @ApiNotFoundResponse({ description: 'Agent profile not found' })
  setMyStatus(
    @CurrentUser() user: AuthEntity,
    @Body('status') status: 'available' | 'busy' | 'break',
  ) {
    return this.agentService.setStatus(user.id, status);
  }
}
