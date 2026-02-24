// Set test environment variables before any imports so that the database
// module can configure itself correctly on load.
process.env.NODE_ENV = 'test';
if (!process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL_TEST = '';
}

import { AppDataSource } from '../src/config/database';
import { User } from '../src/entities/User';
import { Account } from '../src/entities/Account';
import { Order } from '../src/entities/Order';
import { Position } from '../src/entities/Position';
import { LedgerEntry } from '../src/entities/LedgerEntry';
import { Fee } from '../src/entities/Fee';
import { Transfer } from '../src/entities/Transfer';

// Global test setup
beforeAll(async () => {
  // NODE_ENV and DATABASE_URL_TEST are already set above

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✓ Test database initialized');
    }
  } catch (error) {
    console.error('✗ Failed to initialize test database:', error);
    throw error;
  }
});

// Clean up after tests
afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('✓ Test database connection closed');
  }
});

// Clear all tables between tests (optional, for isolation)
export async function clearDatabase() {
  const entities = [User, Account, Order, Position, LedgerEntry, Fee, Transfer];
  for (const entity of entities) {
    const repository = AppDataSource.getRepository(entity);
    await repository.clear();
  }
}

// Helper to truncate and reset sequences
export async function resetDatabase() {
  // For SQLite in-memory testing we can simply resynchronize the schema, which
  // drops and re-creates all tables. For Postgres we run our existing TRUNCATE
  // sequence.
  if (AppDataSource.options.type === 'sqlite') {
    await AppDataSource.synchronize(true);
    return;
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.query('TRUNCATE TABLE "fees" CASCADE');
    await queryRunner.query('TRUNCATE TABLE "ledger_entries" CASCADE');
    await queryRunner.query('TRUNCATE TABLE "transfers" CASCADE');
    await queryRunner.query('TRUNCATE TABLE "positions" CASCADE');
    await queryRunner.query('TRUNCATE TABLE "orders" CASCADE');
    await queryRunner.query('TRUNCATE TABLE "accounts" CASCADE');
    await queryRunner.query('TRUNCATE TABLE "users" CASCADE');
  } finally {
    await queryRunner.release();
  }
}
