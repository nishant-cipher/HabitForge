import api from "@/services/api"

export interface Habit {
    _id: string
    name: string
    description?: string
    category: string
    frequency: string
    targetValue?: number
    difficulty?: number
    currentStreak?: number
    longestStreak?: number
    totalCompletions?: number
    xpValue?: number
    targetDays?: number[]
    isActive?: boolean
    isTask?: boolean
    createdAt?: string
}

export interface HabitLog {
    _id: string
    habitId: string
    userId: string
    completedAt: string
    xpEarned?: number
    note?: string
}

export interface UserStats {
    userId?: string
    habitId?: string
    currentStreak?: number
    longestStreak?: number
    totalCompletions?: number
    momentum?: number
    lastCompletedAt?: string
}

const habitService = {
    getHabits: async (): Promise<Habit[]> => {
        const response = await api.get("/habits")
        const all = response.data.data || response.data || []
        return all.filter((h: any) => !h.isTask)
    },

    createHabit: async (data: Partial<Habit>): Promise<Habit> => {
        const response = await api.post("/habits", data)
        return response.data.data || response.data
    },

    updateHabit: async (habitId: string, data: Partial<Habit>): Promise<Habit> => {
        const response = await api.put(`/habits/${habitId}`, data)
        return response.data.data || response.data
    },

    deleteHabit: async (habitId: string): Promise<void> => {
        await api.delete(`/habits/${habitId}`)
    },

    logHabit: async (habitId: string, notes?: string): Promise<{ log: HabitLog; xpEarned: number }> => {
        const response = await api.post(`/habits/${habitId}/log`, { notes })
        return response.data.data || response.data
    },

    getHabitLogs: async (habitId?: string): Promise<HabitLog[]> => {
        const url = habitId ? `/habits/${habitId}/logs` : "/habits/logs"
        const response = await api.get(url)
        return response.data.data || response.data || []
    },

    getHabitStats: async (habitId: string) => {
        const response = await api.get(`/habits/${habitId}/stats`)
        return response.data.data || response.data
    },

    getAllStats: async () => {
        const response = await api.get("/habits/stats")
        return response.data.data || response.data || []
    },

    // Grace card — calls user-service via gateway
    useGraceCard: async (type: "silver" | "gold"): Promise<{ graceSilverCards: number; graceGoldCards: number }> => {
        const response = await api.post("/users/me/use-grace-card", { type })
        return response.data.data || response.data
    },
}

export { habitService }
export default habitService
