import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { clubService, type Club } from "@/services/clubService"
import { Users, Plus, Trophy, TrendingUp, X, Lock, Globe, Copy, CheckCircle2, LogOut } from "lucide-react"

const CATEGORIES = ["FITNESS", "LEARNING", "PRODUCTIVITY", "MINDFULNESS", "SOCIAL", "OTHER"]

const categoryColors: Record<string, string> = {
    FITNESS: "#13ec6a", LEARNING: "#3b82f6", PRODUCTIVITY: "#f59e0b",
    MINDFULNESS: "#8b5cf6", SOCIAL: "#ec4899", OTHER: "#6b7280",
}

interface JoinModalState {
    clubId: string
    clubName: string
}

export function Clubs() {
    const queryClient = useQueryClient()

    // Create modal state
    const [showCreate, setShowCreate] = useState(false)
    const [form, setForm] = useState({ name: "", description: "", category: "FITNESS", isPublic: true })
    const [createdClub, setCreatedClub] = useState<Club | null>(null)
    const [codeCopied, setCodeCopied] = useState(false)

    // Join modal state (for private clubs)
    const [joinModal, setJoinModal] = useState<JoinModalState | null>(null)
    const [inviteCodeInput, setInviteCodeInput] = useState("")
    const [joinError, setJoinError] = useState("")

    // Fetch public clubs (explore grid)
    const { data: publicClubs = [], isLoading: publicLoading } = useQuery({
        queryKey: ["clubs", "public"],
        queryFn: clubService.getPublicClubs,
    })

    // Fetch user's clubs (membership)
    const { data: myClubs = [] } = useQuery({
        queryKey: ["clubs", "my"],
        queryFn: clubService.getMyClubs,
    })

    const myClubIds = new Set(myClubs.map((c: Club) => c._id))
    const myOwnedIds = new Set(myClubs.filter((c: Club) => c.role === "OWNER").map((c: Club) => c._id))

    const createMutation = useMutation({
        mutationFn: (data: Partial<Club>) => clubService.createClub(data),
        onSuccess: (club) => {
            queryClient.invalidateQueries({ queryKey: ["clubs"] })
            setShowCreate(false)
            setForm({ name: "", description: "", category: "FITNESS", isPublic: true })
            // Show invite code dialog for private clubs
            if (!club.isPublic && club.inviteCode) {
                setCreatedClub(club)
            }
        },
    })

    const joinMutation = useMutation({
        mutationFn: ({ clubId, inviteCode }: { clubId: string; inviteCode?: string }) =>
            clubService.joinClub(clubId, inviteCode),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clubs"] })
            setJoinModal(null)
            setInviteCodeInput("")
            setJoinError("")
        },
        onError: (error: any) => {
            setJoinError(error?.response?.data?.message || "Failed to join club")
        },
    })

    const leaveMutation = useMutation({
        mutationFn: (clubId: string) => clubService.leaveClub(clubId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clubs"] }),
    })

    const handleJoinPublic = (club: Club) => {
        joinMutation.mutate({ clubId: club._id })
    }

    const handleJoinPrivate = (club: Club) => {
        setJoinModal({ clubId: club._id, clubName: club.name })
        setInviteCodeInput("")
        setJoinError("")
    }

    const submitPrivateJoin = () => {
        if (!joinModal || !inviteCodeInput.trim()) return
        setJoinError("")
        joinMutation.mutate({ clubId: joinModal.clubId, inviteCode: inviteCodeInput.trim().toUpperCase() })
    }

    const copyInviteCode = () => {
        if (createdClub?.inviteCode) {
            navigator.clipboard.writeText(createdClub.inviteCode)
            setCodeCopied(true)
            setTimeout(() => setCodeCopied(false), 2000)
        }
    }

    const renderClubCard = (club: Club) => {
        const isMember = myClubIds.has(club._id)
        const isOwner = myOwnedIds.has(club._id)
        const catColor = categoryColors[club.category || "OTHER"] || "#6b7280"
        const catBg = `${catColor}18`

        return (
            <div key={club._id} className="surface-card p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-sm truncate" style={{ color: "hsl(150 10% 90%)" }}>{club.name}</h3>
                            {club.isPublic === false
                                ? <Lock className="h-3 w-3 flex-shrink-0" style={{ color: "#f59e0b" }} />
                                : <Globe className="h-3 w-3 flex-shrink-0" style={{ color: "#13ec6a" }} />
                            }
                        </div>
                        {club.category && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{ background: catBg, color: catColor }}>
                                {club.category}
                            </span>
                        )}
                    </div>
                    <Trophy className="h-4 w-4 flex-shrink-0 ml-2" style={{ color: "#f59e0b" }} />
                </div>

                {club.description && (
                    <p className="text-xs line-clamp-2" style={{ color: "hsl(150 10% 50%)" }}>{club.description}</p>
                )}

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-xs" style={{ color: "hsl(150 10% 50%)" }}>
                        <Users className="h-3 w-3" /> {club.memberCount || 0} members
                    </div>
                    {club.isPublic === false && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
                            Invite Only
                        </span>
                    )}
                </div>

                {/* Action button */}
                {isOwner ? (
                    <div className="w-full py-2 rounded-lg text-xs font-semibold text-center"
                        style={{ background: "hsl(150 15% 12%)", color: "hsl(150 10% 55%)" }}>
                        Your Club
                    </div>
                ) : isMember ? (
                    <button
                        onClick={() => leaveMutation.mutate(club._id)}
                        disabled={leaveMutation.isPending}
                        className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <LogOut className="h-3 w-3" /> Leave Club
                    </button>
                ) : club.isPublic !== false ? (
                    <button
                        onClick={() => handleJoinPublic(club)}
                        disabled={joinMutation.isPending}
                        className="w-full py-2 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(19,236,106,0.2)" }}>
                        {joinMutation.isPending ? "Joining..." : "Join Club"}
                    </button>
                ) : (
                    <button
                        onClick={() => handleJoinPrivate(club)}
                        className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                        style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <Lock className="h-3 w-3" /> Enter Invite Code
                    </button>
                )}
            </div>
        )
    }

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

            {/* My Clubs Section */}
            {myClubs.length > 0 && (
                <div className="flex flex-col gap-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 55%)" }}>
                        My Clubs ({myClubs.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myClubs.map((club: Club) => renderClubCard(club))}
                    </div>
                </div>
            )}

            {/* Discover Public Clubs */}
            <div className="flex flex-col gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 55%)" }}>
                    {myClubs.length > 0 ? "Discover More Clubs" : "All Clubs"}
                </h2>

                {publicLoading ? (
                    <div className="text-sm" style={{ color: "hsl(150 10% 40%)" }}>Loading clubs...</div>
                ) : publicClubs.length === 0 && myClubs.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-sm mb-2" style={{ color: "hsl(150 10% 40%)" }}>No clubs yet. Be the first!</div>
                        <button onClick={() => setShowCreate(true)} className="text-sm underline" style={{ color: "var(--green)" }}>
                            Create a club →
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {publicClubs
                            .filter((c: Club) => !myClubIds.has(c._id)) // hide already-joined
                            .map((club: Club) => renderClubCard(club))}
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
                )}
            </div>

            {/* ── Create Club Modal ── */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }}>
                    <div className="surface-card p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold" style={{ color: "hsl(150 10% 90%)" }}>Create a New Club</h2>
                            <button onClick={() => setShowCreate(false)} style={{ color: "hsl(150 10% 50%)" }}>
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form) }} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Club Name *</label>
                                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Early Risers Club"
                                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                    style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Description *</label>
                                <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
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
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Privacy Toggle */}
                            <div>
                                <label className="text-xs font-semibold mb-2 block" style={{ color: "hsl(150 10% 55%)" }}>Privacy</label>
                                <div className="flex gap-3">
                                    <button type="button"
                                        onClick={() => setForm(f => ({ ...f, isPublic: true }))}
                                        className="flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                                        style={{
                                            background: form.isPublic ? "var(--green-dim)" : "hsl(150 15% 10%)",
                                            color: form.isPublic ? "var(--green)" : "hsl(150 10% 55%)",
                                            border: form.isPublic ? "1px solid rgba(19,236,106,0.3)" : "1px solid hsl(150 15% 16%)",
                                        }}>
                                        <Globe className="h-3.5 w-3.5" />
                                        Public
                                    </button>
                                    <button type="button"
                                        onClick={() => setForm(f => ({ ...f, isPublic: false }))}
                                        className="flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                                        style={{
                                            background: !form.isPublic ? "rgba(245,158,11,0.12)" : "hsl(150 15% 10%)",
                                            color: !form.isPublic ? "#f59e0b" : "hsl(150 10% 55%)",
                                            border: !form.isPublic ? "1px solid rgba(245,158,11,0.3)" : "1px solid hsl(150 15% 16%)",
                                        }}>
                                        <Lock className="h-3.5 w-3.5" />
                                        Private
                                    </button>
                                </div>
                                <p className="text-xs mt-1.5" style={{ color: "hsl(150 10% 40%)" }}>
                                    {form.isPublic
                                        ? "Anyone can discover and join this club."
                                        : "Invite-only. A unique invite code will be generated."}
                                </p>
                            </div>

                            {createMutation.error && (
                                <div className="text-xs" style={{ color: "#ef4444" }}>
                                    {(createMutation.error as any)?.response?.data?.message || "Failed to create club"}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button type="submit" disabled={createMutation.isPending}
                                    className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
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

            {/* ── Invite Code Display (after private club creation) ── */}
            {createdClub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }}>
                    <div className="surface-card p-6 w-full max-w-sm mx-4 text-center">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4"
                            style={{ background: "rgba(245,158,11,0.15)" }}>
                            <Lock className="h-6 w-6" style={{ color: "#f59e0b" }} />
                        </div>
                        <h2 className="text-lg font-bold mb-1" style={{ color: "hsl(150 10% 90%)" }}>
                            Private Club Created!
                        </h2>
                        <p className="text-xs mb-5" style={{ color: "hsl(150 10% 50%)" }}>
                            Share this invite code with members. They'll need it to join <strong>{createdClub.name}</strong>.
                        </p>
                        <div className="flex items-center gap-3 p-4 rounded-xl mb-5"
                            style={{ background: "hsl(150 15% 10%)", border: "1px solid rgba(245,158,11,0.3)" }}>
                            <span className="flex-1 text-2xl font-mono font-extrabold tracking-widest"
                                style={{ color: "#f59e0b" }}>
                                {createdClub.inviteCode}
                            </span>
                            <button onClick={copyInviteCode}
                                className="p-2 rounded-lg transition-all"
                                style={{ background: codeCopied ? "rgba(19,236,106,0.15)" : "hsl(150 15% 14%)", color: codeCopied ? "var(--green)" : "hsl(150 10% 55%)" }}>
                                {codeCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>
                        <button onClick={() => setCreatedClub(null)}
                            className="w-full py-2 rounded-lg text-sm font-semibold"
                            style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}>
                            Got it!
                        </button>
                    </div>
                </div>
            )}

            {/* ── Private Club Join Modal ── */}
            {joinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }}>
                    <div className="surface-card p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold" style={{ color: "hsl(150 10% 90%)" }}>
                                Enter Invite Code
                            </h2>
                            <button onClick={() => { setJoinModal(null); setInviteCodeInput(""); setJoinError("") }}
                                style={{ color: "hsl(150 10% 50%)" }}>
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="text-xs mb-4" style={{ color: "hsl(150 10% 50%)" }}>
                            <strong style={{ color: "hsl(150 10% 80%)" }}>{joinModal.clubName}</strong> is a private club. Enter the invite code to request membership.
                        </p>
                        <input
                            autoFocus
                            value={inviteCodeInput}
                            onChange={e => { setInviteCodeInput(e.target.value.toUpperCase()); setJoinError("") }}
                            onKeyDown={e => { if (e.key === "Enter") submitPrivateJoin() }}
                            placeholder="e.g. ABC123"
                            maxLength={8}
                            className="w-full px-3 py-3 rounded-lg text-center text-xl font-mono font-bold tracking-widest outline-none mb-3"
                            style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                        />
                        {joinError && (
                            <p className="text-xs mb-3" style={{ color: "#ef4444" }}>{joinError}</p>
                        )}
                        <div className="flex gap-2">
                            <button onClick={submitPrivateJoin}
                                disabled={!inviteCodeInput.trim() || joinMutation.isPending}
                                className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                                style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}>
                                {joinMutation.isPending ? "Joining..." : "Join Club"}
                            </button>
                            <button onClick={() => { setJoinModal(null); setInviteCodeInput(""); setJoinError("") }}
                                className="px-4 py-2 rounded-lg text-sm font-semibold"
                                style={{ background: "hsl(150 15% 12%)", color: "hsl(150 10% 70%)" }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
