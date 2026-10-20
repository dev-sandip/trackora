import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Column, Entity, Index } from 'typeorm';

export type UserRole = 'agent' | 'admin';

@Entity('users')
@Index('UQ_users_email', ['email'], { unique: true })
export class AuthEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', select: false })
  password!: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  avatar!: string | null;

  @Column({
    type: 'enum',
    enum: ['agent', 'admin'],
    default: 'agent',
  })
  role!: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
