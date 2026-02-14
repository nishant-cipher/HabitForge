import { Router } from 'express';
import * as habitController from '../controllers/habitController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Habit CRUD
router.post('/', habitController.createHabit);
router.get('/', habitController.getUserHabits);
router.get('/:habitId', habitController.getHabit);
router.put('/:habitId', habitController.updateHabit);
router.delete('/:habitId', habitController.deleteHabit);

export default router;
