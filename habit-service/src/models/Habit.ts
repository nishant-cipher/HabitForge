import mongoose, { Schema, Document } from 'mongoose';

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

export enum TaskDifficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD',
    EPIC = 'EPIC'
}

export const TASK_XP: Record<string, number> = {
    EASY: 10,
    MEDIUM: 25,
    HARD: 50,
    EPIC: 100
};

export interface IHabit extends Document {
    userId: string;
    name: string;
    description?: string;
    category: HabitCategory;
    difficulty: number; // 1-5
    frequency: HabitFrequency;
    targetDays?: number[]; // For weekly habits: [0-6] (Sunday-Saturday)
    isActive: boolean;
    // Task fields
    isTask: boolean;
    taskDifficulty?: TaskDifficulty;
    isTaskCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const HabitSchema = new Schema<IHabit>({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    category: {
        type: String,
        enum: Object.values(HabitCategory),
        required: true
    },
    difficulty: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    frequency: {
        type: String,
        enum: Object.values(HabitFrequency),
        default: HabitFrequency.DAILY
    },
    targetDays: {
        type: [Number],
        validate: {
            validator: function (days: number[]) {
                return days.every(day => day >= 0 && day <= 6);
            },
            message: 'Target days must be between 0 (Sunday) and 6 (Saturday)'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isTask: {
        type: Boolean,
        default: false
    },
    taskDifficulty: {
        type: String,
        enum: Object.values(TaskDifficulty)
    },
    isTaskCompleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
HabitSchema.index({ userId: 1, isActive: 1 });
HabitSchema.index({ userId: 1, createdAt: -1 });

export const Habit = mongoose.model<IHabit>('Habit', HabitSchema);
