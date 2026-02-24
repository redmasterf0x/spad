import { Account } from './Account';
import Decimal from 'decimal.js';
export declare class Position {
    id: string;
    accountId: string;
    account: Account;
    symbol: string;
    assetType: 'OPTION' | 'FUTURE';
    optionDetails: any | null;
    quantity: Decimal;
    side: 'LONG' | 'SHORT';
    averageOpenPrice: Decimal;
    totalOpenCost: Decimal;
    currentPrice: Decimal | null;
    currentValue: Decimal | null;
    unrealizedPl: Decimal | null;
    unrealizedPlPct: Decimal | null;
    realizedPl: Decimal;
    closedQuantity: Decimal;
    openedAt: Date;
    closedAt: Date | null;
    currentPriceUpdatedAt: Date | null;
    updatedAt: Date;
}
//# sourceMappingURL=Position.d.ts.map