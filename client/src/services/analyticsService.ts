import api from "@/services/api"

export interface AnalyticsTrend {
    date: string
    completions: number
    xpEarned: number
    habitsActive: number
}

const analyticsService = {
    getTrends: async (period: "WEEKLY" | "MONTHLY" | "YEARLY" = "MONTHLY"): Promise<AnalyticsTrend[]> => {
        try {
            const response = await api.get(`/analytics/trends?period=${period}`)
            return response.data.data || []
        } catch {
            return []
        }
    },

    getHabitAnalytics: async (): Promise<any> => {
        try {
            const response = await api.get("/analytics/habits")
            return response.data.data || {}
        } catch {
            return {}
        }
    },
}

export { analyticsService }
export default analyticsService
