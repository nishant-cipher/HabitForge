import mongoose, { Schema, Document } from 'mongoose';

export interface IUserStats extends Document {
    userId: string;
    habitId: string;
    currentStreak: number;
    longestStreak: number;
    totalCompletions: number;
    lastCompletedAt?: Date;
    momentum: number; // 0-100 score
    updatedAt: Date;
}

const UserStatsSchema = new Schema<IUserStats>({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    habitId: {
        type: String,
        required: true,
        ref: 'Habit'
    },
    currentStreak: {
        type: Number,
        default: 0,
        min: 0
    },
    longestStreak: {
        type: Number,
        default: 0,
        min: 0
    },
    totalCompletions: {
        type: Number,
        default: 0,
        min: 0
    },
    lastCompletedAt: {
        type: Date
    },
    momentum: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});

// Indexes
UserStatsSchema.index({ userId: 1, habitId: 1 }, { unique: true });
UserStatsSchema.index({ userId: 1 });

export const UserStats = mongoose.model<IUserStats>('UserStats', UserStatsSchema);
