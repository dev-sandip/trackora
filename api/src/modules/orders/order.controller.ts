import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { QueryOrderDto } from './dto/query-order.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { OrdersService } from './order.service.js';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('admin', 'agent') // or allow customers too
  @ApiOperation({ summary: 'Create a new order' })
  create(@Body() dto: CreateOrderDto, @Request() req: any) {
    return this.ordersService.create(dto, req.user?.id);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List orders with filters' })
  findAll(@Query() query: QueryOrderDto) {
    return this.ordersService.findAll(query);
  }

  @Get('my')
  @Roles('agent')
  @ApiOperation({ summary: 'Get orders assigned to me (agent)' })
  findMyOrders(@Request() req: any) {
    // You can enhance this later
    return this.ordersService.findAll({ agentId: req.user.agentId });
  }

  @Get(':id')
  @Roles('admin', 'agent')
  @ApiOperation({ summary: 'Get order details' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('admin', 'agent')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Post(':id/assign-nearest')
  @Roles('admin')
  @ApiOperation({ summary: 'Auto-assign nearest available agent' })
  assignNearest(@Param('id') id: string) {
    return this.ordersService.assignNearestAgent(id);
  }
}
