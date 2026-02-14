// Behavioral Modes
export enum BehavioralMode {
    DISCIPLINE = 'DISCIPLINE',
    BALANCED = 'BALANCED',
    COMPETITIVE = 'COMPETITIVE'
}

// User Types
export interface IUser {
    _id: string;
    email: string;
    username: string;
    passwordHash: string;
    mode: BehavioralMode;
    xp: number;
    level: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserProfile {
    _id: string;
    email: string;
    username: string;
    mode: BehavioralMode;
    xp: number;
    level: number;
    createdAt: Date;
}

export interface ISession {
    _id: string;
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    createdAt: Date;
}

// Habit Types
export enum HabitCategory {
    HEALTH = 'HEALTH',
    PRODUCTIVITY = 'PRODUCTIVITY',
    LEARNING = 'LEARNING',
    SOCIAL = 'SOCIAL',
    FINANCE = 'FINANCE',
    MINDFULNESS = 'MINDFULNESS',
    OTHER = 'OTHER'
}

export enum HabitFrequency {
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    CUSTOM = 'CUSTOM'
}

export interface IHabit {
    _id: string;
    userId: string;
    name: string;
    description?: string;
    category: HabitCategory;
    difficulty: number; // 1-5
    frequency: HabitFrequency;
    targetDays?: number[]; // For weekly habits: [0-6] (Sunday-Saturday)
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IHabitLog {
    _id: string;
    habitId: string;
    userId: string;
    completedAt: Date;
    xpEarned: number;
    streakAtCompletion: number;
    modeAtCompletion: BehavioralMode;
    notes?: string;
    createdAt: Date;
    canEdit: boolean; // Based on mode rules
}

export interface IUserStats {
    _id: string;
    userId: string;
    habitId: string;
    currentStreak: number;
    longestStreak: number;
    totalCompletions: number;
    lastCompletedAt?: Date;
    momentum: number; // 0-100 score
    updatedAt: Date;
}

// Badge Types
export enum BadgeType {
    STREAK_MILESTONE = 'STREAK_MILESTONE',
    XP_MILESTONE = 'XP_MILESTONE',
    HABIT_COMPLETION = 'HABIT_COMPLETION',
    CONSISTENCY = 'CONSISTENCY',
    SPECIAL = 'SPECIAL'
}

export interface IBadge {
    _id: string;
    userId: string;
    type: BadgeType;
    name: string;
    description: string;
    iconUrl?: string;
    earnedAt: Date;
    metadata?: Record<string, any>;
}

// Club Types
export enum ClubVisibility {
    PUBLIC = 'PUBLIC',
    PRIVATE = 'PRIVATE',
    INVITE_ONLY = 'INVITE_ONLY'
}

export enum ClubRole {
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER'
}

export interface IClub {
    _id: string;
    name: string;
    description?: string;
    visibility: ClubVisibility;
    createdBy: string;
    memberCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMembership {
    _id: string;
    clubId: string;
    userId: string;
    role: ClubRole;
    joinedAt: Date;
}

export interface ILeaderboardEntry {
    userId: string;
    username: string;
    xp: number;
    level: number;
    rank: number;
}

export interface ILeaderboard {
    _id: string;
    clubId?: string; // null for global leaderboard
    period: 'daily' | 'weekly' | 'monthly' | 'alltime';
    entries: ILeaderboardEntry[];
    updatedAt: Date;
}

// Analytics Types
export interface IAnalyticsCache {
    _id: string;
    userId: string;
    dataType: string;
    data: Record<string, any>;
    expiresAt: Date;
    createdAt: Date;
}

export interface IHabitTrend {
    date: string;
    completions: number;
    xpEarned: number;
}

export interface IDashboardData {
    totalXp: number;
    level: number;
    activeHabits: number;
    completionRate: number;
    currentStreaks: Array<{
        habitName: string;
        streak: number;
    }>;
    recentActivity: IHabitLog[];
    weeklyTrend: IHabitTrend[];
}
