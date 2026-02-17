import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Account } from './Account';
import { LedgerEntry } from './LedgerEntry';
import { Fee } from './Fee';

@Entity('orders')
@Index(['accountId'])
@Index(['symbol'])
@Index(['status'])
@Index(['partnerOrderId'])
@Index(['createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  accountId: string;

  @ManyToOne(() => Account, account => account.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  // Order Details
  @Column({ type: 'varchar', length: 20 })
  symbol: string;

  @Column({ type: 'varchar', length: 20 })
  assetType: 'OPTION' | 'FUTURE';

  // For options: expiry_date, strike_price, contract_type
  @Column({ type: 'jsonb', nullable: true })
  optionDetails: {
    expiryDate: string;
    strikePrice: number;
    contractType: 'CALL' | 'PUT';
    multiplier: number;
  } | null;

  // Order Params
  @Column({ type: 'varchar', length: 10 })
  side: 'BUY' | 'SELL';

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'varchar', length: 20 })
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';

  @Column({ type: 'numeric', precision: 12, scale: 4, nullable: true })
  price: number | null;

  @Column({ type: 'numeric', precision: 12, scale: 4, nullable: true })
  stopPrice: number | null;

  @Column({ type: 'varchar', length: 10, default: 'DAY' })
  timeInForce: 'DAY' | 'GTC' | 'IOC' | 'FOK';

  // Execution Status
  @Column({ type: 'varchar', length: 50, default: 'PENDING' })
  status:
    | 'PENDING'
    | 'ACCEPTED'
    | 'FILLED'
    | 'PARTIALLY_FILLED'
    | 'CANCELLED'
    | 'REJECTED'
    | 'EXPIRED';

  // Fills
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  filledQuantity: number;

  @Column({ type: 'numeric', precision: 12, scale: 4, nullable: true })
  filledPrice: number | null;

  // Partner Broker Integration
  @Column({ type: 'varchar', nullable: true })
  partnerOrderId: string | null;

  @Column({ type: 'varchar', nullable: true })
  partnerStatus: string | null;

  @Column({ type: 'varchar', nullable: true })
  partnerRejectionReason: string | null;

  // Fees
  @Column({ type: 'numeric', precision: 5, scale: 4, default: 0.005 })
  feeRate: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  feeAmount: number;

  @Column({ type: 'varchar', length: 50, default: 'COMMISSION' })
  feeType: 'COMMISSION' | 'SPREAD' | 'OTHER';

  // Idempotency
  @Column({ type: 'varchar', unique: true, nullable: true })
  idempotencyKey: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  submittedToBrokerAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  filledAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Relationships
  @OneToMany(() => Fee, fee => fee.order)
  fees: Fee[];

  @OneToMany(() => LedgerEntry, entry => entry.order)
  ledgerEntries: LedgerEntry[];
}
