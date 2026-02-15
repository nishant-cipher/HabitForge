import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as clubService from '../services/clubService';
import * as activityService from '../services/activityService';
import axios from 'axios';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

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
        const { name, description } = req.body;
        const userId = req.user!.userId;
        const token = req.headers.authorization!.substring(7);

        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: 'Name and description are required'
            });
        }

        const username = await getUsername(userId, token);
        const club = await clubService.createClub(userId, username, { name, description });

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
        const userId = req.user!.userId;
        const token = req.headers.authorization!.substring(7);

        const username = await getUsername(userId, token);
        const club = await clubService.joinClub(clubId, userId, username);

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
