import { BehavioralMode } from '../types';

// Mode Multipliers
export const MODE_MULTIPLIERS = {
    [BehavioralMode.DISCIPLINE]: 1.5,
    [BehavioralMode.BALANCED]: 1.0,
    [BehavioralMode.COMPETITIVE]: 1.2
} as const;

// XP Configuration
export const XP_CONFIG = {
    BASE_XP: 10,
    MAX_STREAK_BONUS: 2.0,
    MAX_EFFICIENCY_BONUS: 1.3,
    DIFFICULTY_MULTIPLIER_MIN: 1.0,
    DIFFICULTY_MULTIPLIER_MAX: 2.0
} as const;

// Rate Limiting (requests per hour)
export const RATE_LIMITS = {
    [BehavioralMode.DISCIPLINE]: 100,
    [BehavioralMode.BALANCED]: 150,
    [BehavioralMode.COMPETITIVE]: 300
} as const;

// Mode-specific Rules
export const MODE_RULES = {
    [BehavioralMode.DISCIPLINE]: {
        canEditLogs: false,
        editWindowMinutes: 0,
        missedHabitPenalty: 0.2, // 20% XP penalty
        strictDeadlines: true
    },
    [BehavioralMode.BALANCED]: {
        canEditLogs: true,
        editWindowMinutes: 120, // 2 hours
        missedHabitPenalty: 0.1, // 10% XP penalty
        strictDeadlines: false
    },
    [BehavioralMode.COMPETITIVE]: {
        canEditLogs: false,
        editWindowMinutes: 0,
        missedHabitPenalty: 0,
        strictDeadlines: false,
        timeBonusEnabled: true
    }
} as const;

// Badge Thresholds
export const BADGE_THRESHOLDS = {
    STREAK_MILESTONES: [7, 30, 100, 365],
    XP_MILESTONES: [100, 500, 1000, 5000, 10000],
    COMPLETION_MILESTONES: [10, 50, 100, 500, 1000]
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
    USER_PROFILE: 300, // 5 minutes
    LEADERBOARD: 900, // 15 minutes
    ANALYTICS: 3600, // 1 hour
    HABIT_STATS: 600 // 10 minutes
} as const;

// JWT Configuration
export const JWT_CONFIG = {
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d'
} as const;

// Pagination
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
} as const;

// Level Calculation
export const LEVEL_CONFIG = {
    XP_PER_LEVEL: 100,
    XP_SCALING_FACTOR: 1.5
} as const;
