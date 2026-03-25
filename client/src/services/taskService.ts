import api from "@/services/api"

export type TaskDifficulty = "EASY" | "MEDIUM" | "HARD" | "EPIC"
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export const TASK_XP: Record<TaskDifficulty, number> = {
    EASY: 10, MEDIUM: 25, HARD: 50, EPIC: 100,
}

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
    LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3,
}

export interface Task {
    _id: string
    userId?: string
    title: string
    description?: string
    difficulty: TaskDifficulty
    priority?: TaskPriority
    deadline?: string
    reminder?: boolean
    reminderAt?: string   // ISO string — specific time to fire notification
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

export interface CreateTaskParams {
    title: string
    difficulty: TaskDifficulty
    description?: string
    priority?: TaskPriority
    deadline?: string       // ISO date string or empty
    reminder?: boolean
    reminderAt?: string     // ISO date string — when to fire the notification
}

export interface UpdateTaskParams {
    title?: string
    description?: string
    difficulty?: TaskDifficulty
    priority?: TaskPriority | ""
    deadline?: string       // ISO date string or empty string to clear
    reminder?: boolean
    reminderAt?: string     // ISO date string or empty string to clear
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

    createTask: async (params: CreateTaskParams): Promise<Task> => {
        const r = await api.post("/tasks", params)
        return r.data.data || r.data
    },

    updateTask: async (taskId: string, params: UpdateTaskParams): Promise<Task> => {
        const r = await api.put(`/tasks/${taskId}`, params)
        return r.data.data || r.data
    },

    completeTask: async (taskId: string): Promise<{ task: Task; xpEarned: number }> => {
        const r = await api.post(`/tasks/${taskId}/complete`)
        return r.data.data || r.data
    },

    deleteTask: async (taskId: string): Promise<void> => {
        await api.delete(`/tasks/${taskId}`)
    },

    clearCompleted: async (): Promise<{ deletedCount: number }> => {
        const r = await api.delete('/tasks/completed')
        return r.data
    },
}

export { taskService }
export default taskService

