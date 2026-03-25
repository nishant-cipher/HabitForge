import { Request, Response } from 'express';
import * as graceCardService from '../services/graceCardService';

interface AuthRequest extends Request {
    user?: {
        userId: string;
    }
}

/**
 * Use a silver grace card for a specific habit
 */
export async function useSilverCard(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        const { habitId, targetDate } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        if (!habitId) {
            return res.status(400).json({
                success: false,
                message: 'habitId is required'
            });
        }

        const date = targetDate ? new Date(targetDate) : undefined;
        const result = await graceCardService.useSilverGraceCard(userId, habitId, date);

        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message,
                data: result
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to use silver grace card'
        });
    }
}

/**
 * Use a gold grace card for all missed habits on a date
 */
export async function useGoldCard(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        const { targetDate } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const date = targetDate ? new Date(targetDate) : undefined;
        const result = await graceCardService.useGoldGraceCard(userId, date);

        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message,
                data: result
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to use gold grace card'
        });
    }
}

/**
 * Get grace card status for the current user
 */
export async function getGraceCardStatus(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const result = await graceCardService.getGraceCardStatus(userId);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(500).json({
                success: false,
                message: result.message
            });
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get grace card status'
        });
    }
}