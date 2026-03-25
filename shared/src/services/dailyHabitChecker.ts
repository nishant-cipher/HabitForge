import axios from 'axios';
import { MODE_RULES } from '../constants';
import { BehavioralMode } from '../types';

interface User {
    _id: string;
    mode: BehavioralMode;
    xp: number;
    graceSilverCards: number;
    graceGoldCards: number;
}

interface Habit {
    _id: string;
    userId: string;
    name: string;
    frequency: 'DAILY' | 'WEEKLY' | 'CUSTOM';
    targetDays?: number[];
    isActive: boolean;
    isTask: boolean;
    createdAt: Date;
}

interface UserStats {
    _id: string;
    userId: string;
    habitId: string;
    currentStreak: number;
    lastCompletedAt?: Date;
}

interface HabitLog {
    _id: string;
    userId: string;
    habitId: string;
    completedAt: Date;
    xpEarned: number;
}

export class DailyHabitChecker {
    private userServiceUrl: string;
    private habitServiceUrl: string;

    constructor(userServiceUrl: string, habitServiceUrl: string) {
        this.userServiceUrl = userServiceUrl;
        this.habitServiceUrl = habitServiceUrl;
    }

    /**
     * Main daily check function - should be called once per day
     */
    async performDailyCheck(): Promise<void> {
        console.log('[DailyHabitChecker] Starting daily habit check...');
        
        try {
            // Get all active users
            const users = await this.getAllUsers();
            console.log(`[DailyHabitChecker] Processing ${users.length} users`);

            for (const user of users) {
                await this.processUserHabits(user);
            }

            console.log('[DailyHabitChecker] Daily check completed successfully');
        } catch (error) {
            console.error('[DailyHabitChecker] Daily check failed:', error);
            throw error;
        }
    }

    /**
     * Process all habits for a single user
     */
    private async processUserHabits(user: User): Promise<void> {
        try {
            // Get user's active daily habits
            const habits = await this.getUserHabits(user._id);
            const dailyHabits = habits.filter(h => h.frequency === 'DAILY' && h.isActive && !h.isTask);

            if (dailyHabits.length === 0) {
                return; // No daily habits to check
            }

            // Get habit stats for all habits
            const habitStats = await this.getUserHabitStats(user._id);
            const statsMap = new Map(habitStats.map(stat => [stat.habitId, stat]));

            // Check yesterday's completions
            const yesterday = this.getYesterday();
            const yesterdayLogs = await this.getHabitLogsForDate(user._id, yesterday);
            const completedHabitIds = new Set(yesterdayLogs.map(log => log.habitId));

            let totalXpPenalty = 0;
            const missedHabits: Array<{habit: Habit, stat: UserStats}> = [];

            // Check each daily habit
            for (const habit of dailyHabits) {
                const stat = statsMap.get(habit._id);
                if (!stat) continue; // No stats yet, skip

                // Check if habit was completed yesterday
                if (!completedHabitIds.has(habit._id)) {
                    // Habit was missed
                    const modeRules = MODE_RULES[user.mode];
                    const penalty = modeRules.missedHabitPenalty;

                    if (penalty > 0) {
                        // Calculate XP penalty based on user's current XP
                        const xpPenalty = Math.floor(user.xp * penalty);
                        totalXpPenalty += xpPenalty;
                    }

                    missedHabits.push({ habit, stat });
                }
            }

            // Apply penalties if any
            if (totalXpPenalty > 0 || missedHabits.length > 0) {
                await this.applyPenalties(user, totalXpPenalty, missedHabits);
            }

        } catch (error) {
            console.error(`[DailyHabitChecker] Error processing user ${user._id}:`, error);
        }
    }

