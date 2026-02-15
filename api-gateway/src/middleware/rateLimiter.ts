import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

// Temporarily disable rate limiter to fix timeout issues
// TODO: Fix Redis connection and re-enable rate limiting

/**
 * Rate limiter middleware (currently disabled)
 */
export async function rateLimiter(req: Request, res: Response, next: NextFunction) {
    // Pass through without rate limiting for now
    next();
}

/* ORIGINAL RATE LIMITER CODE - TO BE RE-ENABLED AFTER REDIS FIX

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
});

// Mode-based rate limits (requests per hour)
const RATE_LIMITS = {
    DISCIPLINE: 100,
    BALANCED: 150,
    COMPETITIVE: 300
};

export async function rateLimiter(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req as any).user;

        if (!user) {
            return ipBasedRateLimit(req, res, next);
        }

        const userId = user.userId;
        const mode = user.mode || 'BALANCED';
        const limit = RATE_LIMITS[mode as keyof typeof RATE_LIMITS] || RATE_LIMITS.BALANCED;

        const key = `ratelimit:${userId}`;
        const now = Date.now();
        const windowMs = 60 * 60 * 1000;

        const current = await redis.get(key);

        if (!current) {
            await redis.setex(key, Math.floor(windowMs / 1000), '1');
            return next();
        }

        const count = parseInt(current);

        if (count >= limit) {
            return res.status(429).json({
                success: false,
                message: 'Rate limit exceeded',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        await redis.incr(key);
        next();
    } catch (error) {
        console.error('Rate limiter error:', error);
        next();
    }
}

async function ipBasedRateLimit(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `ratelimit:ip:${ip}`;
    const limit = 50;
    const windowMs = 60 * 60 * 1000;

    const current = await redis.get(key);

    if (!current) {
        await redis.setex(key, Math.floor(windowMs / 1000), '1');
        return next();
    }

    const count = parseInt(current);

    if (count >= limit) {
        return res.status(429).json({
            success: false,
            message: 'Rate limit exceeded',
            retryAfter: Math.ceil(windowMs / 1000)
        });
    }

    await redis.incr(key);
    next();
}

*/
