import api from "@/services/api"

export interface Club {
    _id: string
    name: string
    description?: string
    category?: string
    memberCount?: number
    avgConsistency?: number
    isPublic?: boolean
    inviteCode?: string
    ownerId?: string
    createdBy?: string
    members?: string[]
    createdAt?: string
    role?: string
}

export interface ClubMember {
    _id: string
    userId: string
    username: string
    role: string
    joinedAt?: string
    currentStreak?: number
    totalCompletions?: number
}

export interface ClubHabit {
    _id: string
    clubId: string
    name: string
    description?: string
    category?: string
    frequency?: string
    difficulty?: number
    createdBy?: string
    createdAt?: string
}

export interface LeaderboardEntry {
    rank: number
    userId: string
    username: string
    completions: number
}

const clubService = {
    getPublicClubs: async (): Promise<Club[]> => {
        try {
            const response = await api.get("/clubs/public")
            return response.data.data || response.data || []
        } catch {
            return []
        }
    },

    getClubs: async (): Promise<Club[]> => {
        try {
            const response = await api.get("/clubs")
            return response.data.data || response.data || []
        } catch {
            return []
        }
    },

    getMyClubs: async (): Promise<Club[]> => {
        try {
            const response = await api.get("/clubs")
            return response.data.data || response.data || []
        } catch {
            return []
        }
    },

    getClub: async (clubId: string): Promise<Club> => {
        const response = await api.get(`/clubs/${clubId}`)
        return response.data.data || response.data
    },

    getClubMembers: async (clubId: string): Promise<ClubMember[]> => {
        try {
            const response = await api.get(`/clubs/${clubId}/members`)
            return response.data.data || response.data || []
        } catch {
            return []
        }
    },

    getClubHabits: async (clubId: string): Promise<ClubHabit[]> => {
        try {
            const response = await api.get(`/clubs/${clubId}/habits`)
            return response.data.data || response.data || []
        } catch {
            return []
        }
    },

    acceptClubHabit: async (clubId: string, habitId: string): Promise<void> => {
        await api.post(`/clubs/${clubId}/habits/${habitId}/accept`)
    },

    logClubHabit: async (clubId: string, habitId: string): Promise<{ userHabitId: string; xpEarned: number }> => {
        const response = await api.post(`/clubs/${clubId}/habits/${habitId}/log`)
        return response.data.data || response.data
    },

    addClubHabit: async (clubId: string, data: Partial<ClubHabit>): Promise<ClubHabit> => {
        const response = await api.post(`/clubs/${clubId}/habits`, data)
        return response.data.data || response.data
    },

    deleteClubHabit: async (clubId: string, habitId: string): Promise<void> => {
        await api.delete(`/clubs/${clubId}/habits/${habitId}`)
    },

    getClubInviteCode: async (clubId: string): Promise<string> => {
        const response = await api.get(`/clubs/${clubId}/invite-code`)
        return (response.data.data || response.data).inviteCode
    },

    createClub: async (data: Partial<Club>): Promise<Club> => {
        const response = await api.post("/clubs", data)
        return response.data.data || response.data
    },

    joinClub: async (clubId: string, inviteCode?: string): Promise<void> => {
        await api.post(`/clubs/${clubId}/join`, inviteCode ? { inviteCode } : {})
    },

    joinByInviteCode: async (inviteCode: string): Promise<Club> => {
        const response = await api.post("/clubs/join-by-code", { inviteCode })
        return response.data.data || response.data
    },

    getLeaderboard: async (clubId: string): Promise<LeaderboardEntry[]> => {
        try {
            const response = await api.get(`/clubs/${clubId}/leaderboard`)
            return response.data.data || []
        } catch {
            return []
        }
    },

    leaveClub: async (clubId: string): Promise<void> => {
        await api.post(`/clubs/${clubId}/leave`)
    },

    updateClub: async (clubId: string, data: { name?: string; description?: string; isPublic?: boolean }): Promise<Club> => {
        const response = await api.put(`/clubs/${clubId}`, data)
        return response.data.data || response.data
    },

    deleteClub: async (clubId: string): Promise<void> => {
        await api.delete(`/clubs/${clubId}`)
    },
}

export { clubService }
export default clubService
