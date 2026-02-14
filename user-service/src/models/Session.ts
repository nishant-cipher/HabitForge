import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    createdAt: Date;
}

const SessionSchema = new Schema<ISession>({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Index for faster lookups and automatic cleanup
SessionSchema.index({ userId: 1 });
SessionSchema.index({ refreshToken: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const Session = mongoose.model<ISession>('Session', SessionSchema);
