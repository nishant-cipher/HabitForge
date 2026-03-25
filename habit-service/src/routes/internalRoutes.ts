import { Router } from 'express';
import * as internalController from '../controllers/internalController';

const router = Router();

// Internal routes for daily habit checker
router.get('/habits', internalController.getHabits);
router.get('/stats', internalController.getHabitStats);
router.get('/logs', internalController.getHabitLogs);
router.put('/stats/:statId', internalController.updateHabitStreak);

export default router;