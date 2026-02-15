import { ActivityLog } from '../models/ActivityLog';
import { ChatMessage } from '../models/ChatMessage';

/**
 * Get club activity feed
 */
export async function getClubActivity(clubId: string, limit: number = 50) {
    return ActivityLog.find({ clubId })
        .sort({ timestamp: -1 })
        .limit(limit);
}

/**
 * Log habit completion activity
 */
export async function logHabitCompletion(clubId: string, userId: string, username: string, habitName: string, notes?: string) {
    return ActivityLog.create({
        clubId,
        userId,
        username,
        habitName,
        action: 'LOGGED',
        notes,
        timestamp: new Date()
    });
}

/**
 * Get club chat messages
 */
export async function getClubMessages(clubId: string, limit: number = 100) {
    return ChatMessage.find({ clubId })
        .sort({ timestamp: -1 })
        .limit(limit);
}

/**
 * Send chat message
 */
export async function sendChatMessage(clubId: string, userId: string, username: string, message: string) {
    return ChatMessage.create({
        clubId,
        userId,
        username,
        message,
        timestamp: new Date()
    });
}
