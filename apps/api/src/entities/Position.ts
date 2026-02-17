import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Account } from './Account';
import Decimal from 'decimal.js';

@Entity('positions')
@Index(['accountId'])
@Index(['symbol'])
@Index(['openedAt'])
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  accountId: string;

  @ManyToOne(() => Account, account => account.positions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({ type: 'varchar', length: 20 })
  symbol: string;

  @Column({ type: 'varchar', length: 20 })
  assetType: 'OPTION' | 'FUTURE';

  @Column({ type: 'jsonb', nullable: true })
  optionDetails: any | null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  quantity: Decimal;

  @Column({ type: 'varchar', length: 10 })
  side: 'LONG' | 'SHORT';

  @Column({ type: 'numeric', precision: 12, scale: 4 })
  averageOpenPrice: Decimal;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  totalOpenCost: Decimal;

  @Column({ type: 'numeric', precision: 12, scale: 4, nullable: true })
  currentPrice: Decimal | null;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  currentValue: Decimal | null;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  unrealizedPl: Decimal | null;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  unrealizedPlPct: Decimal | null;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  realizedPl: Decimal;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  closedQuantity: Decimal;

  @CreateDateColumn({ type: 'timestamp' })
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  currentPriceUpdatedAt: Date | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
