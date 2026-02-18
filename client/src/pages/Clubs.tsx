import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { clubService, type Club } from "@/services/clubService"
import { Users, Plus, Trophy, TrendingUp, X } from "lucide-react"

const categoryColors: Record<string, string> = {
    FITNESS: "#13ec6a", LEARNING: "#3b82f6", PRODUCTIVITY: "#f59e0b",
    MINDFULNESS: "#8b5cf6", SOCIAL: "#ec4899", OTHER: "#6b7280",
}

export function Clubs() {
    const queryClient = useQueryClient()
    const [showCreate, setShowCreate] = useState(false)
    const [form, setForm] = useState({ name: "", description: "", category: "FITNESS", isPublic: true })

    const { data: clubs = [], isLoading } = useQuery({
        queryKey: ["clubs"],
        queryFn: clubService.getClubs,
    })

    const createMutation = useMutation({
        mutationFn: (data: Partial<Club>) => clubService.createClub(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clubs"] })
            setShowCreate(false)
            setForm({ name: "", description: "", category: "FITNESS", isPublic: true })
        },
    })

    const joinMutation = useMutation({
        mutationFn: (id: string) => clubService.joinClub(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clubs"] }),
    })

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "hsl(150 10% 95%)" }}>
                        Explore Clubs
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "hsl(150 10% 50%)" }}>
                        Join accountability groups and compete with others
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}
                >
                    <Plus className="h-4 w-4" /> Create Club
                </button>
            </div>

            {/* Create Club Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
                    <div className="surface-card p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold" style={{ color: "hsl(150 10% 90%)" }}>Create a New Club</h2>
                            <button onClick={() => setShowCreate(false)} style={{ color: "hsl(150 10% 50%)" }}>
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form) }} className="flex flex-col gap-3">
                            <div>
                                <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Club Name *</label>
                                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Early Risers Club"
                                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                    style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Description</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="What's this club about?"
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                                    style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Category</label>
                                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                    style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}>
                                    {Object.keys(categoryColors).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button type="submit" disabled={createMutation.isPending}
                                    className="flex-1 py-2 rounded-lg text-sm font-semibold"
                                    style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}>
                                    {createMutation.isPending ? "Creating..." : "Create Club"}
                                </button>
                                <button type="button" onClick={() => setShowCreate(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold"
                                    style={{ background: "hsl(150 15% 12%)", color: "hsl(150 10% 70%)" }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Clubs Grid */}
            {isLoading ? (
                <div className="text-sm" style={{ color: "hsl(150 10% 40%)" }}>Loading clubs...</div>
            ) : clubs.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Placeholder clubs */}
                    {[
                        { name: "The 5AM Club", category: "FITNESS", desc: "Rise before the sun. Build the discipline of champions.", members: 1247, consistency: 87 },
                        { name: "Deep Work Warriors", category: "PRODUCTIVITY", desc: "Master focused work sessions. No distractions allowed.", members: 892, consistency: 91 },
                        { name: "Cold Shower Collective", category: "MINDFULNESS", desc: "Embrace discomfort. Build mental fortitude daily.", members: 634, consistency: 78 },
                        { name: "Digital Minimalism", category: "MINDFULNESS", desc: "Reclaim your attention. Less screen time, more life.", members: 421, consistency: 83 },
                        { name: "Readers United", category: "LEARNING", desc: "30 pages a day keeps ignorance away.", members: 1089, consistency: 72 },
                        { name: "Runners United", category: "FITNESS", desc: "Every mile counts. Every step matters.", members: 756, consistency: 85 },
                    ].map((club) => (
                        <div key={club.name} className="surface-card p-5 flex flex-col gap-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-sm" style={{ color: "hsl(150 10% 90%)" }}>{club.name}</h3>
                                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block"
                                        style={{ background: `${categoryColors[club.category]}18`, color: categoryColors[club.category] }}>
                                        {club.category}
                                    </span>
                                </div>
                                <Trophy className="h-4 w-4 flex-shrink-0" style={{ color: "#f59e0b" }} />
                            </div>
                            <p className="text-xs" style={{ color: "hsl(150 10% 50%)" }}>{club.desc}</p>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-xs" style={{ color: "hsl(150 10% 50%)" }}>
                                    <Users className="h-3 w-3" /> {club.members.toLocaleString()} members
                                </div>
                                <div className="flex items-center gap-1 text-xs" style={{ color: "var(--green)" }}>
                                    <TrendingUp className="h-3 w-3" /> {club.consistency}% avg consistency
                                </div>
                            </div>
                            <button className="w-full py-2 rounded-lg text-xs font-semibold transition-all mt-1"
                                style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(19,236,106,0.2)" }}>
                                Join Club
                            </button>
                        </div>
                    ))}
                    {/* Create CTA */}
                    <div className="surface-card p-5 flex flex-col items-center justify-center gap-3 text-center cursor-pointer"
                        style={{ border: "1px dashed hsl(150 15% 18%)" }}
                        onClick={() => setShowCreate(true)}>
                        <div className="h-10 w-10 rounded-full flex items-center justify-center"
                            style={{ background: "var(--green-dim)" }}>
                            <Plus className="h-5 w-5" style={{ color: "var(--green)" }} />
                        </div>
                        <div>
                            <div className="text-sm font-bold" style={{ color: "hsl(150 10% 80%)" }}>Can't find your tribe?</div>
                            <div className="text-xs mt-1" style={{ color: "hsl(150 10% 45%)" }}>Create a custom club and invite members</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clubs.map((club: Club) => (
                        <div key={club._id} className="surface-card p-5 flex flex-col gap-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-sm" style={{ color: "hsl(150 10% 90%)" }}>{club.name}</h3>
                                    {club.category && (
                                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block"
                                            style={{ background: `${categoryColors[club.category] || "#6b7280"}18`, color: categoryColors[club.category] || "#6b7280" }}>
                                            {club.category}
                                        </span>
                                    )}
                                </div>
                                <Trophy className="h-4 w-4 flex-shrink-0" style={{ color: "#f59e0b" }} />
                            </div>
                            {club.description && <p className="text-xs" style={{ color: "hsl(150 10% 50%)" }}>{club.description}</p>}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-xs" style={{ color: "hsl(150 10% 50%)" }}>
                                    <Users className="h-3 w-3" /> {club.memberCount || 0} members
                                </div>
                                {club.avgConsistency !== undefined && (
                                    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--green)" }}>
                                        <TrendingUp className="h-3 w-3" /> {club.avgConsistency}% consistency
                                    </div>
                                )}
                            </div>
                            <button onClick={() => joinMutation.mutate(club._id)}
                                className="w-full py-2 rounded-lg text-xs font-semibold transition-all mt-1"
                                style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(19,236,106,0.2)" }}>
                                Join Club
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
