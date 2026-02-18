import api from "@/services/api"

export interface Club {
    _id: string
    name: string
    description?: string
    category?: string
    memberCount?: number
    avgConsistency?: number
    isPublic?: boolean
    createdBy?: string
    members?: string[]
    createdAt?: string
}

const clubService = {
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
            const response = await api.get("/clubs/my")
            return response.data.data || response.data || []
        } catch {
            return []
        }
    },

    createClub: async (data: Partial<Club>): Promise<Club> => {
        const response = await api.post("/clubs", data)
        return response.data.data || response.data
    },

    joinClub: async (clubId: string): Promise<void> => {
        await api.post(`/clubs/${clubId}/join`)
    },

    leaveClub: async (clubId: string): Promise<void> => {
        await api.post(`/clubs/${clubId}/leave`)
    },

    getClub: async (clubId: string): Promise<Club> => {
        const response = await api.get(`/clubs/${clubId}`)
        return response.data.data || response.data
    },
}

export { clubService }
export default clubService
