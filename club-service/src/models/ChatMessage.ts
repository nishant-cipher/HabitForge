import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
    clubId: string;
    userId: string;
    username: string;
    message: string;
    timestamp: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
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
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Index for efficient querying of recent messages
ChatMessageSchema.index({ clubId: 1, timestamp: -1 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
