import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

const TS = process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp';
import { Account } from './Account';

@Entity('transfers')
@Index(['accountId'])
@Index(['status'])
@Index(['evolveTransferId'])
@Index(['createdAt'])
export class Transfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  accountId: string;

  @ManyToOne(() => Account, account => account.transfers, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({ type: 'varchar', length: 20 })
  transferType: 'ACH_IN' | 'ACH_OUT' | 'WIRE_IN' | 'WIRE_OUT';

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: 'USD';

  @Column({ type: 'varchar', length: 50, default: 'REQUESTED' })
  status:
    | 'REQUESTED'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED';

  @Column({ type: 'varchar', nullable: true })
  evolveTransferId: string | null;

  @Column({ type: 'varchar', nullable: true })
  evolveStatus: string | null;

  // Bank Details (encrypted in production)
  @Column({ type: 'varchar', nullable: true })
  routingNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  accountNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  accountHolderName: string | null;

  @CreateDateColumn({ type: TS })
  createdAt: Date;

  @Column({ type: TS, nullable: true })
  processingStartedAt: Date | null;

  @Column({ type: TS, nullable: true })
  completedAt: Date | null;

  @Column({ type: 'date', nullable: true })
  estimatedSettlementDate: Date | null;

  @Column({ type: 'boolean', default: false })
  isReturn: boolean;

  @Column({ type: 'varchar', nullable: true })
  returnReason: string | null;

  @Column({ type: 'varchar', unique: true, nullable: true })
  idempotencyKey: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
