import mongoose, { Schema, Document } from 'mongoose';

export interface IUserAnalytics extends Document {
    userId: string;
    totalHabits: number;
    activeHabits: number;
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
    totalXP: number;
    level: number;
    lastUpdated: Date;
}

const UserAnalyticsSchema = new Schema<IUserAnalytics>({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    totalHabits: {
        type: Number,
        default: 0
    },
    activeHabits: {
        type: Number,
        default: 0
    },
    completionRate: {
        type: Number,
        default: 0
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
    },
    totalXP: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

export const UserAnalytics = mongoose.model<IUserAnalytics>('UserAnalytics', UserAnalyticsSchema);
