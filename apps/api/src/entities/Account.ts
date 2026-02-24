import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { DecimalTransformer } from '../utils/decimalTransformer';

// timestamp type helper for sqlite tests
const TS = process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp';
import { User } from './User';
import { Order } from './Order';
import { Position } from './Position';
import { LedgerEntry } from './LedgerEntry';
import { Fee } from './Fee';
import { Transfer } from './Transfer';
import Decimal from 'decimal.js';

@Entity('accounts')
@Index(['userId'])
@Index(['accountStatus'])
@Index(['brokerAccountId'])
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, user => user.accounts, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 50, default: 'TRADING' })
  accountType: 'TRADING' | 'DEMO';

  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  // NOTE: 'SUSPENDED' added for compliance/account holds
  accountStatus: 'ACTIVE' | 'CLOSED' | 'RESTRICTED' | 'SUSPENDED';

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: 'USD';

  @Column({ type: 'varchar', nullable: true })
  suspensionReason: string | null;

  // Balances (stored as DECIMAL for precision)
  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0, transformer: DecimalTransformer })
  cashBalance: Decimal;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0, transformer: DecimalTransformer })
  reservedBalance: Decimal;

  // Margin (always 0 in MVP)
  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0, transformer: DecimalTransformer })
  marginAvailable: Decimal;

  // Reconciliation IDs
  @Column({ type: 'varchar', nullable: true })
  brokerAccountId: string | null;

  @Column({ type: 'varchar', nullable: true })
  evolveAccountId: string | null;

  @CreateDateColumn({ type: TS })
  createdAt: Date;

  @UpdateDateColumn({ type: TS })
  updatedAt: Date;

  @Column({ type: TS, nullable: true })
  closedAt: Date | null;

  // Computed fields
  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0, transformer: DecimalTransformer })
  totalPositionsValue: Decimal;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0, transformer: DecimalTransformer })
  totalPl: Decimal;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0, transformer: DecimalTransformer })
  equity: Decimal;

  // Relationships
  @OneToMany(() => Order, order => order.account)
  orders: Order[];

  @OneToMany(() => Position, position => position.account)
  positions: Position[];

  @OneToMany(() => LedgerEntry, entry => entry.account)
  ledgerEntries: LedgerEntry[];

  @OneToMany(() => Fee, fee => fee.account)
  fees: Fee[];

  @OneToMany(() => Transfer, transfer => transfer.account)
  transfers: Transfer[];

  // Helper methods
  // Convert values to Decimal in case the ORM returned plain numbers (e.g.
  // when running against SQLite in tests).
  getAvailableBalance(): Decimal {
    const cash = new Decimal(this.cashBalance as any);
    const reserved = new Decimal(this.reservedBalance as any);
    return cash.minus(reserved);
  }

  getBuyingPower(): Decimal {
    // No margin in MVP, buying power = available cash
    return this.getAvailableBalance();
  }
}
