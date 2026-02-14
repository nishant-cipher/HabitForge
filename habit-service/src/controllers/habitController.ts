import { Request, Response } from 'express';
import * as habitService from '../services/habitService';
import { HabitCategory, HabitFrequency } from '../models/Habit';

/**
 * Create a new habit
 */
export async function createHabit(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId;
        const { name, description, category, difficulty, frequency, targetDays } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Validation
        if (!name || !category || !difficulty) {
            return res.status(400).json({
                success: false,
                message: 'Name, category, and difficulty are required'
            });
        }

        if (difficulty < 1 || difficulty > 5) {
            return res.status(400).json({
                success: false,
                message: 'Difficulty must be between 1 and 5'
            });
        }

        const habit = await habitService.createHabit({
            userId,
            name,
            description,
            category,
            difficulty,
            frequency,
            targetDays
        });

        res.status(201).json({
            success: true,
            message: 'Habit created successfully',
            data: habit
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create habit'
        });
    }
}

/**
 * Get all user habits
 */
export async function getUserHabits(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId;
        const activeOnly = req.query.activeOnly !== 'false';

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const habits = await habitService.getUserHabits(userId, activeOnly);

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
 * Get a single habit
 */
export async function getHabit(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId;
        const { habitId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const habit = await habitService.getHabitById(habitId, userId);

        if (!habit) {
            return res.status(404).json({
                success: false,
                message: 'Habit not found'
            });
        }

        res.status(200).json({
            success: true,
            data: habit
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get habit'
        });
    }
}

/**
 * Update a habit
 */
export async function updateHabit(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId;
        const { habitId } = req.params;
        const updates = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const habit = await habitService.updateHabit(habitId, userId, updates);

        if (!habit) {
            return res.status(404).json({
                success: false,
                message: 'Habit not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Habit updated successfully',
            data: habit
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update habit'
        });
    }
}

/**
 * Delete a habit
 */
export async function deleteHabit(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId;
        const { habitId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const habit = await habitService.deleteHabit(habitId, userId);

        if (!habit) {
            return res.status(404).json({
                success: false,
                message: 'Habit not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Habit deleted successfully'
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to delete habit'
        });
    }
}
