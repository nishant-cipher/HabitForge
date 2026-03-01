import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redisClient } from '../index';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        mode: string;
    };
}

/**
 * Middleware to verify JWT token.
 * Reads from hf_access cookie first (browser requests),
 * falls back to Authorization: Bearer header (service-to-service calls).
 * Rejects tokens that have been blacklisted in Redis (e.g. post-logout).
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
        const cookieToken = (req as any).cookies?.hf_access;
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
        const token = cookieToken ?? bearerToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Check Redis blacklist (if Redis is available)
        if (redisClient && redisClient.status === 'ready') {
            const isBlacklisted = await redisClient.exists(`blacklist:${token}`);
            if (isBlacklisted) {
                return res.status(401).json({
                    success: false,
                    message: 'Token has been invalidated'
                });
            }
        }

        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: string;
            email: string;
            mode: string;
        };

        (req as any).user = decoded;
        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
}
