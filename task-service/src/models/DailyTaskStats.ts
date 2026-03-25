import mongoose, { Schema, Document } from 'mongoose';

/**
 * Stores per-user daily task completion counts and XP totals.
 * Updated on each task completion. Persists even after tasks are cleared.
 * Keyed on userId + dateStr (YYYY-MM-DD in UTC).
 */
export interface IDailyTaskStats extends Document {
    userId: string;
    dateStr: string;       // YYYY-MM-DD
    completedCount: number;
    xpEarned: number;
}

const DailyTaskStatsSchema = new Schema<IDailyTaskStats>({
    userId: { type: String, required: true, index: true },
    dateStr: { type: String, required: true },
    completedCount: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
}, { timestamps: false });

DailyTaskStatsSchema.index({ userId: 1, dateStr: 1 }, { unique: true });

export const DailyTaskStats = mongoose.model<IDailyTaskStats>('DailyTaskStats', DailyTaskStatsSchema);
