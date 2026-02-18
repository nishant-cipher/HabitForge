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
    isActive?: boolean
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
    currentStreak?: number
    longestStreak?: number
    totalXP?: number
    totalCompletions?: number
    level?: number
    lastCompletionDate?: string
    habitStats?: Array<{
        habitId: string
        name: string
        currentStreak: number
        totalCompletions: number
        lastCompleted?: string
    }>
}

const habitService = {
    getHabits: async (): Promise<Habit[]> => {
        const response = await api.get("/habits")
        return response.data.data || response.data || []
    },

    createHabit: async (data: Partial<Habit>): Promise<Habit> => {
        const response = await api.post("/habits", data)
        return response.data.data || response.data
    },

    updateHabit: async (id: string, data: Partial<Habit>): Promise<Habit> => {
        const response = await api.put(`/habits/${id}`, data)
        return response.data.data || response.data
    },

    deleteHabit: async (id: string): Promise<void> => {
        await api.delete(`/habits/${id}`)
    },

    logHabit: async (id: string, note?: string): Promise<any> => {
        const response = await api.post(`/gamification/${id}/log`, { note })
        return response.data.data || response.data
    },

    getStats: async (): Promise<UserStats> => {
        try {
            const response = await api.get("/gamification/stats/all")
            return response.data.data || {}
        } catch {
            return {}
        }
    },

    getLogs: async (): Promise<HabitLog[]> => {
        try {
            const response = await api.get("/gamification/logs/all")
            return response.data.data || []
        } catch {
            return []
        }
    },

    getHabitLogs: async (habitId: string): Promise<HabitLog[]> => {
        try {
            const response = await api.get(`/gamification/${habitId}/logs`)
            return response.data.data || []
        } catch {
            return []
        }
    },
}

export { habitService }
export default habitService
