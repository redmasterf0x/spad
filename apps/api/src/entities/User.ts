import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Account } from './Account';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['kycStatus'])
@Index(['accountStatus'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100 })
  givenName: string;

  @Column({ type: 'varchar', length: 100 })
  familyName: string;

  // 2FA
  @Column({ type: 'varchar', nullable: true })
  totpSecret: string | null;

  @Column({ type: 'boolean', default: false })
  totpEnabled: boolean;

  @Column({ type: 'text', array: true, nullable: true })
  backupCodes: string[] | null;

  // KYC Status (Persona integration)
  @Column({ type: 'varchar', length: 50, default: 'PENDING' })
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

  @Column({ type: 'varchar', nullable: true })
  personaInquiryId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  kycVerifiedAt: Date | null;

  // KYC Data (encrypted in production)
  @Column({ type: 'jsonb', nullable: true })
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

  // Compliance
  @Column({ type: 'varchar', length: 50, default: 'PENDING' })
  pepCheckStatus: 'PENDING' | 'VERIFIED' | 'FAILED';

  @Column({ type: 'varchar', length: 50, default: 'PENDING' })
  sanctionsCheckStatus: 'PENDING' | 'VERIFIED' | 'FAILED';

  // Account Status
  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

  @Column({ type: 'varchar', nullable: true })
  suspensionReason: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  // Relationships
  @OneToMany(() => Account, account => account.user)
  accounts: Account[];
}
