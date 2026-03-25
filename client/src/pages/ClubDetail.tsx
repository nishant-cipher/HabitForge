import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { clubService, type Club, type ClubMember, type ClubHabit, type LeaderboardEntry } from "@/services/clubService"
import { useToast } from "@/contexts/ToastContext"
import { useTodayLoggedClubHabits } from "@/hooks/useTodayLoggedClubHabits"
import {
    ArrowLeft, Users, BookOpen, Flame, Target, Plus,
    Crown, Shield, User, Globe, Lock, CheckCircle2,
    LogOut, Trash2, Copy, Key, X, Trophy, AlertTriangle, Pencil
} from "lucide-react"

const categoryColors: Record<string, string> = {
    FITNESS: "#13ec6a", LEARNING: "#3b82f6", PRODUCTIVITY: "#f59e0b",
    MINDFULNESS: "#8b5cf6", SOCIAL: "#ec4899", OTHER: "#6b7280",
    HEALTH: "#13ec6a",
}
const CATEGORIES = ["FITNESS", "LEARNING", "PRODUCTIVITY", "MINDFULNESS", "SOCIAL", "OTHER"]
const FREQUENCIES = ["DAILY", "WEEKLY", "CUSTOM"]
const DIFFICULTIES = [{ label: "Easy", value: 1 }, { label: "Medium", value: 2 }, { label: "Hard", value: 3 }, { label: "Extreme", value: 4 }]
const ROLE_ICONS: Record<string, any> = { OWNER: Crown, ADMIN: Shield, MEMBER: User }
const DIFFICULTY_LABELS: Record<number, string> = { 1: "Easy", 2: "Medium", 3: "Hard", 4: "Extreme", 5: "Legendary" }
const FREQ_COLORS: Record<string, string> = { DAILY: "#13ec6a", WEEKLY: "#3b82f6", CUSTOM: "#8b5cf6" }
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

type Tab = "overview" | "members" | "habits"

const emptyHabitForm = { name: "", description: "", category: "FITNESS", frequency: "DAILY", difficulty: 1, customDays: [] as number[] }

