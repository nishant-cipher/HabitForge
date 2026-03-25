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
 * Middleware to verify JWT token at the gateway level.
 * Reads from hf_access cookie first (browser requests),
 * falls back to Authorization: Bearer header (service-to-service calls).
 * Once verified, injects Authorization: Bearer into the forwarded request
 * so downstream services can also verify via their own middleware.
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
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

        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: string;
            email: string;
            mode: string;
        };

        (req as any).user = decoded;
        // Inject Bearer so downstream services can also validate
        req.headers.authorization = `Bearer ${token}`;
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
