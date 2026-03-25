import axios from 'axios';
import { UserStats } from '../models/UserStats';
import { HabitLog } from '../models/HabitLog';
import { Habit } from '../models/Habit';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL as string;

export interface GraceCardUsageResult {
    success: boolean;
    message: string;
    cardType: 'silver' | 'gold';
    affectedHabits?: string[];
    xpRestored?: number;
    streaksProtected?: number;
}

/**
 * Use a silver grace card to protect a specific habit streak
 */
export async function useSilverGraceCard(
    userId: string,
    habitId: string,
    targetDate?: Date
): Promise<GraceCardUsageResult> {
    try {
        // Check if user has silver cards (internal call — no JWT needed)
        const userResponse = await axios.get(`${USER_SERVICE_URL}/api/internal/users/${userId}`);
        const user = userResponse.data.data;
        
        if (!user.graceSilverCards || user.graceSilverCards <= 0) {
            return {
                success: false,
                message: 'No silver grace cards available',
                cardType: 'silver'
            };
        }

        // Verify habit exists and belongs to user
        const habit = await Habit.findOne({ _id: habitId, userId });
        if (!habit) {
            return {
                success: false,
                message: 'Habit not found',
                cardType: 'silver'
            };
        }

        // Get habit stats
        const stats = await UserStats.findOne({ userId, habitId });
        if (!stats) {
            return {
                success: false,
                message: 'No habit statistics found',
                cardType: 'silver'
            };
        }

        // Use the date provided or yesterday
        const date = targetDate || getYesterday();
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Check if habit was already completed on the target date
        const existingLog = await HabitLog.findOne({
            userId,
            habitId,
            completedAt: { $gte: startOfDay, $lte: endOfDay }
        });

        if (existingLog) {
            return {
                success: false,
                message: 'Habit was already completed on the target date',
                cardType: 'silver'
            };
        }

        // Create a grace card log entry (marked with grace card usage)
        const graceLog = new HabitLog({
            userId,
            habitId,
            completedAt: new Date(date),
            xpEarned: 0, // No XP earned from grace cards
            streakAtCompletion: stats.currentStreak,
            modeAtCompletion: user.mode,
            notes: 'Protected by Silver Grace Card',
            isGraceCard: true,
            graceCardType: 'silver',
            canEdit: false
        });

        await graceLog.save();

        // Use the grace card (internal call)
        await axios.put(`${USER_SERVICE_URL}/api/users/${userId}/grace-cards`, {
            silverChange: -1
        });

        return {
            success: true,
            message: `Silver grace card used to protect ${habit.name} streak`,
            cardType: 'silver',
            affectedHabits: [habit.name],
            streaksProtected: 1
        };

    } catch (error: any) {
        console.error('Silver grace card usage error:', error);
        return {
            success: false,
            message: 'Failed to use silver grace card',
            cardType: 'silver'
        };
    }
}

/**
 * Use a gold grace card to protect all missed habits for a day
 */
export async function useGoldGraceCard(
    userId: string,
    targetDate?: Date
): Promise<GraceCardUsageResult> {
    try {
        // Check if user has gold cards (internal call — no JWT needed)
        const userResponse = await axios.get(`${USER_SERVICE_URL}/api/internal/users/${userId}`);
        const user = userResponse.data.data;
        
        if (!user.graceGoldCards || user.graceGoldCards <= 0) {
            return {
                success: false,
                message: 'No gold grace cards available',
                cardType: 'gold'
            };
        }

        // Use the date provided or yesterday
        const date = targetDate || getYesterday();
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Get all user's active daily habits
        const habits = await Habit.find({ 
            userId, 
            isActive: true, 
            frequency: 'DAILY',
            isTask: false,
            createdAt: { $lte: endOfDay } // Only habits that existed on the target date
        });

        if (habits.length === 0) {
            return {
                success: false,
                message: 'No daily habits found for the target date',
                cardType: 'gold'
            };
        }

        // Get existing logs for the target date
        const existingLogs = await HabitLog.find({
            userId,
            completedAt: { $gte: startOfDay, $lte: endOfDay }
        });

        const completedHabitIds = new Set(existingLogs.map(log => log.habitId.toString()));
        const missedHabits = habits.filter(h => !completedHabitIds.has(h._id.toString()));

        if (missedHabits.length === 0) {
            return {
                success: false,
                message: 'All habits were already completed on the target date',
                cardType: 'gold'
            };
        }

        // Create grace card log entries for all missed habits
        const graceLogs = [];
        const affectedHabitNames = [];

        for (const habit of missedHabits) {
            const stats = await UserStats.findOne({ userId, habitId: habit._id });
            const graceLog = new HabitLog({
                userId,
                habitId: habit._id,
                completedAt: new Date(date),
                xpEarned: 0, // No XP earned from grace cards
                streakAtCompletion: stats?.currentStreak || 0,
                modeAtCompletion: user.mode,
                notes: 'Protected by Gold Grace Card',
                isGraceCard: true,
                graceCardType: 'gold',
                canEdit: false
            });
            
            graceLogs.push(graceLog);
            affectedHabitNames.push(habit.name);
        }

        // Save all grace logs
        await HabitLog.insertMany(graceLogs);

        // Use the grace card (internal call)
        await axios.put(`${USER_SERVICE_URL}/api/users/${userId}/grace-cards`, {
            goldChange: -1
        });

        // Also restore any XP penalty that might have been applied
        const modeRules = {
            'DISCIPLINE': 0.2,
            'BALANCED': 0.1,
            'COMPETITIVE': 0.0
        };

        const penalty = modeRules[user.mode as keyof typeof modeRules] || 0;
        let xpRestored = 0;

        if (penalty > 0) {
            xpRestored = Math.floor(user.xp * penalty);
            if (xpRestored > 0) {
                await axios.put(`${USER_SERVICE_URL}/api/users/${userId}/xp`, {
                    xpToAdd: xpRestored
                }); // xpRestored is always positive (gold card restores XP)
            }
        }

        return {
            success: true,
            message: `Gold grace card used to protect all missed habits (${missedHabits.length}) for ${date.toDateString()}`,
            cardType: 'gold',
            affectedHabits: affectedHabitNames,
            streaksProtected: missedHabits.length,
            xpRestored
        };

    } catch (error: any) {
        console.error('Gold grace card usage error:', error);
        return {
            success: false,
            message: 'Failed to use gold grace card',
            cardType: 'gold'
        };
    }
}

/**
 * Get available grace cards for a user
 */
export async function getGraceCardStatus(userId: string) {
    try {
        const userResponse = await axios.get(`${USER_SERVICE_URL}/api/internal/users/${userId}`);
        const user = userResponse.data.data;
        
        return {
            success: true,
            data: {
                graceSilverCards: user.graceSilverCards || 0,
                graceGoldCards: user.graceGoldCards || 0,
                silverDescription: 'Protects one habit streak from decay',
                goldDescription: 'Protects all missed habits for a day and restores XP penalty'
            }
        };
    } catch (error: any) {
        console.error('Grace card status error:', error);
        return {
            success: false,
            message: 'Failed to get grace card status'
        };
    }
}

function getYesterday(): Date {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
}