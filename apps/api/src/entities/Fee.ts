import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
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

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  grossFeeAmount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  netFeeAmount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  partnerCost: number;

  @Column({ type: 'numeric', precision: 5, scale: 4, nullable: true })
  customerRate: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 4, nullable: true })
  partnerRate: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 4, nullable: true })
  ourMargin: number | null;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  notionalValue: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;
}
