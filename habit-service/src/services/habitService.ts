import { Habit, IHabit, HabitCategory, HabitFrequency, TaskDifficulty } from '../models/Habit';
import { UserStats } from '../models/UserStats';

export interface CreateHabitData {
    userId: string;
    name: string;
    description?: string;
    category: HabitCategory;
    difficulty: number;
    frequency?: HabitFrequency;
    targetDays?: number[];
    isTask?: boolean;
    taskDifficulty?: TaskDifficulty;
    isTaskCompleted?: boolean;
}

export interface UpdateHabitData {
    name?: string;
    description?: string;
    category?: HabitCategory;
    difficulty?: number;
    frequency?: HabitFrequency;
    targetDays?: number[];
    isActive?: boolean;
}

/**
 * Create a new habit
 */
export async function createHabit(data: CreateHabitData): Promise<IHabit> {
    const habit = new Habit({
        userId: data.userId,
        name: data.name,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty,
        frequency: data.frequency || HabitFrequency.DAILY,
        targetDays: data.targetDays,
        isActive: true,
        isTask: data.isTask || false,
        taskDifficulty: data.taskDifficulty,
        isTaskCompleted: data.isTaskCompleted || false,
    });

    await habit.save();
    return habit;
}

/**
 * Get all habits for a user, enriched with streak data from UserStats
 */
export async function getUserHabits(
    userId: string,
    activeOnly: boolean = true
): Promise<any[]> {
    const query: any = { userId };
    if (activeOnly) {
        query.isActive = true;
    }

    const habits = await Habit.find(query).sort({ createdAt: -1 });
    if (habits.length === 0) return [];

    // Fetch all stats for this user in one query
    const habitIds = habits.map(h => h._id.toString());
    const statsArr = await UserStats.find({ userId, habitId: { $in: habitIds } });
    const statsMap = new Map(statsArr.map(s => [s.habitId, s]));

    // Enrich each habit with streak data
    return habits.map(h => {
        const stats = statsMap.get(h._id.toString());
        const obj = h.toObject() as any;
        obj.currentStreak = stats?.currentStreak ?? 0;
        obj.longestStreak = stats?.longestStreak ?? 0;
        obj.totalCompletions = stats?.totalCompletions ?? 0;
        obj.momentum = stats?.momentum ?? 0;
        return obj;
    });
}

/**
 * Get a single habit by ID
 */
export async function getHabitById(
    habitId: string,
    userId: string
): Promise<IHabit | null> {
    return Habit.findOne({ _id: habitId, userId });
}

/**
 * Update a habit
 */
export async function updateHabit(
    habitId: string,
    userId: string,
    updates: UpdateHabitData
): Promise<IHabit | null> {
    return Habit.findOneAndUpdate(
        { _id: habitId, userId },
        { $set: updates },
        { new: true }
    );
}

/**
 * Delete a habit (soft delete by setting isActive to false)
 */
export async function deleteHabit(
    habitId: string,
    userId: string
): Promise<IHabit | null> {
    return Habit.findOneAndUpdate(
        { _id: habitId, userId },
        { $set: { isActive: false } },
        { new: true }
    );
}

/**
 * Get habits by category
 */
export async function getHabitsByCategory(
    userId: string,
    category: HabitCategory
): Promise<IHabit[]> {
    return Habit.find({
        userId,
        category,
        isActive: true
    }).sort({ createdAt: -1 });
}
