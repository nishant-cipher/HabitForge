import mongoose, { Schema, Document } from 'mongoose';

export interface IClub extends Document {
    name: string;
    description: string;
    ownerId: string;
    category: string;
    isPublic: boolean;
    inviteCode?: string;
    memberCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const ClubSchema = new Schema<IClub>({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    ownerId: {
        type: String,
        required: true,
        index: true
    },
    category: {
        type: String,
        default: 'OTHER'
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    inviteCode: {
        type: String,
        index: true,
        sparse: true
    },
    memberCount: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

// Indexes
ClubSchema.index({ name: 1 });
ClubSchema.index({ ownerId: 1 });
ClubSchema.index({ isPublic: 1 });

export const Club = mongoose.model<IClub>('Club', ClubSchema);
