import { XP_CONFIG, MODE_MULTIPLIERS, LEVEL_CONFIG } from '../constants';
import { BehavioralMode } from '../types';

/**
 * Calculate XP earned for completing a habit
 */
export function calculateXP(
    difficulty: number,
    streak: number,
    mode: BehavioralMode,
    completionTimeMinutes?: number
): number {
    // Base XP
    let xp = XP_CONFIG.BASE_XP;

    // Difficulty multiplier (1.0 to 2.0)
    const difficultyMultiplier =
        XP_CONFIG.DIFFICULTY_MULTIPLIER_MIN +
        ((difficulty - 1) / 4) * (XP_CONFIG.DIFFICULTY_MULTIPLIER_MAX - XP_CONFIG.DIFFICULTY_MULTIPLIER_MIN);
    xp *= difficultyMultiplier;

    // Streak bonus (up to 2.0x)
    const streakBonus = Math.min(1 + (streak / 100), XP_CONFIG.MAX_STREAK_BONUS);
    xp *= streakBonus;

    // Mode multiplier
    xp *= MODE_MULTIPLIERS[mode];

    // Efficiency bonus for competitive mode
    if (mode === BehavioralMode.COMPETITIVE && completionTimeMinutes) {
        const efficiencyBonus = calculateEfficiencyBonus(completionTimeMinutes);
        xp *= efficiencyBonus;
    }

    return Math.round(xp);
}

/**
 * Calculate efficiency bonus based on completion time
 * Faster completion = higher bonus (up to 1.3x)
 */
function calculateEfficiencyBonus(completionTimeMinutes: number): number {
    if (completionTimeMinutes <= 5) return XP_CONFIG.MAX_EFFICIENCY_BONUS;
    if (completionTimeMinutes <= 15) return 1.2;
    if (completionTimeMinutes <= 30) return 1.1;
    return 1.0;
}

/**
 * Calculate user level from total XP
 */
export function calculateLevel(totalXP: number): number {
    // Level = floor(sqrt(totalXP / XP_PER_LEVEL))
    return Math.floor(Math.sqrt(totalXP / LEVEL_CONFIG.XP_PER_LEVEL));
}

/**
 * Calculate XP required for next level
 */
export function xpForNextLevel(currentLevel: number): number {
    const nextLevel = currentLevel + 1;
    return Math.pow(nextLevel, 2) * LEVEL_CONFIG.XP_PER_LEVEL;
}

/**
 * Calculate XP progress to next level
 */
export function xpProgress(totalXP: number): {
    currentLevel: number;
    currentLevelXP: number;
    nextLevelXP: number;
    progress: number; // 0-100
} {
    const currentLevel = calculateLevel(totalXP);
    const currentLevelXP = Math.pow(currentLevel, 2) * LEVEL_CONFIG.XP_PER_LEVEL;
    const nextLevelXP = xpForNextLevel(currentLevel);
    const xpInCurrentLevel = totalXP - currentLevelXP;
    const xpNeededForLevel = nextLevelXP - currentLevelXP;
    const progress = Math.round((xpInCurrentLevel / xpNeededForLevel) * 100);

    return {
        currentLevel,
        currentLevelXP,
        nextLevelXP,
        progress
    };
}

/**
 * Calculate momentum score (0-100) based on recent activity
 */
export function calculateMomentum(
    recentCompletions: number,
    totalPossibleCompletions: number
): number {
    if (totalPossibleCompletions === 0) return 0;
    const completionRate = recentCompletions / totalPossibleCompletions;
    return Math.round(completionRate * 100);
}

/**
 * Calculate streak decay
 * Returns new streak value after decay
 */
export function calculateStreakDecay(
    currentStreak: number,
    daysMissed: number
): number {
    if (daysMissed === 0) return currentStreak;
    if (daysMissed === 1) return Math.max(0, currentStreak - 1);
    // More than 1 day missed = reset streak
    return 0;
}
