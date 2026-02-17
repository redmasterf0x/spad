import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
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
  accountStatus: 'ACTIVE' | 'CLOSED' | 'RESTRICTED';

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: 'USD';

  // Balances (stored as DECIMAL for precision)
  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  cashBalance: Decimal;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  reservedBalance: Decimal;

  // Margin (always 0 in MVP)
  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  marginAvailable: Decimal;

  // Reconciliation IDs
  @Column({ type: 'varchar', nullable: true })
  brokerAccountId: string | null;

  @Column({ type: 'varchar', nullable: true })
  evolveAccountId: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null;

  // Computed fields
  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  totalPositionsValue: Decimal;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  totalPl: Decimal;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
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
  getAvailableBalance(): Decimal {
    return this.cashBalance.minus(this.reservedBalance);
  }

  getBuyingPower(): Decimal {
    // No margin in MVP, buying power = available cash
    return this.getAvailableBalance();
  }
}
