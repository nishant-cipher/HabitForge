import mongoose, { Schema, Document } from 'mongoose';

export interface IAcceptedHabit extends Document {
    clubId: string;
    clubHabitId: string;
    userId: string;
    userHabitId: string; // Reference to the habit created in habit-service
    acceptedAt: Date;
}

const AcceptedHabitSchema = new Schema<IAcceptedHabit>({
    clubId: {
        type: String,
        required: true,
        index: true
    },
    clubHabitId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    userHabitId: {
        type: String,
        required: true
    },
    acceptedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure user can't accept same club habit twice
AcceptedHabitSchema.index({ clubHabitId: 1, userId: 1 }, { unique: true });
AcceptedHabitSchema.index({ clubId: 1, userId: 1 });

export const AcceptedHabit = mongoose.model<IAcceptedHabit>('AcceptedHabit', AcceptedHabitSchema);
