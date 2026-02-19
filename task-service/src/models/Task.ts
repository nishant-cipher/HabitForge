import mongoose, { Schema, Document } from 'mongoose';

export enum TaskDifficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD',
    EPIC = 'EPIC',
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
    isCompleted: boolean;
    completedAt?: Date;
    xpEarned?: number;
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
    {
        userId: { type: String, required: true, index: true },
        title: { type: String, required: true, trim: true, maxlength: 200 },
        description: { type: String, trim: true, maxlength: 500 },
        difficulty: {
            type: String,
            enum: Object.values(TaskDifficulty),
            required: true,
            default: TaskDifficulty.MEDIUM,
        },
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date },
        xpEarned: { type: Number },
    },
    { timestamps: true }
);

TaskSchema.index({ userId: 1, createdAt: -1 });
TaskSchema.index({ userId: 1, isCompleted: 1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
