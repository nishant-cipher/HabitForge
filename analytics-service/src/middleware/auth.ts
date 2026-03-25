import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
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

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                mode: decoded.mode
            };
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
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
}
