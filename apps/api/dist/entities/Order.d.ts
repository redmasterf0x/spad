import { Account } from './Account';
import { LedgerEntry } from './LedgerEntry';
import { Fee } from './Fee';
export declare class Order {
    id: string;
    accountId: string;
    account: Account;
    symbol: string;
    assetType: 'OPTION' | 'FUTURE';
    optionDetails: {
        expiryDate: string;
        strikePrice: number;
        contractType: 'CALL' | 'PUT';
        multiplier: number;
    } | null;
    futureDetails: {
        expiryDate: string;
        contractCode: string;
    } | null;
    side: 'BUY' | 'SELL';
    quantity: number;
    orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
    price: number | null;
    stopPrice: number | null;
    timeInForce: 'DAY' | 'GTC' | 'IOC' | 'FOK';
    status: 'PENDING' | 'ACCEPTED' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED';
    filledQuantity: number;
    filledPrice: number | null;
    partnerOrderId: string | null;
    partnerStatus: string | null;
    partnerRejectionReason: string | null;
    feeRate: number;
    feeAmount: number;
    feeType: 'COMMISSION' | 'SPREAD' | 'OTHER';
    idempotencyKey: string | null;
    createdAt: Date;
    submittedToBrokerAt: Date | null;
    filledAt: Date | null;
    cancelledAt: Date | null;
    updatedAt: Date;
    rejectionReason: string | null;
    notes: string | null;
    fees: Fee[];
    ledgerEntries: LedgerEntry[];
}
//# sourceMappingURL=Order.d.ts.map