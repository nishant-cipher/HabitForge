import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authenticate } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimiter';
import {
    userServiceProxy,
    habitServiceProxy,
    clubServiceProxy,
    analyticsServiceProxy
} from './utils/proxy';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/auth', rateLimiter, userServiceProxy);

// Protected routes (authentication required)
app.use('/api/users', authenticate, rateLimiter, userServiceProxy);
app.use('/api/habits', authenticate, rateLimiter, habitServiceProxy);
app.use('/api/clubs', authenticate, rateLimiter, clubServiceProxy);
app.use('/api/analytics', authenticate, rateLimiter, analyticsServiceProxy);

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
