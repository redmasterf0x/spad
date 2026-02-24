import { LedgerEntry, EntryType } from '../entities/LedgerEntry';
import Decimal from 'decimal.js';
export interface LedgerPostRequest {
    accountId: string;
    entryType: EntryType;
    amount: Decimal;
    currency: 'USD';
    description: string;
    orderId?: string;
    transferId?: string;
    metadata?: Record<string, any>;
}
export interface LedgerBalance {
    accountId: string;
    totalDebits: Decimal;
    totalCredits: Decimal;
    netBalance: Decimal;
    asOfDate: Date;
}
/**
 * LedgerService: Manages double-entry accounting
 *
 * In traditional double-entry bookkeeping:
 * - Debits: Increases to assets/expenses, decreases to liabilities/equity
 * - Credits: Increases to liabilities/equity, decreases to assets
 *
 * For a trading account:
 * - DEPOSIT: Asset account +
 * - WITHDRAWAL: Asset account -
 * - ORDER_EXECUTION: Asset account - (for BUY), + (for SELL after fees)
 * - FEE: Expense account
 * - DIVIDEND: Income account
 *
 * Implementation: Single-sided ledger (simplified from traditional double-entry)
 * - All entries are from perspective of customer account
 * - Amount is positive for credits (inflows), negative for debits (outflows)
 */
export declare class LedgerService {
    private ledgerRepository;
    private accountRepository;
    /**
     * Post a ledger entry
     * For MVPs, we keep it simple: single-sided ledger from account perspective
     */
    postEntry(req: LedgerPostRequest): Promise<LedgerEntry>;
    /**
     * Get ledger entries for account (paginated)
     */
    getEntries(accountId: string, limit?: number, offset?: number, entryType?: EntryType): Promise<{
        entries: LedgerEntry[];
        total: number;
    }>;
    /**
     * Calculate account balance at a specific date
     */
    getBalanceAtDate(accountId: string, asOfDate: Date): Promise<LedgerBalance>;
    /**
     * Reconcile ledger entries
     * Mark entries as reconciled with external broker/bank records
     */
    reconcileEntries(entryIds: string[], reconciliationId: string): Promise<void>;
    /**
     * Get unreconciled entries for account
     */
    getUnreconciledEntries(accountId: string): Promise<LedgerEntry[]>;
    /**
     * Generate trial balance (sum of all debits should equal sum of all credits)
     * Used for auditing
     */
    getTrialBalance(accountId: string): Promise<{
        totalDebits: Decimal;
        totalCredits: Decimal;
        isBalanced: boolean;
    }>;
    /**
     * Audit trail: Get all entries for an order
     */
    getOrderEntries(orderId: string): Promise<LedgerEntry[]>;
    /**
     * Generate account statement for a date range
     */
    getStatement(accountId: string, startDate: Date, endDate: Date): Promise<{
        entries: LedgerEntry[];
        openingBalance: Decimal;
        closingBalance: Decimal;
        totalInflows: Decimal;
        totalOutflows: Decimal;
    }>;
}
//# sourceMappingURL=LedgerService.d.ts.map