import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import habitRoutes from './routes/habitRoutes';
import gamificationRoutes from './routes/gamificationRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/habitforge';

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/habits', habitRoutes);
app.use('/api/gamification', gamificationRoutes);

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
