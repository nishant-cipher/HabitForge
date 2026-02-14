import mongoose, { Schema, Document } from 'mongoose';

export enum BadgeType {
    STREAK_MILESTONE = 'STREAK_MILESTONE',
    XP_MILESTONE = 'XP_MILESTONE',
    HABIT_COMPLETION = 'HABIT_COMPLETION',
    CONSISTENCY = 'CONSISTENCY',
    SPECIAL = 'SPECIAL'
}

export interface IBadge extends Document {
    userId: string;
    type: BadgeType;
    name: string;
    description: string;
    iconUrl?: string;
    earnedAt: Date;
    metadata?: Record<string, any>;
}

const BadgeSchema = new Schema<IBadge>({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    type: {
        type: String,
        enum: Object.values(BadgeType),
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    iconUrl: {
        type: String,
        trim: true
    },
    earnedAt: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: Schema.Types.Mixed
    }
}, {
    timestamps: false
});

// Indexes
BadgeSchema.index({ userId: 1, earnedAt: -1 });
BadgeSchema.index({ userId: 1, type: 1 });

export const Badge = mongoose.model<IBadge>('Badge', BadgeSchema);
