import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AuthEntity } from './auth.entity.js';

@Entity('sessions')
@Index('IDX_auth_sessions_user_id', ['userId'])
export class AuthSessionEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => AuthEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: AuthEntity;

  @Column({ type: 'varchar', length: 255, select: false })
  tokenHash!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;
}
