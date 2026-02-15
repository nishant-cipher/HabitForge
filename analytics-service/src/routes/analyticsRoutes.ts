import express from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Analytics endpoints
router.get('/analytics/dashboard', analyticsController.getDashboard);
router.get('/analytics/trends', analyticsController.getTrends);

export default router;
