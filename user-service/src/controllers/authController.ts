import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

/**
 * Generate JWT tokens
 */
function generateTokens(userId: string, email: string, mode: string) {
    const payload = { userId, email, mode };
    const secret = JWT_SECRET as jwt.Secret;

    const accessToken = jwt.sign(
        payload,
        secret,
        { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
        payload,
        secret,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN } as jwt.SignOptions
    );

    return { accessToken, refreshToken };
}

/**
 * Register new user
 */
export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, username, password, mode } = req.body;

        // Validation
        if (!email || !username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email, username, and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Register user
        const user = await authService.registerUser({
            email,
            username,
            password,
            mode
        });

        // Generate tokens
        const tokens = generateTokens(
            user._id.toString(),
            user.email,
            user.mode
        );

        // Create session
        const authData = await authService.loginUser(
            { email, password },
            generateTokens
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: authData
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Registration failed'
        });
    }
}

/**
 * Login user
 */
export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, username, password } = req.body;

        // Validation - accept either email or username
        if ((!email && !username) || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email/username and password are required'
            });
        }

        // Login user (pass both email and username, service will handle)
        const authData = await authService.loginUser(
            { email, username, password },
            generateTokens
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: authData
        });
    } catch (error: any) {
        res.status(401).json({
            success: false,
            message: error.message || 'Login failed'
        });
    }
}

/**
 * Logout user
 */
export async function logout(req: Request, res: Response, next: NextFunction) {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        await authService.logoutUser(refreshToken);

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Logout failed'
        });
    }
}

/**
 * Get current user profile
 */
export async function getProfile(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const user = await authService.getUserById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                email: user.email,
                username: user.username,
                mode: user.mode,
                xp: user.xp,
                level: user.level,
                createdAt: user.createdAt
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get profile'
        });
    }
}

/**
 * Update user profile
 */
export async function updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        const { username, mode } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const user = await authService.updateUserProfile(userId, {
            username,
            mode
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user._id,
                email: user.email,
                username: user.username,
                mode: user.mode,
                xp: user.xp,
                level: user.level
            }
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update profile'
        });
    }
}

/**
 * Update user XP (called by Habit Service)
 */
export async function updateUserXP(req: Request, res: Response, next: NextFunction) {
    try {
        const { userId } = req.params;
        const { xpToAdd } = req.body;

        if (!xpToAdd || xpToAdd < 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid XP value'
            });
        }

        // Get current user
        const user = await authService.getUserById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Calculate new level
        const newTotalXP = user.xp + xpToAdd;
        const newLevel = Math.floor(Math.sqrt(newTotalXP / 100));

        // Update user
        const updatedUser = await authService.updateUserXP(userId, xpToAdd, newLevel);

        res.status(200).json({
            success: true,
            message: 'XP updated successfully',
            data: {
                xpAdded: xpToAdd,
                totalXP: updatedUser?.xp,
                level: updatedUser?.level,
                leveledUp: newLevel > user.level
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update XP'
        });
    }
}
