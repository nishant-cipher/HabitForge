import { Request, Response } from 'express';
import { Habit } from '../models/Habit';
import { UserStats } from '../models/UserStats';
import { HabitLog } from '../models/HabitLog';

/**
 * Get habits for a user (internal API)
 */
export async function getHabits(req: Request, res: Response) {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }

        const habits = await Habit.find({ 
            userId, 
            isActive: true 
        }).select('_id userId name frequency targetDays isActive isTask createdAt');

        res.status(200).json({
            success: true,
            data: habits
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to get habits' 
        });
    }
}

/**
 * Get habit stats for a user (internal API)
 */
export async function getHabitStats(req: Request, res: Response) {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }

        const stats = await UserStats.find({ userId }).select('_id userId habitId currentStreak lastCompletedAt');

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to get habit stats' 
        });
    }
}

/**
 * Get habit logs for a date range (internal API)
 */
export async function getHabitLogs(req: Request, res: Response) {
    try {
        const { userId, from, to } = req.query;
        if (!userId || !from || !to) {
            return res.status(400).json({ 
                success: false, 
                message: 'userId, from, and to are required' 
            });
        }

        const logs = await HabitLog.find({
            userId,
            completedAt: {
                $gte: new Date(from as string),
                $lte: new Date(to as string)
            }
        }).select('_id userId habitId completedAt xpEarned');

        res.status(200).json({
            success: true,
            data: logs
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to get habit logs' 
        });
    }
}

/**
 * Update habit streak (internal API)
 */
export async function updateHabitStreak(req: Request, res: Response) {
    try {
        const { statId } = req.params;
        const { currentStreak } = req.body;

        if (!statId || currentStreak === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'statId and currentStreak are required' 
            });
        }

        const updatedStat = await UserStats.findByIdAndUpdate(
            statId,
            { $set: { currentStreak: Math.max(0, currentStreak) } },
            { new: true }
        );

        if (!updatedStat) {
            return res.status(404).json({
                success: false,
                message: 'Habit stat not found'
            });
        }

        res.status(200).json({
            success: true,
            data: updatedStat
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to update habit streak' 
        });
    }
}