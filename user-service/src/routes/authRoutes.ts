import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);

// Protected routes
router.get('/users/profile', authenticate, authController.getProfile);
router.put('/users/profile', authenticate, authController.updateProfile);

// Inter-service routes (for Habit Service to update XP)
router.put('/users/:userId/xp', authController.updateUserXP);

export default router;
