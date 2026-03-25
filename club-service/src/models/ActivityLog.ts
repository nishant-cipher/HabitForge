import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
    clubId: string;
    userId: string;
    username: string;
    habitName: string;
    action: 'LOGGED' | 'JOINED' | 'LEFT' | 'ACCEPTED_TASK' | 'COMPLETED_HABIT';
    notes?: string;
    timestamp: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
    clubId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    habitName: {
        type: String
    },
    action: {
        type: String,
        required: true,
        enum: ['LOGGED', 'JOINED', 'LEFT', 'ACCEPTED_TASK', 'COMPLETED_HABIT']
    },
    notes: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Index for efficient querying of recent activity
ActivityLogSchema.index({ clubId: 1, timestamp: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
