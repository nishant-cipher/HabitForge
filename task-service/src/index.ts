import express from 'express';
import { createMetricsMiddleware } from '@habitforge/shared';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import taskRoutes from './routes/taskRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;
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
app.use(createMetricsMiddleware('task-service') as any);

// Health check
app.get('/health', (_req, res) => {
    res.json({ success: true, service: 'task-service', status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes (gateway mounts /api/tasks → this service, so route here handles full path)
app.use('/api/tasks', taskRoutes);

// 404
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[task-service] Error:', err);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

// Connect to MongoDB then start
mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log('[task-service] MongoDB connected');
        app.listen(PORT, () => {
            console.log(`🚀 Task Service running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('[task-service] MongoDB connection failed:', err.message);
        process.exit(1);
    });

process.on('SIGTERM', () => { process.exit(0); });
