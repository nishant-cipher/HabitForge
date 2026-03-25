import mongoose, { Schema, Document } from 'mongoose';

export interface IClubHabit extends Document {
    clubId: string;
    name: string;
    description: string;
    category: string;
    difficulty: number;
    frequency: string;
    targetDays?: number[];
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
    targetDays: {
        type: [Number],
        validate: {
            validator: function (days: number[]) {
                return days.every(day => day >= 0 && day <= 6);
            },
            message: 'Target days must be between 0 (Sunday) and 6 (Saturday)'
        }
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
