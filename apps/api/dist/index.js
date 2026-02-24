"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./config/database");
const AuthController_1 = __importDefault(require("./controllers/AuthController"));
const app = (0, express_1.default)();
/**
 * Middleware
 */
app.use((0, cors_1.default)());
app.use(express_1.default.json());
/**
 * Serve static files from web app
 */
const webBuildPath = path_1.default.join(__dirname, '../../web/dist');
app.use(express_1.default.static(webBuildPath));
/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    if (err.message.includes('Insufficient')) {
        return res.status(400).json({ error: err.message });
    }
    if (err.message.includes('not found')) {
        return res.status(404).json({ error: err.message });
    }
    if (err.message.includes('already')) {
        return res.status(409).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
});
/**
 * Routes
 */
app.use('/auth', AuthController_1.default);
/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
/**
 * Serve web app for non-API routes (client-side routing)
 */
app.get('*', (req, res) => {
    const indexPath = path_1.default.join(webBuildPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.status(404).json({ error: 'Not found' });
        }
    });
});
/**
 * Start server
 */
async function startServer() {
    try {
        // Initialize database
        if (!database_1.AppDataSource.isInitialized) {
            await database_1.AppDataSource.initialize();
            console.log('Database connected');
        }
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    startServer();
}
exports.default = app;
//# sourceMappingURL=index.js.map