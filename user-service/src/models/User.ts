import mongoose, { Schema, Document } from 'mongoose';

export enum BehavioralMode {
    DISCIPLINE = 'DISCIPLINE',
    BALANCED = 'BALANCED',
    COMPETITIVE = 'COMPETITIVE'
}

export interface IUser extends Document {
    email: string;
    username: string;
    passwordHash: string;
    mode: BehavioralMode;
    xp: number;
    level: number;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    passwordHash: {
        type: String,
        required: true
    },
    mode: {
        type: String,
        enum: Object.values(BehavioralMode),
        default: BehavioralMode.BALANCED
    },
    xp: {
        type: Number,
        default: 0,
        min: 0
    },
    level: {
        type: Number,
        default: 1,
        min: 1
    }
}, {
    timestamps: true
});

// Index for faster lookups
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
