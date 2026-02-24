import { Order } from './Order';
import { Account } from './Account';
export declare class Fee {
    id: string;
    orderId: string;
    order: Order;
    accountId: string;
    account: Account;
    feeCategory: 'TRADING_COMMISSION' | 'SPREAD' | 'SLIPPAGE' | 'ADMIN' | 'OTHER';
    feeType: string;
    grossFeeAmount: number;
    netFeeAmount: number;
    partnerCost: number;
    customerRate: number | null;
    partnerRate: number | null;
    ourMargin: number | null;
    notionalValue: number | null;
    createdAt: Date;
    paidAt: Date | null;
}
//# sourceMappingURL=Fee.d.ts.map