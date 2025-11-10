import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectRedis } from './config/redis';
import { errorHandler, AppError } from './utils/errorHandler';
import logger from './utils/logger';
import { apiLimiter } from './middleware/rateLimiter';

// Import routes
import authRoutes from './routes/auth';
import membersRoutes from './routes/members';
import visitsRoutes from './routes/visits';
import transactionsRoutes from './routes/transactions';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

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
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', membersRoutes);
app.use('/api', visitsRoutes);
app.use('/api', transactionsRoutes);

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
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`🚀 Server ready at http://localhost:${PORT}`);
      console.log(`📊 Health check at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
