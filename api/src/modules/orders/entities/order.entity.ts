import { Entity, Index, ManyToOne, JoinColumn, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { AuthEntity } from '../../auth/entities/auth.entity.js';
import { AgentEntity } from '../../agents/entities/agent.entity.js';

export type OrderStatus =
  | 'pending' // just created
  | 'confirmed' // restaurant/accepted
  | 'preparing'
  | 'ready_for_pickup'
  | 'assigned' // agent assigned
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled'
  | 'failed';

@Entity('orders')
@Index('IDX_orders_status', ['status'])
@Index('IDX_orders_customer', ['customerId'])
@Index('IDX_orders_agent', ['agentId'])
export class OrderEntity extends BaseEntity {
  @ManyToOne(() => AuthEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer!: AuthEntity | null;
  @Column({ type: 'uuid', nullable: true })
  customerId!: string | null;
  @ManyToOne(() => AgentEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'agent_id' })
  agent!: AgentEntity | null;

  @Column({ type: 'uuid', nullable: true })
  agentId!: string | null;

  @Column({
    type: 'enum',
    enum: [
      'pending',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'assigned',
      'picked_up',
      'on_the_way',
      'delivered',
      'cancelled',
      'failed',
    ],
    default: 'pending',
  })
  status!: OrderStatus;
  @Column({ type: 'varchar', length: 500 })
  pickupAddress!: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  pickupLocation!: { type: 'Point'; coordinates: [number, number] } | null;

  @Column({ type: 'varchar', length: 500 })
  deliveryAddress!: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  deliveryLocation!: { type: 'Point'; coordinates: [number, number] } | null;

  @Column({ type: 'varchar', length: 50, unique: true })
  orderNumber!: string; // e.g. ORD-20261023-0001

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount!: number;

  @Column({ type: 'varchar', length: 3, default: 'NPR' })
  currency!: string;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  assignedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  pickedUpAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  customerName!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  customerPhone!: string | null;
}
