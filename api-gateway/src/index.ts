import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { authenticate } from './middleware/auth';
// rateLimiter disabled — Redis used only for blacklisting & caching
import {
    userServiceProxy,
    habitServiceProxy,
    clubServiceProxy,
    analyticsServiceProxy,
    taskServiceProxy
} from './utils/proxy';

import { createMetricsMiddleware } from '@habitforge/shared';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// Add metrics middleware BEFORE routes
app.use(createMetricsMiddleware('api-gateway') as any);

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        service: 'api-gateway',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Debug logging
app.use((req: Request, res: Response, next: any) => {
    console.log(`[${req.method}] ${req.path}`);
    next();
});

// Public routes (no authentication required)
app.use('/api/auth', userServiceProxy);

// Protected routes (authentication required)
app.use('/api/users', authenticate, userServiceProxy);
app.use('/api/habits', authenticate, habitServiceProxy);
app.use('/api/gamification', authenticate, habitServiceProxy);
app.use('/api/clubs', authenticate, clubServiceProxy);
app.use('/api/analytics', authenticate, analyticsServiceProxy);
app.use('/api/tasks', authenticate, taskServiceProxy);

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

// Start server
app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});
