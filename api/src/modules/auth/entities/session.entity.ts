import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AuthEntity } from './auth.entity.js';

@Entity('sessions')
@Index('IDX_auth_sessions_user_id', ['userId'])
/** Stores an authenticated user session and its lifecycle state. */
export class AuthSessionEntity extends BaseEntity {
  /** Identifier of the user who owns the session. */
  @Column({ type: 'uuid' })
  userId!: string;

  /** User associated with this session. */
  @ManyToOne(() => AuthEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: AuthEntity;

  /** Hash of the session token used for authentication. */
  @Column({ type: 'varchar', length: 255, select: false })
  tokenHash!: string;

  /** Date and time when the session expires. */
  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  /** Date and time when the session was revoked, if applicable. */
  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;
}
