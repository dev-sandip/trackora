// src/orders/orders.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderStatus } from './entities/order.entity.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { QueryOrderDto } from './dto/query-order.dto.js';
import { AgentService } from '../agents/agent.service.js';
import { OrdersGateway } from './order.gateway.js';


@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    private readonly agentService: AgentService,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  private generateOrderNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${date}-${random}`;
  }

  async create(dto: CreateOrderDto, customerId?: string): Promise<OrderEntity> {
    const order = this.orderRepo.create({
      ...dto,
      customerId: customerId || dto.customerId || null,
      orderNumber: this.generateOrderNumber(),
      totalAmount: Number(dto.subtotal) + Number(dto.deliveryFee),
      pickupLocation:
        dto.pickupLat && dto.pickupLng
          ? { type: 'Point', coordinates: [dto.pickupLng, dto.pickupLat] }
          : null,
      deliveryLocation:
        dto.deliveryLat && dto.deliveryLng
          ? { type: 'Point', coordinates: [dto.deliveryLng, dto.deliveryLat] }
          : null,
    });

    const saved = await this.orderRepo.save(order);

    // Notify admins / ops room
    this.ordersGateway.emitOrderCreated(saved);

    return saved;
  }

  async findAll(query: QueryOrderDto): Promise<OrderEntity[]> {
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.agent', 'agent')
      .leftJoinAndSelect('agent.user', 'agentUser')
      .orderBy('order.createdAt', 'DESC');

    if (query.status) qb.andWhere('order.status = :status', { status: query.status });
    if (query.customerId) qb.andWhere('order.customerId = :customerId', { customerId: query.customerId });
    if (query.agentId) qb.andWhere('order.agentId = :agentId', { agentId: query.agentId });

    return qb.getMany();
  }

  async findOne(id: string): Promise<OrderEntity> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: {
        'customer': true, 'agent': true}
      // relations: ['customer', 'agent', 'agent.user'],
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderEntity> {
    const order = await this.findOne(id);
    const previousStatus = order.status;

    // Business rules
    if (dto.status === 'assigned') {
      if (!dto.agentId) {
        throw new BadRequestException('agentId is required when assigning');
      }
      const agent = await this.agentService.findOne(dto.agentId);
      order.agentId = agent.id;
      order.assignedAt = new Date();

      // Update agent status
      await this.agentService.setStatus(agent.userId, 'busy');
      await this.agentService.update(agent.id, { currentOrderId: order.id });
    }

    order.status = dto.status;

    // Set timestamps
    const now = new Date();
    switch (dto.status) {
      case 'confirmed':
        order.confirmedAt = now;
        break;
      case 'picked_up':
        order.pickedUpAt = now;
        break;
      case 'delivered':
        order.deliveredAt = now;
        // Free the agent
        if (order.agentId) {
          const agent = await this.agentService.findOne(order.agentId);
          await this.agentService.setStatus(agent.userId, 'available');
          await this.agentService.update(agent.id, { currentOrderId: null });
        }
        break;
      case 'cancelled':
      case 'failed':
        order.cancelledAt = now;
        if (order.agentId) {
          const agent = await this.agentService.findOne(order.agentId);
          await this.agentService.setStatus(agent.userId, 'available');
          await this.agentService.update(agent.id, { currentOrderId: null });
        }
        break;
    }

    const updated = await this.orderRepo.save(order);

    // ─── Real-time broadcast ───────────────────────────────────────
    this.ordersGateway.emitOrderStatusUpdated(updated, previousStatus);

    return updated;
  }

  async assignNearestAgent(orderId: string): Promise<OrderEntity> {
    const order = await this.findOne(orderId);

    if (!order.pickupLocation) {
      throw new BadRequestException('Order has no pickup location');
    }

    const [lng, lat] = order.pickupLocation.coordinates;
    const nearest = await this.agentService.findNearestAvailable(lat, lng, 1);

    if (!nearest.length) {
      throw new BadRequestException('No available agents nearby');
    }

    return this.updateStatus(orderId, {
      status: 'assigned',
      agentId: nearest[0].id,
    });
  }
}
