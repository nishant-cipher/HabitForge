import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as clubService from '../services/clubService';
import * as activityService from '../services/activityService';
import { ActivityLog } from '../models/ActivityLog';
import axios from 'axios';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL as string;

/**
 * Get username from user service
 */
async function getUsername(userId: string, token: string): Promise<string> {
    try {
        const response = await axios.get(`${USER_SERVICE_URL}/api/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data.data.username;
    } catch (error) {
        return 'Unknown User';
    }
}

/**
 * Create a new club
 */
export async function createClub(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { name, description, category, isPublic } = req.body;
        const userId = req.user!.userId;
        const token = req.headers.authorization!.substring(7);

        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: 'Name and description are required'
            });
        }

        const username = await getUsername(userId, token);
        const club = await clubService.createClub(userId, username, {
            name,
            description,
            category,
            isPublic: isPublic !== false && isPublic !== 'false'
        });

        res.status(201).json({
            success: true,
            message: 'Club created successfully',
            data: club
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create club'
        });
    }
}

/**
 * Get all public clubs
 */
export async function getPublicClubs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const clubs = await clubService.getPublicClubs();
        res.status(200).json({
            success: true,
            data: clubs
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get public clubs'
        });
    }
}

/**
 * Get user's clubs
 */
export async function getUserClubs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId;
        const clubs = await clubService.getUserClubs(userId);

        res.status(200).json({
            success: true,
            data: clubs
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get clubs'
        });
    }
}

/**
 * Get club details
 */
export async function getClubDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { clubId } = req.params;
        const club = await clubService.getClubDetails(clubId);

        res.status(200).json({
            success: true,
            data: club
        });
    } catch (error: any) {
        res.status(404).json({
            success: false,
            message: error.message || 'Club not found'
        });
    }
}

/**
 * Join a club
 */
export async function joinClub(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { clubId } = req.params;
        const { inviteCode } = req.body;
        const userId = req.user!.userId;
        const token = req.headers.authorization!.substring(7);

        const username = await getUsername(userId, token);
        const club = await clubService.joinClub(clubId, userId, username, inviteCode);

        res.status(200).json({
            success: true,
            message: 'Joined club successfully',
            data: club
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to join club'
        });
    }
}

/**
 * Join a club by invite code only (global join — private clubs not visible in explore)
 */
export async function joinByCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { inviteCode } = req.body;
        const userId = req.user!.userId;
        const token = req.headers.authorization!.substring(7);

        if (!inviteCode || inviteCode.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Invite code is required' });
        }

        const username = await getUsername(userId, token);
        const club = await clubService.joinClubByCode(inviteCode.trim().toUpperCase(), userId, username);

        res.status(200).json({
            success: true,
            message: `Joined ${club.name} successfully!`,
            data: club
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message || 'Failed to join club' });
    }
}

/**
 * Leave a club
 */
export async function leaveClub(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { clubId } = req.params;
        const userId = req.user!.userId;
        const token = req.headers.authorization!.substring(7);

        const username = await getUsername(userId, token);
        await clubService.leaveClub(clubId, userId, username);

        res.status(200).json({
            success: true,
            message: 'Left club successfully'
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to leave club'
        });
    }
}

/**
 * Get club members
 */
export async function getClubMembers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { clubId } = req.params;
        const members = await clubService.getClubMembers(clubId);

        res.status(200).json({
            success: true,
            data: members
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get members'
        });
    }
}

/**
 * Add habit to club
 */
export async function addClubHabit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { clubId } = req.params;
        const userId = req.user!.userId;
        const habitData = req.body;

        const clubHabit = await clubService.addClubHabit(clubId, userId, habitData);

        res.status(201).json({
            success: true,
            message: 'Habit added to club',
            data: clubHabit
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to add habit'
        });
    }
}

/**
 * Get club habits
 */
export async function getClubHabits(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { clubId } = req.params;
        const habits = await clubService.getClubHabits(clubId);

        res.status(200).json({
            success: true,
            data: habits
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get habits'
        });
    }
}

/**
 * Delete a club habit (owner/admin only)
 */
export async function deleteClubHabit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { clubId, habitId } = req.params;
        const userId = req.user!.userId;

        const result = await clubService.deleteClubHabit(clubId, habitId, userId);

        res.status(200).json({
            success: true,
            message: 'Habit deleted from club',
            data: result
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to delete habit'
        });
    }
}

/**
 * Get invite code for a private club (owner/admin only)
 */
export async function getClubInviteCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { clubId } = req.params;
        const userId = req.user!.userId;

        const inviteCode = await clubService.getClubInviteCode(clubId, userId);

        res.status(200).json({
            success: true,
            data: { inviteCode }
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to get invite code'
        });
    }
}

/**
 * Accept a club habit
 */
export async function acceptClubHabit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { clubId, habitId } = req.params;
        const userId = req.user!.userId;
        const token = req.headers.authorization!.substring(7);

        const username = await getUsername(userId, token);
        const result = await clubService.acceptClubHabit(clubId, habitId, userId, username, token);

        res.status(200).json({
            success: true,
            message: 'Habit accepted successfully',
            data: result
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to accept habit'
        });
    }
}

/**
 * Log a club habit completion (auto-accepts if needed)
 */
export async function logClubHabit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { clubId, habitId } = req.params;
        const userId = req.user!.userId;
        const token = req.headers.authorization!.substring(7);

        const username = await getUsername(userId, token);
        const result = await clubService.logClubHabit(clubId, habitId, userId, username, token);

        res.status(200).json({
            success: true,
            message: 'Habit logged successfully',
            data: result
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to log habit'
        });
    }
}

/**
 * Get user's accepted habits
 */
export async function getUserAcceptedHabits(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { clubId } = req.params;
        const userId = req.user!.userId;

        const habits = await clubService.getUserAcceptedHabits(clubId, userId);

        res.status(200).json({
            success: true,
            data: habits
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get accepted habits'
        });
    }
}

/**
 * Get club leaderboard — members ranked by total club habit completions
 */
export async function getLeaderboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { clubId } = req.params;

        // Count COMPLETED_HABIT entries per userId for this club
        const completions = await ActivityLog.aggregate([
            { $match: { clubId, action: 'COMPLETED_HABIT' } },
            { $group: { _id: '$userId', username: { $last: '$username' }, completions: { $sum: 1 } } },
            { $sort: { completions: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: completions.map((entry: any, i: number) => ({
                rank: i + 1,
                userId: entry._id,
                username: entry.username,
                completions: entry.completions
            }))
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to get leaderboard' });
    }
}

/**
 * Get club activity
 */
export async function getClubActivity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { clubId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;

        const activity = await activityService.getClubActivity(clubId, limit);

        res.status(200).json({
            success: true,
            data: activity
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get activity'
        });
    }
}

/**
 * Get club chat messages
 */
export async function getClubMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { clubId } = req.params;
        const limit = parseInt(req.query.limit as string) || 100;

        const messages = await activityService.getClubMessages(clubId, limit);

        res.status(200).json({
            success: true,
            data: messages
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get messages'
        });
    }
}

/**
 * Send chat message
 */
export async function sendChatMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { clubId } = req.params;
        const { message } = req.body;
        const userId = req.user!.userId;
        const token = req.headers.authorization!.substring(7);

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        const username = await getUsername(userId, token);
        const chatMessage = await activityService.sendChatMessage(clubId, userId, username, message);

        res.status(201).json({
            success: true,
            data: chatMessage
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to send message'
        });
    }
}

/**
 * Internal: handle user account deletion — transfer ownership or delete clubs
 * Called by user-service (no auth token required)
 */
export async function handleUserDeleted(req: any, res: Response) {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }
        await clubService.handleUserDeleted(userId);
        res.status(200).json({ success: true, message: 'Club cleanup completed' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Club cleanup failed' });
    }
}

/**
 * Delete a club (owner only)
 */
export async function deleteClubById(req: AuthRequest, res: Response) {
    try {
        const { clubId } = req.params;
        const userId = req.user!.userId;
        await clubService.deleteClub(clubId, userId);
        res.status(200).json({ success: true, message: 'Club deleted successfully' });
    } catch (error: any) {
        const status = error.message?.includes('Only the club owner') ? 403 : 400;
        res.status(status).json({ success: false, message: error.message || 'Failed to delete club' });
    }
}

/**
 * Update club details (owner only) — name, description, isPublic
 */
export async function updateClub(req: AuthRequest, res: Response) {
    try {
        const { clubId } = req.params;
        const userId = req.user!.userId;
        const { name, description, isPublic } = req.body;

        const Club = (await import('../models/Club')).Club;
        const club = await Club.findById(clubId);
        if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
        if (club.ownerId !== userId) return res.status(403).json({ success: false, message: 'Only the club owner can edit this club' });

        if (name !== undefined) {
            if (!name.trim() || name.trim().length < 3) return res.status(400).json({ success: false, message: 'Club name must be at least 3 characters' });
            club.name = name.trim();
        }
        if (description !== undefined) club.description = description.trim() || club.description;
        if (isPublic !== undefined) {
            const wasPrivate = !club.isPublic;
            club.isPublic = isPublic === true || isPublic === 'true';
            // Generate invite code when switching to private if not already set
            if (!club.isPublic && wasPrivate === false && !club.inviteCode) {
                club.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            }
        }

        await club.save();
        res.status(200).json({ success: true, message: 'Club updated successfully', data: club });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message || 'Failed to update club' });
    }
}



