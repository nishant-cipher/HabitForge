import { Request, Response } from 'express';
import * as gamificationService from '../services/gamificationService';

/**
 * Log a habit completion
 */
export async function logCompletion(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId;
        const userMode = (req as any).user?.mode || 'BALANCED';
        const { habitId } = req.params;
        const { notes, completionTimeMinutes } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const result = await gamificationService.logHabitCompletion(
            habitId,
            userId,
            userMode,
            notes,
            completionTimeMinutes
        );

        res.status(201).json({
            success: true,
            message: `Habit logged! You earned ${result.xpEarned} XP`,
            data: {
                log: result.log,
                xpEarned: result.xpEarned
            }
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to log habit'
        });
    }
}

/**
 * Get habit logs
 */
export async function getHabitLogs(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId;
        const { habitId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const logs = await gamificationService.getHabitLogs(
            userId,
            habitId,
            limit
        );

        res.status(200).json({
            success: true,
            data: logs
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get logs'
        });
    }
}

/**
 * Get all logs for user
 */
export async function getAllLogs(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId;
        const limit = parseInt(req.query.limit as string) || 50;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const logs = await gamificationService.getHabitLogs(
            userId,
            undefined,
            limit
        );

        res.status(200).json({
            success: true,
            data: logs
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get logs'
        });
    }
}

/**
 * Get habit stats
 */
export async function getHabitStats(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId;
        const { habitId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const stats = await gamificationService.getHabitStats(userId, habitId);

        if (!stats) {
            return res.status(404).json({
                success: false,
                message: 'No stats found for this habit'
            });
        }

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get stats'
        });
    }
}

/**
 * Get all user stats
 */
export async function getAllStats(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const stats = await gamificationService.getAllUserStats(userId);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get stats'
        });
    }
}
