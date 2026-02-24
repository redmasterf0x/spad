import { Account } from './Account';
export declare class User {
    id: string;
    email: string;
    emailVerified: boolean;
    passwordHash: string;
    givenName: string;
    familyName: string;
    totpSecret: string | null;
    totpEnabled: boolean;
    backupCodes: string[] | null;
    kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
    personaInquiryId: string | null;
    private static readonly TS;
    kycVerifiedAt: Date | null;
    kycData: {
        givenName?: string;
        familyName?: string;
        dob?: string;
        addressStreet?: string;
        addressCity?: string;
        addressState?: string;
        addressZip?: string;
        ssnLast4?: string;
        phone?: string;
    } | null;
    pepCheckStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
    sanctionsCheckStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
    accountStatus: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
    suspensionReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    lastLoginAt: Date | null;
    accounts: Account[];
}
//# sourceMappingURL=User.d.ts.map