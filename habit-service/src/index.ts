import express, { Request, Response } from 'express';
import { createMetricsMiddleware } from '@habitforge/shared';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import habitRoutes from './routes/habitRoutes';
import gamificationRoutes from './routes/gamificationRoutes';
import internalRoutes from './routes/internalRoutes';
import graceCardRoutes from './routes/graceCardRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
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
app.use(createMetricsMiddleware('habit-service') as any);

// Routes
app.use('/api/habits', habitRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/internal', internalRoutes);
app.use('/api/grace-cards', graceCardRoutes);

// Health check
app.get('/health', async (req: Request, res: Response) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.status(200).json({
        success: true,
        service: 'habit-service',
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

// Connect to MongoDB and start server
async function startServer() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        app.listen(PORT, () => {
            console.log(`🚀 Habit Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle shutdown gracefully
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await mongoose.disconnect();
    process.exit(0);
});

startServer();
