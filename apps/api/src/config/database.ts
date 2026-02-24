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
const isProduction = process.env.NODE_ENV === 'production';

// Default to PostgreSQL for normal runs. For tests, allow override via
// DATABASE_URL_TEST; if that variable is unset we switch to an in-memory SQLite
// database so CI/workspaces can run without a Postgres server.
// On production without DATABASE_URL, use file-based SQLite as fallback.
const databaseUrl = isTesting
  ? process.env.DATABASE_URL_TEST || 'sqlite::memory:'
  : process.env.DATABASE_URL || (isProduction ? 'sqlite:./data/spad.db' : 'postgresql://spad_user:spad_pass@localhost:5432/spad_dev');

const shouldLog = () => {
  // allow explicit suppression during tests when verbose query output otherwise
  // clutters the terminal. Set SUPPRESS_QUERY_LOGS=true in the environment to
  // keep the database quiet. Otherwise fall back to existing LOG_LEVEL logic.
  if (process.env.SUPPRESS_QUERY_LOGS === 'true') {
    return false;
  }
  return process.env.LOG_LEVEL === 'debug';
};

export const AppDataSource = (isTesting && !process.env.DATABASE_URL_TEST) || (isProduction && !process.env.DATABASE_URL)
  ? new DataSource({
      type: 'sqlite',
      database: isTesting ? ':memory:' : './data/spad.db',
      synchronize: true,
      logging: shouldLog(),
      entities: [User, Account, Order, Position, LedgerEntry, Fee, Transfer],
      subscribers: [],
      migrations: [],
    })
  : new DataSource({
      type: 'postgres',
      url: databaseUrl,
      synchronize: true, // Sync schema on startup (development only)
      logging: shouldLog(),
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
