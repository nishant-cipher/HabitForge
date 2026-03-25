import mongoose, { Schema, Document } from 'mongoose';

export interface IHabitLog extends Document {
    habitId: string;
    userId: string;
    completedAt: Date;
    xpEarned: number;
    streakAtCompletion: number;
    modeAtCompletion: string;
    notes?: string;
    canEdit: boolean;
    isGraceCard?: boolean;
    graceCardType?: 'silver' | 'gold';
    createdAt: Date;
    updatedAt: Date;
}

const HabitLogSchema = new Schema<IHabitLog>({
    habitId: {
        type: String,
        required: true,
        ref: 'Habit'
    },
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    completedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    xpEarned: {
        type: Number,
        required: true,
        min: 0
    },
    streakAtCompletion: {
        type: Number,
        required: true,
        min: 0
    },
    modeAtCompletion: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    canEdit: {
        type: Boolean,
        default: false
    },
    isGraceCard: {
        type: Boolean,
        default: false
    },
    graceCardType: {
        type: String,
        enum: ['silver', 'gold'],
        required: false
    }
}, {
    timestamps: true
});

// Indexes
HabitLogSchema.index({ habitId: 1, completedAt: -1 });
HabitLogSchema.index({ userId: 1, completedAt: -1 });
HabitLogSchema.index({ userId: 1, habitId: 1, completedAt: -1 });

// Prevent duplicate logs for the same habit on the same day
HabitLogSchema.index(
    { habitId: 1, completedAt: 1 },
    {
        unique: true,
        partialFilterExpression: {
            completedAt: { $type: 'date' }
        }
    }
);

export const HabitLog = mongoose.model<IHabitLog>('HabitLog', HabitLogSchema);
