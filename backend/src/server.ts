import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Server } from 'http';
import { connectRedis } from './config/redis';
import { errorHandler, AppError } from './utils/errorHandler';
import logger from './utils/logger';
import { apiLimiter } from './middleware/rateLimiter';
import { requestIdMiddleware } from './middleware/requestId';
import pool from './config/database';

// Import routes
import authRoutes from './routes/auth';
import membersRoutes from './routes/members';
import visitsRoutes from './routes/visits';
import transactionsRoutes from './routes/transactions';
import metricsRoutes from './routes/metrics';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
let server: Server;

// Request ID middleware (first, before any other middleware)
app.use(requestIdMiddleware);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production'
      ? [process.env.NEXT_PUBLIC_CLIENT_URL || '', process.env.NEXT_PUBLIC_ADMIN_URL || '']
      : '*',
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');

    res.status(200).json({
      status: 'success',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'connected',
        redis: 'connected',
      },
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
      },
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', membersRoutes);
app.use('/api', visitsRoutes);
app.use('/api', transactionsRoutes);
app.use('/api', metricsRoutes);

// Test route
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Club Nightlife API v1.0',
    documentation: '/api/docs',
  });
});

// Handle undefined routes
app.all('*', (req: Request, res: Response) => {
  throw new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    await connectRedis();

    // Start Express server
    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`🚀 Server ready at http://localhost:${PORT}`);
      console.log(`📊 Health check at http://localhost:${PORT}/health`);
      console.log(`📈 Metrics available at http://localhost:${PORT}/api/clubs/:clubId/metrics/overview`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Close database pool
        await pool.end();
        logger.info('Database connections closed');

        // Exit process
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown', { error });
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection', { reason });
  gracefulShutdown('UNHANDLED_REJECTION');
});

startServer();

export default app;
