import { User } from './User';
import { Order } from './Order';
import { Position } from './Position';
import { LedgerEntry } from './LedgerEntry';
import { Fee } from './Fee';
import { Transfer } from './Transfer';
import Decimal from 'decimal.js';
export declare class Account {
    id: string;
    userId: string;
    user: User;
    accountType: 'TRADING' | 'DEMO';
    accountStatus: 'ACTIVE' | 'CLOSED' | 'RESTRICTED' | 'SUSPENDED';
    currency: 'USD';
    suspensionReason: string | null;
    cashBalance: Decimal;
    reservedBalance: Decimal;
    marginAvailable: Decimal;
    brokerAccountId: string | null;
    evolveAccountId: string | null;
    createdAt: Date;
    updatedAt: Date;
    closedAt: Date | null;
    totalPositionsValue: Decimal;
    totalPl: Decimal;
    equity: Decimal;
    orders: Order[];
    positions: Position[];
    ledgerEntries: LedgerEntry[];
    fees: Fee[];
    transfers: Transfer[];
    getAvailableBalance(): Decimal;
    getBuyingPower(): Decimal;
}
//# sourceMappingURL=Account.d.ts.map