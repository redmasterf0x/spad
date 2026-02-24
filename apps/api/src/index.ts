import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { AppDataSource } from './config/database';
import authRouter from './controllers/AuthController';

const app: Express = express();

/**
 * Middleware
 */
app.use(cors());
app.use(express.json());

/**
 * Serve static files from web app
 */
const webBuildPath = path.join(__dirname, '../../web/dist');
app.use(express.static(webBuildPath));

/**
 * Error handling middleware
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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
app.use('/auth', authRouter);

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Serve web app for non-API routes (client-side routing)
 */
app.get('*', (req: Request, res: Response) => {
  const indexPath = path.join(webBuildPath, 'index.html');
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
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connected');
    }

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
