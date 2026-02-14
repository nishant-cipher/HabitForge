import Redis from 'ioredis';
import { createLogger } from './logger';

const logger = createLogger('RedisClient');

let redisClient: Redis | null = null;

export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
}

/**
 * Initialize Redis client
 */
export function initRedis(config: RedisConfig): Redis {
    if (redisClient) {
        return redisClient;
    }

    redisClient = new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db || 0,
        retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        }
    });

    redisClient.on('connect', () => {
        logger.info('Redis connected');
    });

    redisClient.on('error', (error) => {
        logger.error('Redis error', error);
    });

    return redisClient;
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis {
    if (!redisClient) {
        throw new Error('Redis client not initialized. Call initRedis first.');
    }
    return redisClient;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        logger.info('Redis connection closed');
    }
}

/**
 * Cache helper functions
 */
export const cache = {
    async get<T>(key: string): Promise<T | null> {
        const client = getRedisClient();
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
    },

    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        const client = getRedisClient();
        const serialized = JSON.stringify(value);
        if (ttlSeconds) {
            await client.setex(key, ttlSeconds, serialized);
        } else {
            await client.set(key, serialized);
        }
    },

    async del(key: string): Promise<void> {
        const client = getRedisClient();
        await client.del(key);
    },

    async exists(key: string): Promise<boolean> {
        const client = getRedisClient();
        const result = await client.exists(key);
        return result === 1;
    },

    async invalidatePattern(pattern: string): Promise<void> {
        const client = getRedisClient();
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(...keys);
        }
    }
};