    /**
     * Apply XP and streak penalties, considering grace cards
     */
    private async applyPenalties(
        user: User, 
        xpPenalty: number, 
        missedHabits: Array<{habit: Habit, stat: UserStats}>
    ): Promise<void> {
        console.log(`[DailyHabitChecker] Applying penalties to user ${user._id}: XP(-${xpPenalty}), Missed(${missedHabits.length})`);

        let remainingXpPenalty = xpPenalty;
        let remainingSilverCards = user.graceSilverCards;
        let remainingGoldCards = user.graceGoldCards;

        // Try to use grace cards to reduce penalties
        const { adjustedXpPenalty, usedSilver, usedGold } = this.calculateGraceCardUsage(
            xpPenalty,
            missedHabits.length,
            remainingSilverCards,
            remainingGoldCards
        );

        // Apply adjusted XP penalty
        if (adjustedXpPenalty > 0) {
            await this.updateUserXp(user._id, -adjustedXpPenalty);
        }

        // Update grace cards if used
        if (usedSilver > 0 || usedGold > 0) {
            await this.updateUserGraceCards(user._id, -usedSilver, -usedGold);
        }

        // Apply streak decay to missed habits (considering grace card protection)
        const protectedHabits = Math.min(usedSilver + usedGold, missedHabits.length);
        const unprotectedHabits = missedHabits.slice(protectedHabits);

        for (const { stat } of unprotectedHabits) {
            const newStreak = Math.max(0, stat.currentStreak - 1);
            await this.updateHabitStreak(stat._id, newStreak);
        }

        // Log the penalty application
        console.log(`[DailyHabitChecker] Applied to user ${user._id}: XP(-${adjustedXpPenalty}), Silver(-${usedSilver}), Gold(-${usedGold}), Streaks affected(${unprotectedHabits.length})`);
    }

    /**
     * Calculate optimal grace card usage
     */
    private calculateGraceCardUsage(
        xpPenalty: number,
        missedHabitsCount: number,
        silverCards: number,
        goldCards: number
    ): { adjustedXpPenalty: number, usedSilver: number, usedGold: number } {
        let adjustedXpPenalty = xpPenalty;
        let usedSilver = 0;
        let usedGold = 0;

        // Gold cards can forgive entire day (all XP penalty and protect all streaks)
        if (goldCards > 0 && (xpPenalty > 0 || missedHabitsCount > 0)) {
            usedGold = 1;
            adjustedXpPenalty = 0; // Gold card forgives all XP penalty
            // Gold card also protects all streaks for the day
        } else {
            // Use silver cards for individual habit protection
            const silverToUse = Math.min(silverCards, missedHabitsCount);
            usedSilver = silverToUse;
            // Silver cards don't reduce XP penalty, only protect streaks
        }

        return { adjustedXpPenalty, usedSilver, usedGold };
    }

    /**
     * Helper methods for API calls
     */
    private async getAllUsers(): Promise<User[]> {
        const response = await axios.get(`${this.userServiceUrl}/api/internal/users`);
        return response.data.data || response.data;
    }

    private async getUserHabits(userId: string): Promise<Habit[]> {
        const response = await axios.get(`${this.habitServiceUrl}/api/internal/habits?userId=${userId}`);
        return response.data.data || response.data;
    }

    private async getUserHabitStats(userId: string): Promise<UserStats[]> {
        const response = await axios.get(`${this.habitServiceUrl}/api/internal/stats?userId=${userId}`);
        return response.data.data || response.data;
    }

    private async getHabitLogsForDate(userId: string, date: Date): Promise<HabitLog[]> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const response = await axios.get(
            `${this.habitServiceUrl}/api/internal/logs?userId=${userId}&from=${startOfDay.toISOString()}&to=${endOfDay.toISOString()}`
        );
        return response.data.data || response.data;
    }

    private async updateUserXp(userId: string, xpChange: number): Promise<void> {
        await axios.put(`${this.userServiceUrl}/api/users/${userId}/xp`, {
            xpToAdd: xpChange
        });
    }

    private async updateUserGraceCards(userId: string, silverChange: number, goldChange: number): Promise<void> {
        await axios.put(`${this.userServiceUrl}/api/users/${userId}/grace-cards`, {
            silverChange,
            goldChange
        });
    }

    private async updateHabitStreak(statId: string, newStreak: number): Promise<void> {
        await axios.put(`${this.habitServiceUrl}/api/internal/stats/${statId}`, {
            currentStreak: newStreak
        });
    }

    private getYesterday(): Date {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
    }
}

// Singleton instance
export const dailyHabitChecker = new DailyHabitChecker(
    process.env.USER_SERVICE_URL || 'http://user-service:4001',
    process.env.HABIT_SERVICE_URL || 'http://habit-service:4002'
);