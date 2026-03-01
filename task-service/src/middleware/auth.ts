import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    userId: string;
    email: string;
    mode?: string;
}

export interface AuthRequest extends Request {
    user?: JwtPayload;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

/**
 * Middleware to verify JWT token.
 * Reads from hf_access cookie first (browser requests),
 * falls back to Authorization: Bearer header (service-to-service calls).
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const cookieToken = (req as any).cookies?.hf_access;
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
        const token = cookieToken ?? bearerToken;

        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}
