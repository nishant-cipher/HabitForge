import mongoose, { Schema, Document } from 'mongoose';

export enum MemberRole {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER'
}

export interface IMembership extends Document {
    clubId: string;
    userId: string;
    username: string;
    role: MemberRole;
    joinedAt: Date;
}

const MembershipSchema = new Schema<IMembership>({
    clubId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    username: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: Object.values(MemberRole),
        default: MemberRole.MEMBER
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure unique membership
MembershipSchema.index({ clubId: 1, userId: 1 }, { unique: true });

export const Membership = mongoose.model<IMembership>('Membership', MembershipSchema);
