import mongoose, { Schema, Document } from 'mongoose';

export interface IClubHabit extends Document {
    clubId: string;
    name: string;
    description: string;
    category: string;
    difficulty: number;
    frequency: string;
    createdBy: string;
    createdAt: Date;
}

const ClubHabitSchema = new Schema<IClubHabit>({
    clubId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
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
        required: true,
        enum: ['DAILY', 'WEEKLY', 'CUSTOM']
    },
    createdBy: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

ClubHabitSchema.index({ clubId: 1, createdAt: -1 });

export const ClubHabit = mongoose.model<IClubHabit>('ClubHabit', ClubHabitSchema);
