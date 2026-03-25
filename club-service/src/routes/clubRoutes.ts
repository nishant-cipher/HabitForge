import express from 'express';
import * as clubController from '../controllers/clubController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// ── Internal routes (no auth — called by other services) ──────────────────────
router.post('/internal/user-deleted', (req, res) => clubController.handleUserDeleted(req, res));

// All authenticated routes below
router.use(authenticate);

// Public clubs discovery (no membership required)
router.get('/clubs/public', clubController.getPublicClubs);

// Join by invite code (no clubId needed — looks up club by code)
router.post('/clubs/join-by-code', clubController.joinByCode);

// Club management
router.post('/clubs', clubController.createClub);
router.get('/clubs', clubController.getUserClubs);
router.get('/clubs/:clubId', clubController.getClubDetails);
router.put('/clubs/:clubId', clubController.updateClub);
router.post('/clubs/:clubId/join', clubController.joinClub);
router.delete('/clubs/:clubId', clubController.deleteClubById);

router.post('/clubs/:clubId/leave', clubController.leaveClub);
router.get('/clubs/:clubId/members', clubController.getClubMembers);

// Club habits
router.post('/clubs/:clubId/habits', clubController.addClubHabit);
router.get('/clubs/:clubId/habits', clubController.getClubHabits);
router.delete('/clubs/:clubId/habits/:habitId', clubController.deleteClubHabit);
router.post('/clubs/:clubId/habits/:habitId/accept', clubController.acceptClubHabit);
router.post('/clubs/:clubId/habits/:habitId/log', clubController.logClubHabit);
router.get('/clubs/:clubId/accepted-habits', clubController.getUserAcceptedHabits);

// Leaderboard
router.get('/clubs/:clubId/leaderboard', clubController.getLeaderboard);

// Invite code
router.get('/clubs/:clubId/invite-code', clubController.getClubInviteCode);

// Activity and chat
router.get('/clubs/:clubId/activity', clubController.getClubActivity);
router.get('/clubs/:clubId/chat', clubController.getClubMessages);
router.post('/clubs/:clubId/chat', clubController.sendChatMessage);

export default router;
