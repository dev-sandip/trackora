import { AuthEntity } from '../../auth/entities/auth.entity.js';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  Point,
} from 'typeorm';

export type AgentStatus =
  'offline' | 'available' | 'busy' | 'break' | 'suspended';

@Entity('agents')
@Index('IDX_agents_status', ['status'])
@Index('IDX_agents_location', ['location'], { spatial: true })
@Check('"maxConcurrentOrders" >= 1')
@Check('"heading" IS NULL OR ("heading" >= 0 AND "heading" < 360)')
@Check('"speed" IS NULL OR "speed" >= 0')
export class AgentEntity extends BaseEntity {
  /**
   * Authentication account associated with this agent.
   * Deleting the account also deletes the agent record.
   */
  @OneToOne(() => AuthEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: AuthEntity;

  /**
   * UUID of the associated authentication account.
   * Shares the user_id column with the user relation.
   */
  @Column({
    name: 'user_id',
    type: 'uuid',
    unique: true,
  })
  userId!: string;

  /**
   * Latest geographic position of the agent.
   * Coordinates use WGS 84 (SRID 4326).
   * PostGIS Point coordinates use [longitude, latitude].
   */
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location!: Point | null;

  /** Timestamp when the location was last updated. */
  @Column({ type: 'timestamptz', nullable: true })
  locationUpdatedAt!: Date | null;

  /** Current operational status of the agent. */
  @Column({
    type: 'enum',
    enum: ['offline', 'available', 'busy', 'break', 'suspended'],
    default: 'offline',
  })
  status!: AgentStatus;

  /**
   * Whether the agent is online and connected to the service.
   * Operational eligibility is determined separately by status.
   */
  @Column({ type: 'boolean', default: false })
  isOnline!: boolean;

  /** Vehicle type, such as bike, scooter, car, or van. */
  @Column({ type: 'varchar', length: 50, nullable: true })
  vehicleType!: string | null;

  /** License plate of the assigned vehicle. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  vehiclePlate!: string | null;

  /** Maximum number of concurrent delivery assignments. */
  @Column({ type: 'smallint', default: 1 })
  maxConcurrentOrders!: number;

  /**
   * ID of the currently tracked order, if applicable.
   * This is not a foreign-key relationship by itself.
   */
  @Column({ type: 'uuid', nullable: true })
  currentOrderId!: string | null;

  /** Direction of travel in degrees: 0 inclusive, 360 exclusive. */
  @Column({ type: 'real', nullable: true })
  heading!: number | null;

  /** Travel speed in meters per second. */
  @Column({ type: 'real', nullable: true })
  speed!: number | null;

  /** Device or push-notification token. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceToken!: string | null;

  /** Whether this agent account is administratively active. */
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
