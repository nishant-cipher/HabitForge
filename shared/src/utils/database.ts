import mongoose from 'mongoose';
import { createLogger } from './logger';

const logger = createLogger('MongoDB');

/**
 * Connect to MongoDB
 */
export async function connectDB(uri: string): Promise<void> {
    try {
        await mongoose.connect(uri);
        logger.info('MongoDB connected successfully');

        mongoose.connection.on('error', (error) => {
            logger.error('MongoDB connection error', error);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

    } catch (error) {
        logger.error('Failed to connect to MongoDB', error);
        throw error;
    }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB(): Promise<void> {
    try {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected successfully');
    } catch (error) {
        logger.error('Error disconnecting from MongoDB', error);
        throw error;
    }
}

/**
 * Check if MongoDB is connected
 */
export function isConnected(): boolean {
    return mongoose.connection.readyState === 1;
}
