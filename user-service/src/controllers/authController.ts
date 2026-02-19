import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
const MODE_CHANGE_COOLDOWN_DAYS = 15;

function generateTokens(userId: string, email: string, mode: string) {
    const payload = { userId, email, mode };
    const secret = JWT_SECRET as jwt.Secret;
    const accessToken = jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
    const refreshToken = jwt.sign(payload, secret, { expiresIn: REFRESH_TOKEN_EXPIRES_IN } as jwt.SignOptions);
    return { accessToken, refreshToken };
}

export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, username, password, mode } = req.body;
        if (!email || !username || !password) {
            return res.status(400).json({ success: false, message: 'Email, username, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }
        const user = await authService.registerUser({ email, username, password, mode });
        const authData = await authService.loginUser({ email, password }, generateTokens);
        res.status(201).json({ success: true, message: 'User registered successfully', data: authData });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message || 'Registration failed' });
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, username, password } = req.body;
        if ((!email && !username) || !password) {
            return res.status(400).json({ success: false, message: 'Email/username and password are required' });
        }
        const authData = await authService.loginUser({ email, username, password }, generateTokens);
        res.status(200).json({ success: true, message: 'Login successful', data: authData });
    } catch (error: any) {
        res.status(401).json({ success: false, message: error.message || 'Login failed' });
    }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token is required' });
        }
        await authService.logoutUser(refreshToken);
        res.status(200).json({ success: true, message: 'Logout successful' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message || 'Logout failed' });
    }
}

export async function getProfile(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const user = await authService.getUserById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Calculate mode change cooldown info
        let modeChangeInfo = null;
        if (user.modeChangedAt) {
            const daysSinceChange = Math.floor((Date.now() - user.modeChangedAt.getTime()) / (1000 * 60 * 60 * 24));
            const daysRemaining = Math.max(0, MODE_CHANGE_COOLDOWN_DAYS - daysSinceChange);
            modeChangeInfo = { changedAt: user.modeChangedAt, daysRemaining, canChange: daysRemaining === 0 };
        }

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                email: user.email,
                username: user.username,
                mode: user.mode,
                modeChangedAt: user.modeChangedAt,
                modeChangeInfo: modeChangeInfo || { canChange: true, daysRemaining: 0 },
                xp: user.xp,
                level: user.level,
                graceSilverCards: user.graceSilverCards || 0,
                graceGoldCards: user.graceGoldCards || 0,
                createdAt: user.createdAt
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to get profile' });
    }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        const { username, mode } = req.body;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        // Check mode change cooldown
        if (mode) {
            const currentUser = await authService.getUserById(userId);
            if (!currentUser) return res.status(404).json({ success: false, message: 'User not found' });

            if (mode !== currentUser.mode && currentUser.modeChangedAt) {
                const daysSinceChange = Math.floor(
                    (Date.now() - currentUser.modeChangedAt.getTime()) / (1000 * 60 * 60 * 24)
                );
                if (daysSinceChange < MODE_CHANGE_COOLDOWN_DAYS) {
                    const daysRemaining = MODE_CHANGE_COOLDOWN_DAYS - daysSinceChange;
                    return res.status(400).json({
                        success: false,
                        message: `Mode can only be changed once every ${MODE_CHANGE_COOLDOWN_DAYS} days. You can change again in ${daysRemaining} day(s).`,
                        daysRemaining
                    });
                }
            }
        }

        const user = await authService.updateUserProfile(userId, { username, mode, modeChangedAt: mode ? new Date() : undefined });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user._id,
                email: user.email,
                username: user.username,
                mode: user.mode,
                modeChangedAt: user.modeChangedAt,
                xp: user.xp,
                level: user.level,
                graceSilverCards: user.graceSilverCards || 0,
                graceGoldCards: user.graceGoldCards || 0
            }
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message || 'Failed to update profile' });
    }
}

export async function updateUserXP(req: Request, res: Response, next: NextFunction) {
    try {
        const { userId } = req.params;
        const { xpToAdd } = req.body;
        if (!xpToAdd || xpToAdd < 0) {
            return res.status(400).json({ success: false, message: 'Invalid XP value' });
        }
        const user = await authService.getUserById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const newTotalXP = user.xp + xpToAdd;
        const newLevel = Math.floor(Math.sqrt(newTotalXP / 100));
        const updatedUser = await authService.updateUserXP(userId, xpToAdd, newLevel);
        res.status(200).json({
            success: true,
            message: 'XP updated successfully',
            data: { xpAdded: xpToAdd, totalXP: updatedUser?.xp, level: updatedUser?.level, leveledUp: newLevel > user.level }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to update XP' });
    }
}

/** Award grace cards (called internally by habit-service) */
export async function awardGraceCard(req: Request, res: Response, next: NextFunction) {
    try {
        const { userId } = req.params;
        const { type } = req.body; // 'silver' | 'gold'
        if (!userId || !type) return res.status(400).json({ success: false, message: 'userId and type required' });
        const field = type === 'gold' ? 'graceGoldCards' : 'graceSilverCards';
        const user = await authService.updateGraceCards(userId, field, 1);
        res.status(200).json({ success: true, data: { graceSilverCards: user?.graceSilverCards, graceGoldCards: user?.graceGoldCards } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to award grace card' });
    }
}

/** Use a grace card */
export async function useGraceCard(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        const { type } = req.body; // 'silver' | 'gold'
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const user = await authService.getUserById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const field = type === 'gold' ? 'graceGoldCards' : 'graceSilverCards';
        const cardCount = type === 'gold' ? user.graceGoldCards : user.graceSilverCards;
        const cardName = type === 'gold' ? 'Grace Gold Card' : 'Grace Silver Card';

        if (!cardCount || cardCount <= 0) {
            return res.status(400).json({ success: false, message: `No ${cardName}s remaining` });
        }

        const updatedUser = await authService.updateGraceCards(userId, field, -1);
        res.status(200).json({
            success: true,
            message: `${cardName} used successfully`,
            data: { graceSilverCards: updatedUser?.graceSilverCards, graceGoldCards: updatedUser?.graceGoldCards }
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message || 'Failed to use grace card' });
    }
}
