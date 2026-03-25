import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as graceCardController from '../controllers/graceCardController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Grace card routes
router.post('/silver/use', graceCardController.useSilverCard);
router.post('/gold/use', graceCardController.useGoldCard);
router.get('/status', graceCardController.getGraceCardStatus);

export default router;