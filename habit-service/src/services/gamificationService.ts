import { HabitLog, IHabitLog } from '../models/HabitLog';
import { UserStats } from '../models/UserStats';
import { Habit } from '../models/Habit';
import axios from 'axios';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

// Mode-based rules (from shared constants)
const MODE_RULES = {
    DISCIPLINE: {
        canEditLogs: false,
        editWindowMinutes: 0,
        missedHabitPenalty: 0.2,
        strictDeadlines: true
    },
    BALANCED: {
        canEditLogs: true,
        editWindowMinutes: 120,
        missedHabitPenalty: 0.1,
        strictDeadlines: false
    },
    COMPETITIVE: {
        canEditLogs: false,
        editWindowMinutes: 0,
        missedHabitPenalty: 0,
        strictDeadlines: false,
        timeBonusEnabled: true
    }
};

/**
 * Calculate XP for habit completion
 */
function calculateXP(
    difficulty: number,
    streak: number,
    mode: string,
    completionTimeMinutes?: number
): number {
    const BASE_XP = 10;
    const MAX_STREAK_BONUS = 2.0;
    const MODE_MULTIPLIERS: Record<string, number> = {
        DISCIPLINE: 1.5,
        BALANCED: 1.0,
        COMPETITIVE: 1.2
    };

    let xp = BASE_XP;

    // Difficulty multiplier (1.0 to 2.0)
    const difficultyMultiplier = 1.0 + ((difficulty - 1) / 4);
    xp *= difficultyMultiplier;

    // Streak bonus (up to 2.0x)
    const streakBonus = Math.min(1 + (streak / 100), MAX_STREAK_BONUS);
    xp *= streakBonus;

    // Mode multiplier
    xp *= MODE_MULTIPLIERS[mode] || 1.0;

    // Efficiency bonus for competitive mode
    if (mode === 'COMPETITIVE' && completionTimeMinutes) {
        if (completionTimeMinutes <= 5) xp *= 1.3;
        else if (completionTimeMinutes <= 15) xp *= 1.2;
        else if (completionTimeMinutes <= 30) xp *= 1.1;
    }

    return Math.round(xp);
}

/**
 * Calculate streak decay
 */
function calculateStreakDecay(currentStreak: number, daysMissed: number): number {
    if (daysMissed === 0) return currentStreak;
    if (daysMissed === 1) return Math.max(0, currentStreak - 1);
    return 0; // More than 1 day missed = reset
}

/**
 * Log a habit completion
 */
export async function logHabitCompletion(
    habitId: string,
    userId: string,
    userMode: string,
    notes?: string,
    completionTimeMinutes?: number
): Promise<{ log: IHabitLog; xpEarned: number }> {
    // Get habit
    const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
    if (!habit) {
        throw new Error('Habit not found or inactive');
    }

    // Get or create user stats
    let stats = await UserStats.findOne({ userId, habitId });
    if (!stats) {
        stats = new UserStats({
            userId,
            habitId,
            currentStreak: 0,
            longestStreak: 0,
            totalCompletions: 0,
            momentum: 0
        });
    }

    // Check if already logged today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingLog = await HabitLog.findOne({
        habitId,
        userId,
        completedAt: { $gte: today }
    });

    if (existingLog) {
        throw new Error('Habit already logged today');
    }

    // Calculate streak
    const lastCompleted = stats.lastCompletedAt;
    let newStreak = stats.currentStreak;

    if (lastCompleted) {
        const daysSinceLastCompletion = Math.floor(
            (Date.now() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastCompletion === 1) {
            newStreak += 1; // Continue streak
        } else if (daysSinceLastCompletion > 1) {
            newStreak = calculateStreakDecay(newStreak, daysSinceLastCompletion);
        }
    } else {
        newStreak = 1; // First completion
    }

    // Calculate XP
    const xpEarned = calculateXP(
        habit.difficulty,
        newStreak,
        userMode,
        completionTimeMinutes
    );

    // Determine if log can be edited based on mode
    const modeRules = MODE_RULES[userMode as keyof typeof MODE_RULES] || MODE_RULES.BALANCED;
    const canEdit = modeRules.canEditLogs;

    // Create habit log
    const log = new HabitLog({
        habitId,
        userId,
        completedAt: new Date(),
        xpEarned,
        streakAtCompletion: newStreak,
        modeAtCompletion: userMode,
        notes,
        canEdit
    });

    await log.save();

    // Update stats
    stats.currentStreak = newStreak;
    stats.longestStreak = Math.max(stats.longestStreak, newStreak);
    stats.totalCompletions += 1;
    stats.lastCompletedAt = new Date();

    // Calculate momentum (last 7 days completion rate)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLogs = await HabitLog.countDocuments({
        habitId,
        userId,
        completedAt: { $gte: sevenDaysAgo }
    });
    stats.momentum = Math.round((recentLogs / 7) * 100);

    await stats.save();

    // Update user XP (call user service)
    try {
        await axios.put(`${USER_SERVICE_URL}/users/${userId}/xp`, {
            xpToAdd: xpEarned
        });
    } catch (error) {
        console.error('Failed to update user XP:', error);
        // Don't fail the entire operation if XP update fails
    }

    return { log, xpEarned };
}

/**
 * Get habit logs for a user
 */
export async function getHabitLogs(
    userId: string,
    habitId?: string,
    limit: number = 50
): Promise<IHabitLog[]> {
    const query: any = { userId };
    if (habitId) {
        query.habitId = habitId;
    }

    return HabitLog.find(query)
        .sort({ completedAt: -1 })
        .limit(limit);
}

/**
 * Get user stats for a habit
 */
export async function getHabitStats(userId: string, habitId: string) {
    return UserStats.findOne({ userId, habitId });
}

/**
 * Get all user stats
 */
export async function getAllUserStats(userId: string) {
    return UserStats.find({ userId });
}
