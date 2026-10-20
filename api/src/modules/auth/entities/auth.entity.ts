import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Column, Entity, Index } from 'typeorm';

/** Roles available to authenticated users. */
export type UserRole = 'agent' | 'admin';

/** Database entity representing an application user. */
@Entity('users')
@Index('UQ_users_email', ['email'], { unique: true })
export class AuthEntity extends BaseEntity {
  /** User's display name. */
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  /** User's unique email address. */
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  /** Hashed user password, excluded from default queries. */
  @Column({ type: 'varchar', select: false })
  password: string;

  /** Optional URL or path to the user's avatar. */
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  avatar!: string | null;

  /** Access role assigned to the user. */
  @Column({
    type: 'enum',
    enum: ['agent', 'admin'],
    default: 'agent',
  })
  role!: UserRole;

  /** Whether the user account is active. */
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
