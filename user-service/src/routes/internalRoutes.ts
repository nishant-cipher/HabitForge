import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

/**
 * Internal routes — no JWT authentication required.
 * These are only reachable from other backend services (not exposed via API gateway).
 */

// Get all users (used by daily habit checker)
router.get('/users', authController.getAllUsers);

// Get a single user by ID (used by habit-service grace card / gamification calls)
router.get('/users/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { getUserById } = await import('../services/authService');
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
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
                graceSilverCards: user.graceSilverCards || 0,
                graceGoldCards: user.graceGoldCards || 0,
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to get user' });
    }
});

export default router;
