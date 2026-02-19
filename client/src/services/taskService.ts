import api from "@/services/api"

export type TaskDifficulty = "EASY" | "MEDIUM" | "HARD" | "EPIC"

export const TASK_XP: Record<TaskDifficulty, number> = {
    EASY: 10,
    MEDIUM: 25,
    HARD: 50,
    EPIC: 100,
}

export interface Task {
    _id: string
    userId?: string
    title: string
    description?: string
    difficulty: TaskDifficulty
    isCompleted: boolean
    completedAt?: string
    xpEarned?: number
    createdAt?: string
    updatedAt?: string
}

export interface TaskStats {
    total: number
    completedToday: number
    xpEarnedToday: number
    pending: number
}

const taskService = {
    getTasks: async (): Promise<Task[]> => {
        try {
            const r = await api.get("/tasks")
            return r.data.data || r.data || []
        } catch { return [] }
    },

    getStats: async (): Promise<TaskStats> => {
        try {
            const r = await api.get("/tasks/stats")
            return r.data.data || { total: 0, completedToday: 0, xpEarnedToday: 0, pending: 0 }
        } catch { return { total: 0, completedToday: 0, xpEarnedToday: 0, pending: 0 } }
    },

    createTask: async (title: string, difficulty: TaskDifficulty, description?: string): Promise<Task> => {
        const r = await api.post("/tasks", { title, difficulty, description })
        return r.data.data || r.data
    },

    completeTask: async (taskId: string): Promise<{ task: Task; xpEarned: number }> => {
        const r = await api.post(`/tasks/${taskId}/complete`)
        return r.data.data || r.data
    },

    deleteTask: async (taskId: string): Promise<void> => {
        await api.delete(`/tasks/${taskId}`)
    },
}

export { taskService }
export default taskService
