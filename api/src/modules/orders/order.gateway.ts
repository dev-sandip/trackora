import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OrderEntity } from './entities/order.entity.js';
import { AgentEntity } from '../agents/entities/agent.entity.js';
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/tracking',
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OrdersGateway.name);
  //represent connected clients
  private connectedClients = new Map<string, Socket>();
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('joinOrder')
  handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    client.join(`order:${data.orderId}`);
    this.logger.log(`Client ${client.id} joined order:${data.orderId}`);
    return { event: 'joined', orderId: data.orderId };
  }

  @SubscribeMessage('joinAgent')
  handleJoinAgent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { agentId: string },
  ) {
    client.join(`agent:${data.agentId}`);
    this.logger.log(`Client ${client.id} joined agent:${data.agentId}`);
    return { event: 'joined', agentId: data.agentId };
  }

  /** Ops dashboard joins global room */
  @SubscribeMessage('joinOps')
  handleJoinOps(@ConnectedSocket() client: Socket) {
    client.join('ops');
    this.logger.log(`Client ${client.id} joined ops room`);
    return { event: 'joined', room: 'ops' };
  }

  // ─── Emit helpers (called from services) ─────────────────────────

  /** New order created → notify ops */
  emitOrderCreated(order: OrderEntity) {
    this.server.to('ops').emit('orderCreated', {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      pickupAddress: order.pickupAddress,
      deliveryAddress: order.deliveryAddress,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
    });
  }

  /** Status changed → notify everyone watching this order + ops */
  emitOrderStatusUpdated(order: OrderEntity, previousStatus: string) {
    const payload = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      previousStatus,
      agentId: order.agentId,
      updatedAt: new Date(),
    };

    this.server.to(`order:${order.id}`).emit('orderStatusUpdated', payload);
    this.server.to('ops').emit('orderStatusUpdated', payload);

    // Also notify the assigned agent
    if (order.agentId) {
      this.server
        .to(`agent:${order.agentId}`)
        .emit('orderStatusUpdated', payload);
    }
  }

  /** Real-time agent location (called from DeliveryAgentService) */
  emitAgentLocation(agent: AgentEntity) {
    if (!agent.location) return;

    const payload = {
      agentId: agent.id,
      userId: agent.userId,
      latitude: agent.location.coordinates[1],
      longitude: agent.location.coordinates[0],
      heading: agent.heading,
      speed: agent.speed,
      status: agent.status,
      currentOrderId: agent.currentOrderId,
      updatedAt: agent.locationUpdatedAt,
    };

    // Send to ops
    this.server.to('ops').emit('agentLocation', payload);

    // Send to the specific order room if agent is on a delivery
    if (agent.currentOrderId) {
      this.server
        .to(`order:${agent.currentOrderId}`)
        .emit('agentLocation', payload);
    }
  }
}
