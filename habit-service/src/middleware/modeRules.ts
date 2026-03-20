import { Request, Response, NextFunction } from 'express';
import { MODE_RULES } from '@habitforge/shared';
import { HabitLog } from '../models/HabitLog';
import axios from 'axios';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL as string;

interface AuthRequest extends Request {
    user?: {
        userId: string;
        mode?: string;
    }
}

/**
 * Middleware to check if a habit log can be edited based on user mode
 */
export async function checkLogEditPermission(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { logId } = req.params;
        const userId = req.user?.userId;
        
        if (!userId || !logId) {
            return res.status(400).json({
                success: false,
                message: 'User ID and log ID are required'
            });
        }

        // Get the habit log
        const log = await HabitLog.findOne({ _id: logId, userId });
        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Habit log not found'
            });
        }

        // Get user mode
        let userMode = req.user?.mode;
        if (!userMode) {
            try {
                const userResponse = await axios.get(`${USER_SERVICE_URL}/api/users/profile`, {
                    headers: {
                        'user-id': userId
                    }
                });
                userMode = userResponse.data.data.mode;
            } catch (error) {
                console.error('Failed to fetch user mode:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to verify user permissions'
                });
            }
        }

        const modeRules = MODE_RULES[userMode as keyof typeof MODE_RULES];
        if (!modeRules) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user mode'
            });
        }

        // Check if editing is allowed at all for this mode
        if (!modeRules.canEditLogs) {
            return res.status(403).json({
                success: false,
                message: `Log editing is not allowed in ${userMode} mode`
            });
        }

        // Check edit window
        if (modeRules.editWindowMinutes > 0) {
            const now = new Date();
            const logTime = new Date(log.completedAt);
            const timeDiffMinutes = (now.getTime() - logTime.getTime()) / (1000 * 60);
            
            if (timeDiffMinutes > modeRules.editWindowMinutes) {
                return res.status(403).json({
                    success: false,
                    message: `Edit window expired. You can only edit logs within ${modeRules.editWindowMinutes} minutes in ${userMode} mode`
                });
            }
        }

        // If we get here, editing is allowed
        next();
    } catch (error: any) {
        console.error('Mode rule check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check edit permissions'
        });
    }
}

/**
 * Middleware to check deadline enforcement based on mode
 */
export async function checkDeadlineEnforcement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.userId;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Get user mode
        let userMode = req.user?.mode;
        if (!userMode) {
            try {
                const userResponse = await axios.get(`${USER_SERVICE_URL}/api/users/profile`, {
                    headers: {
                        'user-id': userId
                    }
                });
                userMode = userResponse.data.data.mode;
            } catch (error) {
                console.error('Failed to fetch user mode:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to verify user permissions'
                });
            }
        }

        const modeRules = MODE_RULES[userMode as keyof typeof MODE_RULES];
        if (!modeRules) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user mode'
            });
        }

        // Check strict deadlines for DISCIPLINE mode
        if (modeRules.strictDeadlines) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);
            
            if (now > endOfDay) {
                return res.status(403).json({
                    success: false,
                    message: 'Daily deadline has passed. Cannot log habits after midnight in DISCIPLINE mode'
                });
            }
        }

        next();
    } catch (error: any) {
        console.error('Deadline enforcement check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check deadline permissions'
        });
    }
}

/**
 * Apply mode-specific XP multipliers and bonuses
 */
export function applyModeMultipliers(
    baseXP: number, 
    userMode: string, 
    completionTimeMinutes?: number,
    difficulty: number = 3,
    streak: number = 1
): number {
    const modeRules = MODE_RULES[userMode as keyof typeof MODE_RULES];
    if (!modeRules) return baseXP;

    let xp = baseXP;
    
    // Apply mode multipliers from constants
    const MODE_MULTIPLIERS: Record<string, number> = {
        'DISCIPLINE': 1.5,
        'BALANCED': 1.0,
        'COMPETITIVE': 1.2
    };
    
    xp *= MODE_MULTIPLIERS[userMode] || 1.0;
    
    // Apply efficiency bonus for COMPETITIVE mode
    if (userMode === 'COMPETITIVE' && completionTimeMinutes && 'timeBonusEnabled' in modeRules && modeRules.timeBonusEnabled) {
        let efficiencyBonus = 1.0;
        if (completionTimeMinutes <= 5) {
            efficiencyBonus = 1.3;
        } else if (completionTimeMinutes <= 15) {
            efficiencyBonus = 1.2;
        } else if (completionTimeMinutes <= 30) {
            efficiencyBonus = 1.1;
        }
        xp *= efficiencyBonus;
    }
    
    return Math.round(xp);
}