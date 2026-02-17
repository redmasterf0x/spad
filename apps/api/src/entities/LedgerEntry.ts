import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Account } from './Account';
import { Order } from './Order';

@Entity('ledger_entries')
@Index(['accountId'])
@Index(['orderId'])
@Index(['entryType'])
@Index(['createdAt'])
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  accountId: string;

  @ManyToOne(() => Account, account => account.ledgerEntries, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({
    type: 'varchar',
    length: 50,
  })
  entryType:
    | 'ORDER_EXECUTION'
    | 'FEE'
    | 'DEPOSIT'
    | 'WITHDRAWAL'
    | 'DIVIDEND'
    | 'INTEREST'
    | 'ADJUSTMENT'
    | 'TRANSFER';

  @Column('uuid', { nullable: true })
  orderId: string | null;

  @ManyToOne(() => Order, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order: Order | null;

  @Column('uuid', { nullable: true })
  transferId: string | null;

  // Double Entry Accounting
  @Column('uuid', { nullable: true })
  debitAccountId: string | null;

  @Column('uuid', { nullable: true })
  creditAccountId: string | null;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: 'USD';

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    orderSymbol?: string;
    brokerOrderId?: string;
    side?: string;
    quantity?: number;
    price?: number;
    [key: string]: any;
  } | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'boolean', default: false })
  isReconciled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  reconciledAt: Date | null;
}
