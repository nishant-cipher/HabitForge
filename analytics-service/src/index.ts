import express, { Request, Response } from 'express';
import { createMetricsMiddleware } from '@habitforge/shared';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import analyticsRoutes from './routes/analyticsRoutes';
import { schedulerService } from './services/scheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;
const MONGODB_URI = process.env.MONGODB_URI as string;

// Middleware
app.use(helmet());
// Parse CLIENT_URL into an array if multiple origins are provided via comma separation
const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map(url => url.trim())
    : '*';

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Add metrics middleware
app.use(createMetricsMiddleware('analytics-service') as any);

// Exported Redis client for analytics caching
export let redisClient: Redis | null = null;

// MongoDB connection
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Initialize Redis
async function initRedis() {
    try {
        const client = new Redis({
            host: process.env.REDIS_HOST as string,
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            lazyConnect: true,
            retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 100, 1000))
        });
        client.on('error', (err: Error) => {
            console.warn('⚠️  Redis error (caching degraded):', err.message);
        });
        await client.connect();
        redisClient = client;
        console.log('✅ Redis connected (analytics caching active)');
    } catch (err) {
        console.warn('⚠️  Redis unavailable, analytics caching disabled');
    }
}
initRedis();


// Health check
app.get('/health', (req: Request, res: Response) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({
        success: true,
        service: 'analytics-service',
        status: 'healthy',
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});

// Mount routes
app.use('/api', analyticsRoutes);

// Manual daily check trigger for testing/admin
app.post('/api/trigger-daily-check', async (req: Request, res: Response) => {
    try {
        await schedulerService.triggerDailyCheck();
        res.status(200).json({ success: true, message: 'Daily check completed' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Analytics Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    mongoose.connection.close();
    process.exit(0);
});
