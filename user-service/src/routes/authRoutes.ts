import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (mounted at /api/auth)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected routes (mounted at /api/users)
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

// Grace card routes
router.post('/me/use-grace-card', authenticate, authController.useGraceCard);

// Inter-service routes (for Habit Service)
router.put('/:userId/xp', authController.updateUserXP);
router.post('/:userId/award-grace-card', authController.awardGraceCard);

export default router;