export function ClubDetail() {
    const { clubId } = useParams<{ clubId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const toast = useToast()
    const { loggedIds: loggedClubHabitIds, markLogged: markClubHabitLogged } = useTodayLoggedClubHabits()
    const [completingClubHabitId, setCompletingClubHabitId] = useState<string | null>(null)

    const [activeTab, setActiveTab] = useState<Tab>("overview")
    const [showAddHabit, setShowAddHabit] = useState(false)
    const [habitForm, setHabitForm] = useState(emptyHabitForm)
    const [showInviteCode, setShowInviteCode] = useState(false)
    const [inviteCodeValue, setInviteCodeValue] = useState("")
    const [codeCopied, setCodeCopied] = useState(false)

    // Delete club state
    const [showDeleteClub, setShowDeleteClub] = useState(false)
    const [deleteClubInput, setDeleteClubInput] = useState("")
    const [deleteClubError, setDeleteClubError] = useState("")

    // Edit club state
    const [showEditClub, setShowEditClub] = useState(false)
    const [editName, setEditName] = useState("")
    const [editDesc, setEditDesc] = useState("")
    const [editIsPublic, setEditIsPublic] = useState(true)

    // Fetch club details
    const { data: club, isLoading } = useQuery<Club>({
        queryKey: ["club", clubId],
        queryFn: () => clubService.getClub(clubId!),
        enabled: !!clubId,
    })

    // Fetch members
    const { data: members = [] } = useQuery<ClubMember[]>({
        queryKey: ["club-members", clubId],
        queryFn: () => clubService.getClubMembers(clubId!),
        enabled: !!clubId,
    })

    // Fetch habits
    const { data: habits = [] } = useQuery<ClubHabit[]>({
        queryKey: ["club-habits", clubId],
        queryFn: () => clubService.getClubHabits(clubId!),
        enabled: !!clubId,
    })

    // Fetch leaderboard
    const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
        queryKey: ["club-leaderboard", clubId],
        queryFn: () => clubService.getLeaderboard(clubId!),
        enabled: !!clubId,
        refetchInterval: 30_000,
    })

    // Fetch user's clubs to know membership
    const { data: myClubs = [] } = useQuery<Club[]>({
        queryKey: ["clubs", "my"],
        queryFn: clubService.getMyClubs,
    })

    const myMembership = myClubs.find((c) => c._id === clubId)
    const isMember = !!myMembership
    const isOwner = myMembership?.role === "OWNER"

    // ── Mutations ──────────────────────────────────────
    const leaveMutation = useMutation({
        mutationFn: () => clubService.leaveClub(clubId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clubs"] })
            navigate("/clubs")
        },
    })

    const deleteClubMutation = useMutation({
        mutationFn: () => clubService.deleteClub(clubId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clubs"] })
            navigate("/clubs")
        },
        onError: (e: any) => {
            setDeleteClubError(e?.response?.data?.message || e?.message || "Failed to delete club")
        }
    })

    const updateClubMutation = useMutation({
        mutationFn: (data: { name?: string; description?: string; isPublic?: boolean }) =>
            clubService.updateClub(clubId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["club", clubId] })
            queryClient.invalidateQueries({ queryKey: ["clubs"] })
            setShowEditClub(false)
            toast.success("Club updated! ✏️")
        },
        onError: (e: any) => toast.error("Failed to update club", e?.response?.data?.message || e?.message),
    })

    const joinMutation = useMutation({
        mutationFn: () => clubService.joinClub(clubId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clubs"] })
            queryClient.invalidateQueries({ queryKey: ["club-members", clubId] })
        },
    })

    const addHabitMutation = useMutation({
        mutationFn: (data: Partial<ClubHabit> & { customDays?: number[] }) => {
            const payload: any = { ...data }
            if (data.frequency === 'CUSTOM' && data.customDays?.length) {
                payload.targetDays = data.customDays
            }
            delete payload.customDays
            return clubService.addClubHabit(clubId!, payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["club-habits", clubId] })
            setShowAddHabit(false)
            setHabitForm(emptyHabitForm)
        },
    })

    const deleteHabitMutation = useMutation({
        mutationFn: (habitId: string) => clubService.deleteClubHabit(clubId!, habitId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["club-habits", clubId] }),
    })

    const logHabitMutation = useMutation({
        mutationFn: ({ habitId, habitName: _n }: { habitId: string; habitName: string }) =>
            clubService.logClubHabit(clubId!, habitId),
        onSuccess: (data: any, { habitId, habitName }) => {
            queryClient.invalidateQueries({ queryKey: ["club-leaderboard", clubId] })
            markClubHabitLogged(habitId)
            setCompletingClubHabitId(null)
            const xp = data?.xpEarned ?? 0
            toast.xp(xp, `${habitName} logged! 🏆`)
        },
        onError: (e: any, { habitId }) => {
            setCompletingClubHabitId(null)
            const msg: string = e?.response?.data?.message || e?.message || ""
            if (msg.toLowerCase().includes("already logged")) {
                markClubHabitLogged(habitId)
            } else {
                toast.error("Failed to log habit", msg)
            }
        }
    })



    const handleShowInviteCode = async () => {
        try {
            const code = await clubService.getClubInviteCode(clubId!)
            setInviteCodeValue(code || "")
            setShowInviteCode(true)
        } catch { /* noop */ }
    }

    const copyCode = () => {
        if (inviteCodeValue) {
            navigator.clipboard.writeText(inviteCodeValue)
            setCodeCopied(true)
            setTimeout(() => setCodeCopied(false), 2000)
        }
    }

    // ── Loading/Error ──────────────────────────────────
    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-sm" style={{ color: "hsl(150 10% 40%)" }}>Loading club...</div>
        </div>
    )
    if (!club) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="text-sm" style={{ color: "hsl(150 10% 40%)" }}>Club not found</div>
            <button onClick={() => navigate("/clubs")} className="text-sm underline" style={{ color: "var(--green)" }}>← Back to Clubs</button>
        </div>
    )

    const catColor = categoryColors[club.category || "OTHER"] || "#6b7280"
    const catBg = `${catColor}18`
    const sortedMembers = [...members].sort((a, b) => {
        const ro = { OWNER: 0, ADMIN: 1, MEMBER: 2 }
        const aO = ro[a.role as keyof typeof ro] ?? 2
        const bO = ro[b.role as keyof typeof ro] ?? 2
        return aO !== bO ? aO - bO : a.username.localeCompare(b.username)
    })

    return (
        <div className="flex flex-col gap-0 -mt-1">

            {/* ── Back ── */}
            <button onClick={() => navigate("/clubs")} className="flex items-center gap-2 text-sm mb-4 w-fit transition-colors"
                style={{ color: "hsl(150 10% 50%)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--green)")}
                onMouseLeave={e => (e.currentTarget.style.color = "hsl(150 10% 50%)")}>
                <ArrowLeft className="h-4 w-4" /> Back to Clubs
            </button>

            {/* ── Hero ── */}
            <div className="surface-card p-6 mb-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at top left, ${catColor}, transparent 60%)` }} />

                <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
                    <div className="h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0 font-extrabold text-2xl"
                        style={{ background: catBg, color: catColor, border: `2px solid ${catColor}30` }}>
                        {club.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "hsl(150 10% 95%)" }}>{club.name}</h1>
                            {club.isPublic !== false
                                ? <Globe className="h-4 w-4" style={{ color: "#13ec6a" }} />
                                : <Lock className="h-4 w-4" style={{ color: "#f59e0b" }} />}
                        </div>
                        {club.category && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold mb-2 inline-block"
                                style={{ background: catBg, color: catColor }}>{club.category}</span>
                        )}
                        {club.description && <p className="text-sm mt-2" style={{ color: "hsl(150 10% 60%)" }}>{club.description}</p>}

                        <div className="flex flex-wrap items-center gap-5 mt-4">
                            <div className="flex items-center gap-1.5">
                                <Users className="h-4 w-4" style={{ color: "var(--green)" }} />
                                <span className="text-sm font-bold" style={{ color: "hsl(150 10% 85%)" }}>{club.memberCount || 0}</span>
                                <span className="text-xs" style={{ color: "hsl(150 10% 45%)" }}>members</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <BookOpen className="h-4 w-4" style={{ color: "#3b82f6" }} />
                                <span className="text-sm font-bold" style={{ color: "hsl(150 10% 85%)" }}>{habits.length}</span>
                                <span className="text-xs" style={{ color: "hsl(150 10% 45%)" }}>habits</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Right actions ── */}
                    <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                        {isOwner ? (
                            <>
                                <div className="px-4 py-2 rounded-lg text-xs font-semibold text-center"
                                    style={{ background: "hsl(150 15% 12%)", color: "var(--green)", border: "1px solid rgba(19,236,106,0.2)" }}>
                                    <Crown className="h-3.5 w-3.5 inline mr-1" /> Your Club
                                </div>
                                <button
                                    onClick={() => { setEditName(club.name); setEditDesc(club.description || ""); setEditIsPublic(club.isPublic !== false); setShowEditClub(true) }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                    style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}>
                                    <Pencil className="h-3.5 w-3.5" /> Edit Club
                                </button>
                                <button
                                    onClick={() => { setShowDeleteClub(true); setDeleteClubInput(""); setDeleteClubError("") }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                                    <Trash2 className="h-3.5 w-3.5" /> Delete Club
                                </button>
                            </>
                        ) : isMember ? (
                            <button onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                                <LogOut className="h-3.5 w-3.5" />
                                {leaveMutation.isPending ? "Leaving..." : "Leave Club"}
                            </button>
                        ) : (
                            <button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                                style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(19,236,106,0.25)" }}>
                                <Plus className="h-3.5 w-3.5" />
                                {joinMutation.isPending ? "Joining..." : "Join Club"}
                            </button>
                        )}

                        {/* Invite code button — always visible for private club owners/admins */}
                        {club.isPublic === false && isMember && (
                            <button onClick={handleShowInviteCode}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                                <Key className="h-3.5 w-3.5" /> Show Invite Code
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit"
                style={{ background: "hsl(150 15% 9%)", border: "1px solid hsl(150 15% 14%)" }}>
                {(["overview", "members", "habits"] as Tab[]).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
                        style={{
                            background: activeTab === tab ? "var(--green-dim)" : "transparent",
                            color: activeTab === tab ? "var(--green)" : "hsl(150 10% 50%)",
                        }}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* ── OVERVIEW TAB ── */}
            {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        {/* Leaderboard */}
                        <div className="surface-card p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "hsl(150 10% 55%)" }}>
                                    <Trophy className="h-4 w-4" style={{ color: "#f59e0b" }} />
                                    Leaderboard
                                </h3>
                                <span className="text-xs" style={{ color: "hsl(150 10% 40%)" }}>by club completions</span>
                            </div>
                            {leaderboard.length === 0 ? (
                                <div className="text-xs py-4 text-center" style={{ color: "hsl(150 10% 40%)" }}>No completions yet — be the first! 🚀</div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {leaderboard.slice(0, 5).map((entry) => {
                                        const isPodium = entry.rank <= 3
                                        const pc = ["#f59e0b", "#94a3b8", "#b45309"]
                                        const podiumColor = pc[entry.rank - 1]
                                        const maxCompletions = leaderboard[0]?.completions || 1
                                        const barWidth = Math.round((entry.completions / maxCompletions) * 100)
                                        return (
                                            <div key={entry.userId} className="flex items-center gap-3 p-3 rounded-xl"
                                                style={{ background: "hsl(150 15% 10%)", border: isPodium ? `1px solid ${podiumColor}22` : "1px solid transparent" }}>
                                                <div className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-extrabold flex-shrink-0"
                                                    style={{ background: isPodium ? `${podiumColor}22` : "hsl(150 15% 14%)", color: isPodium ? podiumColor : "hsl(150 10% 40%)" }}>
                                                    {isPodium ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-semibold truncate" style={{ color: "hsl(150 10% 88%)" }}>{entry.username}</span>
                                                        <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: isPodium ? podiumColor : "hsl(150 10% 55%)" }}>
                                                            {entry.completions} ✓
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(150 15% 14%)" }}>
                                                        <div className="h-full rounded-full transition-all"
                                                            style={{ width: `${barWidth}%`, background: isPodium ? podiumColor : "hsl(150 30% 35%)" }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Club Habits preview */}
                        <div className="surface-card p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 55%)" }}>📋 Club Habits</h3>
                                <button onClick={() => setActiveTab("habits")} className="text-xs" style={{ color: "var(--green)" }}>See all →</button>
                            </div>
                            {habits.length === 0 ? (
                                <div className="text-xs py-2" style={{ color: "hsl(150 10% 40%)" }}>No habits yet.</div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {habits.slice(0, 3).map(habit => {
                                        const hColor = categoryColors[habit.category || "OTHER"] || "#6b7280"
                                        return (
                                            <div key={habit._id} className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{ background: `${hColor}18`, color: hColor }}>
                                                    <Target className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold truncate" style={{ color: "hsl(150 10% 88%)" }}>{habit.name}</div>
                                                    <div className="text-xs" style={{ color: "hsl(150 10% 45%)" }}>{habit.frequency} · {DIFFICULTY_LABELS[habit.difficulty || 1]}</div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right sidebar */}
                    <div className="flex flex-col gap-4">
                        <div className="surface-card p-5">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "hsl(150 10% 55%)" }}>Club Stats</h3>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <div className="text-xs mb-1" style={{ color: "hsl(150 10% 45%)" }}>Members</div>
                                    <div className="text-3xl font-extrabold" style={{ color: "var(--green)" }}>{club.memberCount || 0}</div>
                                </div>
                                <div>
                                    <div className="text-xs mb-1" style={{ color: "hsl(150 10% 45%)" }}>Active Habits</div>
                                    <div className="text-3xl font-extrabold" style={{ color: "#3b82f6" }}>{habits.length}</div>
                                </div>
                                <div>
                                    <div className="text-xs mb-1" style={{ color: "hsl(150 10% 45%)" }}>Club Type</div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        {club.isPublic !== false
                                            ? <><Globe className="h-4 w-4" style={{ color: "#13ec6a" }} /><span className="text-sm font-semibold" style={{ color: "hsl(150 10% 80%)" }}>Public</span></>
                                            : <><Lock className="h-4 w-4" style={{ color: "#f59e0b" }} /><span className="text-sm font-semibold" style={{ color: "hsl(150 10% 80%)" }}>Private</span></>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="surface-card p-5">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "hsl(150 10% 55%)" }}>My Status</h3>
                            {isMember ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" style={{ color: "var(--green)" }} />
                                        <span className="text-sm font-semibold" style={{ color: "var(--green)" }}>Member</span>
                                    </div>
                                    <div className="text-xs" style={{ color: "hsl(150 10% 45%)" }}>
                                        Role: <span className="font-semibold" style={{ color: "hsl(150 10% 75%)" }}>{myMembership?.role || "MEMBER"}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <div className="text-xs" style={{ color: "hsl(150 10% 45%)" }}>You are not a member yet.</div>
                                    {club.isPublic !== false && (
                                        <button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}
                                            className="w-full py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                                            style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(19,236,106,0.25)" }}>
                                            {joinMutation.isPending ? "Joining..." : "Join Club"}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MEMBERS TAB ── */}
            {activeTab === "members" && (
                <div className="surface-card p-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: "hsl(150 10% 55%)" }}>All Members ({members.length})</h3>
                    {sortedMembers.length === 0 ? (
                        <div className="text-sm py-8 text-center" style={{ color: "hsl(150 10% 40%)" }}>No members yet</div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {sortedMembers.map((member, idx) => {
                                const RoleIcon = ROLE_ICONS[member.role] || User
                                const isPodium = idx < 3
                                const pc = ["#f59e0b", "#94a3b8", "#b45309"]
                                return (
                                    <div key={member._id} className="flex items-center gap-4 p-4 rounded-xl"
                                        style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 12% 14%)" }}>
                                        <div className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-extrabold flex-shrink-0"
                                            style={{ background: isPodium ? `${pc[idx]}22` : "hsl(150 15% 14%)", color: isPodium ? pc[idx] : "hsl(150 10% 40%)" }}>
                                            {isPodium ? ["🥇", "🥈", "🥉"][idx] : idx + 1}
                                        </div>
                                        <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                                            style={{ background: "hsl(150 15% 15%)", color: "var(--green)" }}>
                                            {member.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-semibold" style={{ color: "hsl(150 10% 88%)" }}>{member.username}</span>
                                                <RoleIcon className="h-3.5 w-3.5"
                                                    style={{ color: member.role === "OWNER" ? "#f59e0b" : member.role === "ADMIN" ? "#8b5cf6" : "hsl(150 10% 35%)" }} />
                                            </div>
                                            <span className="text-xs capitalize" style={{ color: "hsl(150 10% 40%)" }}>{member.role?.toLowerCase()}</span>
                                        </div>
                                        {member.currentStreak !== undefined && (
                                            <div className="text-center">
                                                <div className="flex items-center gap-1 text-sm font-bold" style={{ color: "#f97316" }}>
                                                    <Flame className="h-3.5 w-3.5" /> {member.currentStreak}
                                                </div>
                                                <div className="text-xs" style={{ color: "hsl(150 10% 40%)" }}>streak</div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── HABITS TAB ── */}
            {activeTab === "habits" && (
                <div className="surface-card p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 55%)" }}>Club Habits ({habits.length})</h3>
                        {/* Only owners can add habits */}
                        {isOwner && (
                            <button onClick={() => setShowAddHabit(true)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                                style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(19,236,106,0.25)" }}>
                                <Plus className="h-3.5 w-3.5" /> Add Habit
                            </button>
                        )}
                    </div>

                    {habits.length === 0 ? (
                        <div className="text-center py-12">
                            <Target className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(150 15% 20%)" }} />
                            <div className="text-sm mb-1" style={{ color: "hsl(150 10% 45%)" }}>No habits added yet</div>
                            {isOwner && <div className="text-xs" style={{ color: "hsl(150 10% 35%)" }}>Click "Add Habit" to create club challenges for members</div>}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {habits.map(habit => {
                                const hColor = categoryColors[habit.category || "OTHER"] || "#6b7280"
                                const freqColor = FREQ_COLORS[habit.frequency || "DAILY"] || "#13ec6a"
                                return (
                                    <div key={habit._id} className="p-4 rounded-xl flex flex-col gap-3"
                                        style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 12% 14%)" }}>
                                        <div className="flex items-start gap-3">
                                            <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ background: `${hColor}18`, color: hColor }}>
                                                <Target className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-sm" style={{ color: "hsl(150 10% 88%)" }}>{habit.name}</div>
                                                {habit.description && (
                                                    <div className="text-xs mt-0.5 line-clamp-2" style={{ color: "hsl(150 10% 48%)" }}>{habit.description}</div>
                                                )}
                                            </div>
                                            {/* Owner: delete button */}
                                            {isOwner && (
                                                <button onClick={() => deleteHabitMutation.mutate(habit._id)}
                                                    disabled={deleteHabitMutation.isPending}
                                                    className="flex-shrink-0 p-1.5 rounded-lg transition-all disabled:opacity-50"
                                                    style={{ color: "#ef4444" }}
                                                    title="Delete habit">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mt-1">
                                            <div className="flex flex-wrap gap-1.5">
                                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                                    style={{ background: `${hColor}15`, color: hColor }}>{habit.category}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                                    style={{ background: `${freqColor}15`, color: freqColor }}>
                                                    {habit.frequency === 'CUSTOM' && (habit as any).targetDays?.length
                                                        ? (habit as any).targetDays.map((d: number) => DAY_FULL[d].slice(0, 2)).join('·')
                                                        : habit.frequency}
                                                </span>
                                                {habit.difficulty && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                                        style={{ background: "hsl(150 15% 14%)", color: "hsl(150 10% 50%)" }}>
                                                        {DIFFICULTY_LABELS[habit.difficulty]}
                                                    </span>
                                                )}
                                            </div>
                                            {isMember && (() => {
                                                const isLogged = loggedClubHabitIds.has(habit._id)
                                                const isLogging = completingClubHabitId === habit._id
                                                const isDone = isLogged || isLogging
                                                return (
                                                    <button
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all ${isDone ? "opacity-70" : ""}`}
                                                        disabled={isDone}
                                                        onClick={() => {
                                                            if (!isDone) {
                                                                setCompletingClubHabitId(habit._id)
                                                                logHabitMutation.mutate({ habitId: habit._id, habitName: habit.name })
                                                            }
                                                        }}
                                                        style={{
                                                            background: isDone ? "rgba(19,236,106,0.08)" : "var(--green-dim)",
                                                            color: "var(--green)",
                                                            border: "1px solid rgba(19,236,106,0.25)"
                                                        }}>
                                                        {isDone
                                                            ? <><CheckCircle2 className="h-3.5 w-3.5" /> Logged</>
                                                            : <><Target className="h-3.5 w-3.5" /> Log Today</>
                                                        }
                                                    </button>
                                                )
                                            })()}
                                        </div>

                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Add Habit Modal ── */}
            {showAddHabit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
                    <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4 relative"
                        style={{ background: "hsl(150 20% 7%)", border: "1px solid hsl(150 15% 16%)" }}>
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-base" style={{ color: "hsl(150 10% 92%)" }}>Add Club Habit</h3>
                            <button onClick={() => { setShowAddHabit(false); setHabitForm(emptyHabitForm) }}
                                className="p-1.5 rounded-lg" style={{ color: "hsl(150 10% 50%)" }}>
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Habit Name *</label>
                                <input value={habitForm.name} onChange={e => setHabitForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Run 5km" className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                    style={{ background: "hsl(150 15% 12%)", border: "1px solid hsl(150 15% 18%)", color: "hsl(150 10% 90%)" }} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Description</label>
                                <textarea value={habitForm.description} onChange={e => setHabitForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Optional description" rows={2} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                                    style={{ background: "hsl(150 15% 12%)", border: "1px solid hsl(150 15% 18%)", color: "hsl(150 10% 90%)" }} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Category</label>
                                    <select value={habitForm.category} onChange={e => setHabitForm(f => ({ ...f, category: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                        style={{ background: "hsl(150 15% 12%)", border: "1px solid hsl(150 15% 18%)", color: "hsl(150 10% 90%)" }}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Frequency</label>
                                    <select value={habitForm.frequency} onChange={e => setHabitForm(f => ({ ...f, frequency: e.target.value, customDays: [] }))}
                                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                        style={{ background: "hsl(150 15% 12%)", border: "1px solid hsl(150 15% 18%)", color: "hsl(150 10% 90%)" }}>
                                        {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                            </div>
                            {/* Day picker for CUSTOM frequency */}
                            {habitForm.frequency === "CUSTOM" && (
                                <div>
                                    <label className="text-xs font-semibold mb-2 block" style={{ color: "hsl(150 10% 55%)" }}>Select Days *</label>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {DAY_LABELS.map((label, idx) => {
                                            const selected = habitForm.customDays.includes(idx)
                                            return (
                                                <button key={idx} type="button"
                                                    onClick={() => setHabitForm(f => ({
                                                        ...f,
                                                        customDays: selected
                                                            ? f.customDays.filter(d => d !== idx)
                                                            : [...f.customDays, idx].sort((a, b) => a - b)
                                                    }))}
                                                    className="w-9 h-9 rounded-lg text-xs font-bold transition-all"
                                                    style={{
                                                        background: selected ? "rgba(139,92,246,0.2)" : "hsl(150 15% 12%)",
                                                        border: `1px solid ${selected ? "#8b5cf6" : "hsl(150 15% 18%)"}`,
                                                        color: selected ? "#8b5cf6" : "hsl(150 10% 50%)"
                                                    }}>
                                                    {label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {habitForm.customDays.length === 0 && (
                                        <p className="text-xs mt-1" style={{ color: "#ef4444" }}>Select at least one day</p>
                                    )}
                                </div>
                            )}
                            <div>
                                <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Difficulty</label>
                                <div className="flex gap-2">
                                    {DIFFICULTIES.map(d => (
                                        <button key={d.value} type="button"
                                            onClick={() => setHabitForm(f => ({ ...f, difficulty: d.value }))}
                                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                            style={{
                                                background: habitForm.difficulty === d.value ? "var(--green-dim)" : "hsl(150 15% 12%)",
                                                color: habitForm.difficulty === d.value ? "var(--green)" : "hsl(150 10% 50%)",
                                                border: habitForm.difficulty === d.value ? "1px solid rgba(19,236,106,0.3)" : "1px solid hsl(150 15% 18%)"
                                            }}>
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-1">
                            <button onClick={() => addHabitMutation.mutate(habitForm)}
                                disabled={
                                    !habitForm.name.trim() ||
                                    (habitForm.frequency === 'CUSTOM' && habitForm.customDays.length === 0) ||
                                    addHabitMutation.isPending
                                }
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
                                style={{ background: "var(--green)", color: "#0a0f0a" }}>
                                {addHabitMutation.isPending ? "Adding..." : "Add Habit"}
                            </button>
                            <button onClick={() => { setShowAddHabit(false); setHabitForm(emptyHabitForm) }}
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ background: "hsl(150 15% 12%)", color: "hsl(150 10% 60%)" }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Invite Code Modal ── */}
            {showInviteCode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
                    <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4 items-center text-center relative"
                        style={{ background: "hsl(150 20% 7%)", border: "1px solid hsl(150 15% 16%)" }}>
                        <button onClick={() => setShowInviteCode(false)} className="absolute top-4 right-4 p-1.5 rounded-lg" style={{ color: "hsl(150 10% 50%)" }}>
                            <X className="h-4 w-4" />
                        </button>
                        <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
                            style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                            <Key className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base mb-1" style={{ color: "hsl(150 10% 92%)" }}>Invite Code</h3>
                            <p className="text-xs" style={{ color: "hsl(150 10% 50%)" }}>Share this code with people you want to invite to <strong>{club.name}</strong></p>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-3 rounded-xl w-full justify-between"
                            style={{ background: "hsl(150 15% 11%)", border: "1px solid rgba(245,158,11,0.25)" }}>
                            <span className="text-xl font-extrabold tracking-widest" style={{ color: "#f59e0b" }}>{inviteCodeValue}</span>
                            <button onClick={copyCode} className="p-1.5 rounded-lg transition-all"
                                style={{ color: codeCopied ? "var(--green)" : "hsl(150 10% 50%)" }}>
                                {codeCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>
                        <button onClick={() => setShowInviteCode(false)} className="w-full py-2.5 rounded-xl text-sm font-bold"
                            style={{ background: "var(--green)", color: "#0a0f0a" }}>
                            Got it!
                        </button>
                    </div>
                </div>
            )}

            {/* ── Edit Club Modal ── */}
            {showEditClub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
                    <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4" style={{ background: "hsl(150 20% 7%)", border: "1px solid hsl(150 15% 16%)" }}>
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-base flex items-center gap-2" style={{ color: "hsl(150 10% 92%)" }}>
                                <Pencil className="h-4 w-4" style={{ color: "#60a5fa" }} /> Edit Club
                            </h3>
                            <button onClick={() => setShowEditClub(false)} className="p-1.5 rounded-lg" style={{ color: "hsl(150 10% 50%)" }}>
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Club Name *</label>
                            <input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                maxLength={50}
                                placeholder="Club name (3–50 chars)"
                                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                style={{ background: "hsl(150 15% 12%)", border: "1px solid hsl(150 15% 18%)", color: "hsl(150 10% 90%)" }}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Description</label>
                            <textarea
                                value={editDesc}
                                onChange={e => setEditDesc(e.target.value)}
                                rows={3}
                                maxLength={500}
                                placeholder="What is this club about?"
                                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                                style={{ background: "hsl(150 15% 12%)", border: "1px solid hsl(150 15% 18%)", color: "hsl(150 10% 90%)" }}
                            />
                            <div className="text-right text-[10px] mt-0.5 font-mono" style={{ color: "hsl(150 10% 35%)" }}>{editDesc.length}/500</div>
                        </div>

                        {/* Privacy toggle */}
                        <div>
                            <label className="text-xs font-semibold mb-2 block" style={{ color: "hsl(150 10% 55%)" }}>Privacy</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditIsPublic(true)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
                                    style={{
                                        background: editIsPublic ? "rgba(19,236,106,0.12)" : "hsl(150 15% 12%)",
                                        color: editIsPublic ? "var(--green)" : "hsl(150 10% 45%)",
                                        border: `1px solid ${editIsPublic ? "rgba(19,236,106,0.3)" : "hsl(150 15% 18%)"}`,
                                    }}>
                                    <Globe className="h-3.5 w-3.5" /> Public
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditIsPublic(false)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
                                    style={{
                                        background: !editIsPublic ? "rgba(245,158,11,0.12)" : "hsl(150 15% 12%)",
                                        color: !editIsPublic ? "#f59e0b" : "hsl(150 10% 45%)",
                                        border: `1px solid ${!editIsPublic ? "rgba(245,158,11,0.3)" : "hsl(150 15% 18%)"}`,
                                    }}>
                                    <Lock className="h-3.5 w-3.5" /> Private
                                </button>
                            </div>
                            {!editIsPublic && (
                                <p className="text-[10px] mt-1.5" style={{ color: "hsl(150 10% 40%)" }}>Private clubs require an invite code to join</p>
                            )}
                        </div>

                        <div className="flex gap-2 mt-1">
                            <button
                                onClick={() => updateClubMutation.mutate({ name: editName.trim(), description: editDesc.trim(), isPublic: editIsPublic })}
                                disabled={editName.trim().length < 3 || updateClubMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
                                style={{ background: "#13ec6a", color: "#0a0f0a" }}>
                                {updateClubMutation.isPending ? "Saving..." : "Save Changes"}
                            </button>
                            <button onClick={() => setShowEditClub(false)}
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ background: "hsl(150 15% 12%)", color: "hsl(150 10% 60%)" }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Club Modal ── */}
            {showDeleteClub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ animation: "toastIn 0.2s ease" }}>
                    <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "hsl(150 20% 7%)", border: "1px solid rgba(239,68,68,0.3)" }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold" style={{ color: "hsl(150 10% 95%)" }}>Delete Club</h2>
                                <p className="text-xs" style={{ color: "hsl(150 10% 50%)" }}>{club.name}</p>
                            </div>
                        </div>

                        <p className="text-sm mb-4" style={{ color: "hsl(150 10% 60%)" }}>
                            This action is <strong>irreversible</strong>. It will permanently delete the club,
                            including all habits, members, activity logs, and leaderboard data.
                        </p>

                        {deleteClubError && (
                            <div className="mb-4 text-xs font-semibold p-3 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                                {deleteClubError}
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="text-xs font-semibold mb-2 block" style={{ color: "hsl(150 10% 70%)" }}>
                                Type <strong style={{ color: "hsl(150 10% 90%)" }}>DELETE</strong> to confirm
                            </label>
                            <input
                                type="text"
                                value={deleteClubInput}
                                onChange={e => setDeleteClubInput(e.target.value)}
                                placeholder="DELETE"
                                autoFocus
                                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                style={{ background: "hsl(150 20% 4%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full">
                            <button
                                onClick={() => { setShowDeleteClub(false); setDeleteClubInput(""); setDeleteClubError("") }}
                                disabled={deleteClubMutation.isPending}
                                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                                style={{ background: "hsl(150 20% 12%)", color: "hsl(150 10% 70%)", border: "1px solid hsl(150 15% 18%)" }}>
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteClubMutation.mutate()}
                                disabled={deleteClubInput !== "DELETE" || deleteClubMutation.isPending}
                                className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                                style={{ background: "#ef4444", color: "#fff" }}>
                                {deleteClubMutation.isPending ? "Deleting..." : "Delete Club"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
