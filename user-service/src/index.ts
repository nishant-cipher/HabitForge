import express, { Request, Response } from 'express';
import { createMetricsMiddleware } from '@habitforge/shared';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import authRoutes from './routes/authRoutes';
import internalRoutes from './routes/internalRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI as string;

// Middleware
app.use(helmet());
// Parse CLIENT_URL into an array if multiple origins are provided via comma separation
const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map(url => url.trim())
    : '*';

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Add metrics middleware
app.use(createMetricsMiddleware('user-service') as any);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes); // For profile endpoints
app.use('/api/internal', internalRoutes); // Internal service-to-service calls (no auth)

// Health check
app.get('/health', async (req: Request, res: Response) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.status(200).json({
        success: true,
        service: 'user-service',
        status: 'healthy',
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// Exported Redis client for token blacklisting (used by authController)
export let redisClient: Redis | null = null;

// Connect to MongoDB and start server
async function startServer() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Initialize Redis for token blacklisting
        try {
            const client = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
                lazyConnect: true,
                retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 1000))
            });
            client.on('error', (err) => {
                console.warn('⚠️  Redis error (blacklisting degraded):', err.message);
            });
            await client.connect();
            redisClient = client;
            console.log('✅ Redis connected (token blacklisting active)');
        } catch (redisErr) {
            console.warn('⚠️  Redis unavailable, token blacklisting disabled');
        }

        app.listen(PORT, () => {
            console.log(`🚀 User Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle shutdown gracefully
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    if (redisClient) await redisClient.quit();
    await mongoose.disconnect();
    process.exit(0);
});

startServer();
