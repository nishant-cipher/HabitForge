import jwt from 'jsonwebtoken';

export interface JWTPayload {
    userId: string;
    email: string;
    mode: string;
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(
    payload: JWTPayload,
    secret: string,
    expiresIn: string = '15m'
): string {
    return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(
    payload: JWTPayload,
    secret: string,
    expiresIn: string = '7d'
): string {
    return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string, secret: string): JWTPayload | null {
    try {
        return jwt.verify(token, secret) as JWTPayload;
    } catch (error) {
        return null;
    }
}

/**
 * Decode JWT token without verification
 */
export function decodeToken(token: string): JWTPayload | null {
    try {
        return jwt.decode(token) as JWTPayload;
    } catch (error) {
        return null;
    }
}
