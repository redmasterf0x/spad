import { Account } from './Account';
import { Order } from './Order';
export declare enum EntryType {
    DEPOSIT = "DEPOSIT",
    WITHDRAWAL = "WITHDRAWAL",
    ORDER_EXECUTION = "ORDER_EXECUTION",
    FEE = "FEE",
    DIVIDEND = "DIVIDEND",
    INTEREST = "INTEREST",
    ADJUSTMENT = "ADJUSTMENT",
    TRANSFER = "TRANSFER",
    CORRECTION = "CORRECTION"
}
export declare class LedgerEntry {
    id: string;
    accountId: string;
    account: Account;
    entryType: EntryType;
    orderId: string | null;
    order: Order | null;
    transferId: string | null;
    reconciliationId: string | null;
    debitAccountId: string | null;
    creditAccountId: string | null;
    amount: number;
    currency: 'USD';
    description: string;
    metadata: {
        orderSymbol?: string;
        brokerOrderId?: string;
        side?: string;
        quantity?: number;
        price?: number;
        [key: string]: any;
    } | null;
    createdAt: Date;
    isReconciled: boolean;
    reconciledAt: Date | null;
}
//# sourceMappingURL=LedgerEntry.d.ts.map