import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as analyticsService from '../services/analyticsService';

/**
 * Get user dashboard
 */
export async function getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId;
        const token = req.headers.authorization!.substring(7);

        const dashboard = await analyticsService.getUserDashboard(userId, token);

        res.status(200).json({
            success: true,
            data: dashboard
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch dashboard'
        });
    }
}

/**
 * Get habit trends
 */
export async function getTrends(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId;
        const token = req.headers.authorization!.substring(7);
        const period = (req.query.period as 'DAILY' | 'WEEKLY' | 'MONTHLY') || 'WEEKLY';

        const trends = await analyticsService.getHabitTrends(userId, token, period);

        res.status(200).json({
            success: true,
            data: trends
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch trends'
        });
    }
}
