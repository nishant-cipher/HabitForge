import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (mounted at /api/auth)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes (mounted at /api/users)
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.delete('/profile', authenticate, authController.deleteAccount);
router.patch('/password', authenticate, authController.changePassword);
router.patch('/email', authenticate, authController.changeEmail);
router.patch('/notifications', authenticate, authController.updateNotifications);

// Grace card routes
router.post('/me/use-grace-card', authenticate, authController.useGraceCard);

// Inter-service routes (for Habit Service)
router.put('/:userId/xp', authController.updateUserXP);
router.post('/:userId/award-grace-card', authController.awardGraceCard);
router.put('/:userId/grace-cards', authController.updateGraceCards);

// Internal API routes (for daily checker)
router.get('/internal/users', authController.getAllUsers);

export default router;
