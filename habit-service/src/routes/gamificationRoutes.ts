import { Router } from 'express';
import * as gamificationController from '../controllers/gamificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Logging and stats
router.post('/:habitId/log', gamificationController.logCompletion);
router.get('/:habitId/logs', gamificationController.getHabitLogs);
router.get('/:habitId/stats', gamificationController.getHabitStats);
router.get('/logs/all', gamificationController.getAllLogs);
router.get('/stats/all', gamificationController.getAllStats);

export default router;
