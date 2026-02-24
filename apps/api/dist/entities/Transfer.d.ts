import { Account } from './Account';
export declare class Transfer {
    id: string;
    accountId: string;
    account: Account;
    transferType: 'ACH_IN' | 'ACH_OUT' | 'WIRE_IN' | 'WIRE_OUT';
    amount: number;
    currency: 'USD';
    status: 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    evolveTransferId: string | null;
    evolveStatus: string | null;
    routingNumber: string | null;
    accountNumber: string | null;
    accountHolderName: string | null;
    createdAt: Date;
    processingStartedAt: Date | null;
    completedAt: Date | null;
    estimatedSettlementDate: Date | null;
    isReturn: boolean;
    returnReason: string | null;
    idempotencyKey: string | null;
    notes: string | null;
}
//# sourceMappingURL=Transfer.d.ts.map