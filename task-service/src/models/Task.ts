import mongoose, { Schema, Document } from 'mongoose';

export enum TaskDifficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD',
    EPIC = 'EPIC',
}

export enum TaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

export const TASK_XP: Record<TaskDifficulty, number> = {
    [TaskDifficulty.EASY]: 10,
    [TaskDifficulty.MEDIUM]: 25,
    [TaskDifficulty.HARD]: 50,
    [TaskDifficulty.EPIC]: 100,
};

export interface ITask extends Document {
    userId: string;
    title: string;
    description?: string;
    difficulty: TaskDifficulty;
    priority?: TaskPriority;
    deadline?: Date;
    reminder?: boolean;
    reminderAt?: Date;    // specific time to fire the reminder notification
    isCompleted: boolean;
    completedAt?: Date;
    xpEarned?: number;
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
    {
        userId: { type: String, required: true, index: true },
        title: { type: String, required: true, trim: true, maxlength: 100 },
        description: { type: String, trim: true, maxlength: 200 },
        difficulty: {
            type: String,
            enum: Object.values(TaskDifficulty),
            required: true,
            default: TaskDifficulty.MEDIUM,
        },
        priority: {
            type: String,
            enum: Object.values(TaskPriority),
            required: false,
        },
        deadline: { type: Date, required: false },
        reminder: { type: Boolean, default: false },
        reminderAt: { type: Date, required: false },
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date },
        xpEarned: { type: Number },
    },
    { timestamps: true }
);

TaskSchema.index({ userId: 1, createdAt: -1 });
TaskSchema.index({ userId: 1, isCompleted: 1 });
TaskSchema.index({ userId: 1, deadline: 1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);

