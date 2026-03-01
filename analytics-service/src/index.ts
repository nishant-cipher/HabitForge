import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import analyticsRoutes from './routes/analyticsRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/habitforge';

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

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
            host: process.env.REDIS_HOST || 'localhost',
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
