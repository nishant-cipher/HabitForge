import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import jwt from 'jsonwebtoken';
import * as http from 'http';
import * as https from 'https';
import { redisClient } from '../index';

const CLUB_SERVICE_URL = process.env.CLUB_SERVICE_URL as string;

/** Fire-and-forget POST to club-service internal endpoint */
function notifyClubService(path: string, body: object): Promise<void> {
    return new Promise((resolve) => {
        const data = JSON.stringify(body);
        const url = new URL(CLUB_SERVICE_URL + path);
        const lib = url.protocol === 'https:' ? https : http;
        const req = lib.request(
            { hostname: url.hostname, port: url.port || (url.protocol === 'https:' ? 443 : 80), path: url.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
            () => resolve()
        );
        req.on('error', (e) => { console.warn('[notifyClubService] error:', e.message); resolve(); });
        req.setTimeout(5000, () => { req.destroy(); resolve(); });
        req.write(data);
        req.end();
    });
}

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

const COOKIE_OPTS_BASE = { httpOnly: true, sameSite: 'lax' as const, secure: false, path: '/' };

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('hf_access', accessToken, { ...COOKIE_OPTS_BASE, maxAge: 15 * 60 * 1000 });
    res.cookie('hf_refresh', refreshToken, { ...COOKIE_OPTS_BASE, maxAge: 7 * 24 * 60 * 60 * 1000 });
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
        await authService.registerUser({ email, username, password, mode });
        const authData = await authService.loginUser({ email, password }, generateTokens);
        setAuthCookies(res, authData.accessToken, authData.refreshToken);
        res.status(201).json({ success: true, message: 'User registered successfully', data: { user: authData.user } });
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
        setAuthCookies(res, authData.accessToken, authData.refreshToken);
        res.status(200).json({ success: true, message: 'Login successful', data: { user: authData.user } });
    } catch (error: any) {
        res.status(401).json({ success: false, message: error.message || 'Login failed' });
    }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
    try {
        const accessToken = (req as any).cookies?.hf_access;
        const refreshToken = (req as any).cookies?.hf_refresh || req.body?.refreshToken;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token is required' });
        }

        // Blacklist the access token in Redis so it can't be reused
        if (accessToken && redisClient && redisClient.status === 'ready') {
            try {
                const decoded = jwt.decode(accessToken) as { exp?: number } | null;
                if (decoded?.exp) {
                    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
                    if (ttl > 0) {
                        await redisClient.setex(`blacklist:${accessToken}`, ttl, '1');
                    }
                }
            } catch (blacklistErr) {
                console.warn('[logout] Failed to blacklist token:', (blacklistErr as Error).message);
            }
        }

        await authService.logoutUser(refreshToken);
        res.clearCookie('hf_access', { path: '/' });
        res.clearCookie('hf_refresh', { path: '/' });
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

/** Delete account */
export async function deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        // Notify club-service to transfer/delete clubs owned by this user (best-effort)
        try {
            await notifyClubService('/api/internal/user-deleted', { userId });
        } catch (clubErr: any) {
            console.warn('[deleteAccount] Club cleanup failed:', clubErr?.message);
        }

        await authService.deleteUser(userId);
        res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to delete account' });
    }
}

/** Change password (authenticated) */
export async function changePassword(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        const { currentPassword, newPassword } = req.body;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }
        await authService.updatePassword(userId, currentPassword, newPassword);
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message || 'Failed to update password' });
    }
}

/** Change email (authenticated) */
export async function changeEmail(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        const { email } = req.body;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
        const user = await authService.updateEmail(userId, email);
        res.status(200).json({ success: true, message: 'Email updated successfully', data: { email: user?.email } });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message || 'Failed to update email' });
    }
}

/** Update notification preferences (authenticated) */
export async function updateNotifications(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { dailyReminders, streakAlerts, clubActivity } = req.body;
        const user = await authService.updateNotificationPrefs(userId, { dailyReminders, streakAlerts, clubActivity });
        res.status(200).json({ success: true, message: 'Notification preferences updated', data: user?.notificationPrefs });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message || 'Failed to update notifications' });
    }
}

/** Forgot password — send reset email (public) */
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        let rawToken: string;
        try {
            const result = await authService.createPasswordResetToken(email);
            rawToken = result.rawToken;
        } catch {
            // Don't reveal whether email exists
            return res.status(200).json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
        }

        // Handle multiple CLIENT_URLs (e.g. "https://habit-forge.app,https://www.habit-forge.app")
        const clientUrls = (process.env.CLIENT_URL || '').split(',');
        const primaryClientUrl = clientUrls[0].trim();
        const resetLink = `${primaryClientUrl}/reset-password?token=${rawToken}`;

        try {
            const { sendPasswordResetEmail } = await import('../utils/mailer');
            await sendPasswordResetEmail(email, resetLink);
        } catch (mailErr: any) {
            console.error('[forgotPassword] Email send failed:', mailErr?.message);
            return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again later.' });
        }

        res.status(200).json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to process request' });
    }
}

/** Reset password with token (public) */
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Token and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }
        await authService.resetPasswordByToken(token, newPassword);
        res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message || 'Failed to reset password' });
    }
}

