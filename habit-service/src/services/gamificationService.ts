import { HabitLog, IHabitLog } from '../models/HabitLog';
import { UserStats } from '../models/UserStats';
import { Habit, TASK_XP } from '../models/Habit';
import axios from 'axios';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL as string;

// Mode-based rules (from shared constants)
const MODE_RULES = {
    DISCIPLINE: { canEditLogs: false, editWindowMinutes: 0, missedHabitPenalty: 0.2, strictDeadlines: true },
    BALANCED: { canEditLogs: true, editWindowMinutes: 120, missedHabitPenalty: 0.1, strictDeadlines: false },
    COMPETITIVE: { canEditLogs: false, editWindowMinutes: 0, missedHabitPenalty: 0, strictDeadlines: false, timeBonusEnabled: true }
};

/**
 * Calculate XP for habit completion
 */
function calculateXP(difficulty: number, streak: number, mode: string, completionTimeMinutes?: number): number {
    const BASE_XP = 10;
    const MAX_STREAK_BONUS = 2.0;
    const MODE_MULTIPLIERS: Record<string, number> = { DISCIPLINE: 1.5, BALANCED: 1.0, COMPETITIVE: 1.2 };

    let xp = BASE_XP;
    const difficultyMultiplier = 1.0 + ((difficulty - 1) / 4);
    xp *= difficultyMultiplier;
    const streakBonus = Math.min(1 + (streak / 100), MAX_STREAK_BONUS);
    xp *= streakBonus;
    xp *= MODE_MULTIPLIERS[mode] || 1.0;

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
    return 0;
}

/**
 * Award grace card via user service
 */
async function tryAwardGraceCard(userId: string, type: 'silver' | 'gold'): Promise<void> {
    try {
        await axios.post(`${USER_SERVICE_URL}/api/users/${userId}/award-grace-card`, { type });
    } catch (error) {
        console.error(`Failed to award ${type} grace card:`, error);
    }
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

    // If this is a task, use flat XP from difficulty (no streak logic)
    if (habit.isTask) {
        const taskXp = TASK_XP[habit.taskDifficulty || 'EASY'] || 10;
        const log = new HabitLog({
            habitId, userId,
            completedAt: new Date(),
            xpEarned: taskXp,
            streakAtCompletion: 0,
            modeAtCompletion: userMode,
            notes,
            canEdit: false
        });
        await log.save();
        // Mark task as completed
        await Habit.findByIdAndUpdate(habitId, { isTaskCompleted: true });
        // Update user XP
        try { await axios.put(`${USER_SERVICE_URL}/api/users/${userId}/xp`, { xpToAdd: taskXp }); } catch (e) { }
        return { log, xpEarned: taskXp };
    }

    // Calculate XP for regular habit
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
        await axios.put(`${USER_SERVICE_URL}/api/users/${userId}/xp`, { xpToAdd: xpEarned });
    } catch (error) {
        console.error('Failed to update user XP:', error);
    }

    // Award grace cards at streak milestones (7-day → silver, 15-day → gold)
    if (newStreak > 0 && newStreak % 15 === 0) {
        await tryAwardGraceCard(userId, 'gold');
    } else if (newStreak > 0 && newStreak % 7 === 0) {
        await tryAwardGraceCard(userId, 'silver');
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
