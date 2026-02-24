import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { DecimalTransformer } from '../utils/decimalTransformer';

const TS = process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp';
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

  @Column({ type: 'simple-json', nullable: true })
  optionDetails: any | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: DecimalTransformer })
  quantity: Decimal;

  @Column({ type: 'varchar', length: 10 })
  side: 'LONG' | 'SHORT';

  @Column({ type: 'numeric', precision: 12, scale: 4, transformer: DecimalTransformer })
  averageOpenPrice: Decimal;

  @Column({ type: 'numeric', precision: 15, scale: 2, transformer: DecimalTransformer })
  totalOpenCost: Decimal;

  @Column({ type: 'numeric', precision: 12, scale: 4, nullable: true, transformer: DecimalTransformer })
  currentPrice: Decimal | null;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true, transformer: DecimalTransformer })
  currentValue: Decimal | null;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true, transformer: DecimalTransformer })
  unrealizedPl: Decimal | null;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true, transformer: DecimalTransformer })
  unrealizedPlPct: Decimal | null;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0, transformer: DecimalTransformer })
  realizedPl: Decimal;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0, transformer: DecimalTransformer })
  closedQuantity: Decimal;

  @CreateDateColumn({ type: TS })
  openedAt: Date;

  @Column({ type: TS, nullable: true })
  closedAt: Date | null;

  @Column({ type: TS, nullable: true })
  currentPriceUpdatedAt: Date | null;

  @UpdateDateColumn({ type: TS })
  updatedAt: Date;
}
