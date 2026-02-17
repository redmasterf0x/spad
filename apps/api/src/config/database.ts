import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Account } from '../entities/Account';
import { Order } from '../entities/Order';
import { Position } from '../entities/Position';
import { LedgerEntry } from '../entities/LedgerEntry';
import { Fee } from '../entities/Fee';
import { Transfer } from '../entities/Transfer';
import dotenv from 'dotenv';

dotenv.config();

const isTesting = process.env.NODE_ENV === 'test';
const databaseUrl = isTesting
  ? process.env.DATABASE_URL_TEST || 'postgresql://spad_user:spad_pass@localhost:5432/spad_test'
  : process.env.DATABASE_URL || 'postgresql://spad_user:spad_pass@localhost:5432/spad_dev';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  synchronize: true, // Sync schema on startup (development only)
  logging: process.env.LOG_LEVEL === 'debug',
  entities: [User, Account, Order, Position, LedgerEntry, Fee, Transfer],
  subscribers: [],
  migrations: [],
  extra: {
    max: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
    idleTimeoutMillis: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT || '30000', 10),
  },
});

// Initialize database connection
export async function initializeDatabase() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✓ Database connection initialized');
    }
  } catch (error) {
    console.error('✗ Failed to initialize database:', error);
    throw error;
  }
}

export async function closeDatabase() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('✓ Database connection closed');
  }
}
