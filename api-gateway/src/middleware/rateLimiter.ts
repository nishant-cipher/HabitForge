import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

// Mode-based rate limits (requests per hour)
const RATE_LIMITS = {
    DISCIPLINE: 100,
    BALANCED: 150,
    COMPETITIVE: 300
};

// IP-based limit for unauthenticated requests
const IP_LIMIT = 50;
const WINDOW_SECONDS = 60 * 60; // 1 hour

let redis: Redis | null = null;

function getRedis(): Redis | null {
    if (!redis) {
        const host = process.env.REDIS_HOST || 'localhost';
        const port = parseInt(process.env.REDIS_PORT || '6379');
        const password = process.env.REDIS_PASSWORD;

        redis = new Redis({
            host,
            port,
            password,
            lazyConnect: true,
            retryStrategy: (times: number) => {
                if (times > 3) return null; // Stop retrying after 3 attempts
                return Math.min(times * 100, 1000);
            }
        });

        redis.on('error', (err) => {
            console.warn('[RateLimiter] Redis unavailable, rate limiting bypassed:', err.message);
        });

        // Attempt connection in background (non-blocking)
        redis.connect().catch(() => {
            // Silently fail — requests will pass through if Redis is down
        });
    }
    return redis;
}

/**
 * Rate limiter middleware with mode-aware per-user limits and IP fallback.
 * If Redis is unavailable, requests pass through without limiting.
 */
export async function rateLimiter(req: Request, res: Response, next: NextFunction) {
    try {
        const client = getRedis();

        if (!client || client.status !== 'ready') {
            return next(); // Redis not ready — pass through gracefully
        }

        const user = (req as any).user;

        if (!user) {
            return ipBasedRateLimit(client, req, res, next);
        }

        const userId = user.userId;
        const mode = (user.mode as string)?.toUpperCase() || 'BALANCED';
        const limit = RATE_LIMITS[mode as keyof typeof RATE_LIMITS] ?? RATE_LIMITS.BALANCED;
        const key = `ratelimit:user:${userId}`;

        const current = await client.get(key);

        if (!current) {
            await client.setex(key, WINDOW_SECONDS, '1');
            return next();
        }

        const count = parseInt(current);

        if (count >= limit) {
            const ttl = await client.ttl(key);
            return res.status(429).json({
                success: false,
                message: 'Rate limit exceeded',
                limit,
                retryAfter: ttl
            });
        }

        await client.incr(key);
        next();
    } catch (error) {
        console.warn('[RateLimiter] Error, bypassing rate limit:', (error as Error).message);
        next();
    }
}

async function ipBasedRateLimit(client: Redis, req: Request, res: Response, next: NextFunction) {
    try {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const key = `ratelimit:ip:${ip}`;

        const current = await client.get(key);

        if (!current) {
            await client.setex(key, WINDOW_SECONDS, '1');
            return next();
        }

        const count = parseInt(current);

        if (count >= IP_LIMIT) {
            const ttl = await client.ttl(key);
            return res.status(429).json({
                success: false,
                message: 'Rate limit exceeded',
                limit: IP_LIMIT,
                retryAfter: ttl
            });
        }

        await client.incr(key);
        next();
    } catch (error) {
        console.warn('[RateLimiter] IP check error, bypassing:', (error as Error).message);
        next();
    }
}
