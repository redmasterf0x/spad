"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
exports.initializeDatabase = initializeDatabase;
exports.closeDatabase = closeDatabase;
const typeorm_1 = require("typeorm");
const User_1 = require("../entities/User");
const Account_1 = require("../entities/Account");
const Order_1 = require("../entities/Order");
const Position_1 = require("../entities/Position");
const LedgerEntry_1 = require("../entities/LedgerEntry");
const Fee_1 = require("../entities/Fee");
const Transfer_1 = require("../entities/Transfer");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const isTesting = process.env.NODE_ENV === 'test';
// Default to PostgreSQL for normal runs. For tests, allow override via
// DATABASE_URL_TEST; if that variable is unset we switch to an in-memory SQLite
// database so CI/workspaces can run without a Postgres server.
const databaseUrl = isTesting
    ? process.env.DATABASE_URL_TEST || 'sqlite::memory:'
    : process.env.DATABASE_URL || 'postgresql://spad_user:spad_pass@localhost:5432/spad_dev';
const shouldLog = () => {
    // allow explicit suppression during tests when verbose query output otherwise
    // clutters the terminal. Set SUPPRESS_QUERY_LOGS=true in the environment to
    // keep the database quiet. Otherwise fall back to existing LOG_LEVEL logic.
    if (process.env.SUPPRESS_QUERY_LOGS === 'true') {
        return false;
    }
    return process.env.LOG_LEVEL === 'debug';
};
exports.AppDataSource = isTesting && !process.env.DATABASE_URL_TEST
    ? new typeorm_1.DataSource({
        type: 'sqlite',
        database: ':memory:',
        synchronize: true,
        logging: shouldLog(),
        entities: [User_1.User, Account_1.Account, Order_1.Order, Position_1.Position, LedgerEntry_1.LedgerEntry, Fee_1.Fee, Transfer_1.Transfer],
        subscribers: [],
        migrations: [],
    })
    : new typeorm_1.DataSource({
        type: 'postgres',
        url: databaseUrl,
        synchronize: true, // Sync schema on startup (development only)
        logging: shouldLog(),
        entities: [User_1.User, Account_1.Account, Order_1.Order, Position_1.Position, LedgerEntry_1.LedgerEntry, Fee_1.Fee, Transfer_1.Transfer],
        subscribers: [],
        migrations: [],
        extra: {
            max: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
            idleTimeoutMillis: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT || '30000', 10),
        },
    });
// Initialize database connection
async function initializeDatabase() {
    try {
        if (!exports.AppDataSource.isInitialized) {
            await exports.AppDataSource.initialize();
            console.log('✓ Database connection initialized');
        }
    }
    catch (error) {
        console.error('✗ Failed to initialize database:', error);
        throw error;
    }
}
async function closeDatabase() {
    if (exports.AppDataSource.isInitialized) {
        await exports.AppDataSource.destroy();
        console.log('✓ Database connection closed');
    }
}
//# sourceMappingURL=database.js.map