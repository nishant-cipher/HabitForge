import { Router } from 'express';
import * as habitController from '../controllers/habitController';
import * as gamificationController from '../controllers/gamificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Stats & logs (must come before /:habitId to avoid route conflicts)
router.get('/logs', gamificationController.getAllLogs);
router.get('/stats', gamificationController.getAllStats);

// Habit CRUD
router.post('/', habitController.createHabit);
router.get('/', habitController.getUserHabits);
router.get('/:habitId', habitController.getHabit);
router.put('/:habitId', habitController.updateHabit);
router.delete('/:habitId', habitController.deleteHabit);

// Habit logging & stats per habit (must come after specific routes)
router.post('/:habitId/log', gamificationController.logCompletion);
router.get('/:habitId/logs', gamificationController.getHabitLogs);
router.get('/:habitId/stats', gamificationController.getHabitStats);

export default router;
