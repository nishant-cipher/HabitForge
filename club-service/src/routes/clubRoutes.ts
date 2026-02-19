import express from 'express';
import * as clubController from '../controllers/clubController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Public clubs discovery (no membership required)
router.get('/clubs/public', clubController.getPublicClubs);

// Club management
router.post('/clubs', clubController.createClub);
router.get('/clubs', clubController.getUserClubs);
router.get('/clubs/:clubId', clubController.getClubDetails);
router.post('/clubs/:clubId/join', clubController.joinClub);
router.post('/clubs/:clubId/leave', clubController.leaveClub);
router.get('/clubs/:clubId/members', clubController.getClubMembers);

// Club habits
router.post('/clubs/:clubId/habits', clubController.addClubHabit);
router.get('/clubs/:clubId/habits', clubController.getClubHabits);
router.post('/clubs/:clubId/habits/:habitId/accept', clubController.acceptClubHabit);
router.get('/clubs/:clubId/accepted-habits', clubController.getUserAcceptedHabits);

// Activity and chat
router.get('/clubs/:clubId/activity', clubController.getClubActivity);
router.get('/clubs/:clubId/chat', clubController.getClubMessages);
router.post('/clubs/:clubId/chat', clubController.sendChatMessage);

export default router;
