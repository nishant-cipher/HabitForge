export interface Habit {
    _id: string;
    userId: string;
    name: string;
    category: "Health" | "Productivity" | "Learning" | "Social" | "Other";
    frequency: "Daily" | "Weekly";
    streak: number;
    totalCompletions: number;
    createdAt: string;
    updatedAt: string;
    lastCompleted?: string;
}

export interface CreateHabitInput {
    name: string;
    category: string;
    frequency: string;
}

export interface UpdateHabitInput {
    name?: string;
    category?: string;
    frequency?: string;
}
