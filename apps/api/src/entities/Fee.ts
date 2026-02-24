import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { DecimalTransformer } from '../utils/decimalTransformer';

const TS = process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp';
import { Order } from './Order';
import { Account } from './Account';

@Entity('fees')
@Index(['accountId'])
@Index(['orderId'])
@Index(['createdAt'])
export class Fee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string;

  @ManyToOne(() => Order, order => order.fees, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column('uuid')
  accountId: string;

  @ManyToOne(() => Account, account => account.fees, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({ type: 'varchar', length: 50 })
  feeCategory:
    | 'TRADING_COMMISSION'
    | 'SPREAD'
    | 'SLIPPAGE'
    | 'ADMIN'
    | 'OTHER';

  @Column({ type: 'varchar', length: 50 })
  feeType: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: DecimalTransformer })
  grossFeeAmount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: DecimalTransformer })
  netFeeAmount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: DecimalTransformer })
  partnerCost: number;

  @Column({ type: 'numeric', precision: 5, scale: 4, nullable: true, transformer: DecimalTransformer })
  customerRate: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 4, nullable: true, transformer: DecimalTransformer })
  partnerRate: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 4, nullable: true, transformer: DecimalTransformer })
  ourMargin: number | null;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true, transformer: DecimalTransformer })
  notionalValue: number | null;

  @CreateDateColumn({ type: TS })
  createdAt: Date;

  @Column({ type: TS, nullable: true })
  paidAt: Date | null;
}
