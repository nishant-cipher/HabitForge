import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { habitService, type Habit } from "@/services/habitService"
import { clubService, type Club, type ClubHabit } from "@/services/clubService"
import { useNavigate } from "react-router-dom"
import { Plus, Flame, Zap, Pencil, Trash2, CheckCircle2, Lock, Shield, Swords, Target, ExternalLink } from "lucide-react"
import { useToast } from "@/contexts/ToastContext"
import { useTodayLoggedClubHabits } from "@/hooks/useTodayLoggedClubHabits"

const CATEGORIES = ["HEALTH", "LEARNING", "PRODUCTIVITY", "SOCIAL", "MINDFULNESS", "OTHER"]
const FREQUENCIES = ["DAILY", "WEEKLY", "CUSTOM"]
const DIFFICULTIES = [
    { label: "Easy", value: 1 },
    { label: "Medium", value: 2 },
    { label: "Hard", value: 3 },
    { label: "Extreme", value: 4 },
]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const categoryColors: Record<string, string> = {
    HEALTH: "#13ec6a", LEARNING: "#3b82f6", PRODUCTIVITY: "#f59e0b",
    SOCIAL: "#ec4899", MINDFULNESS: "#8b5cf6", OTHER: "#6b7280",
    FITNESS: "#13ec6a",
}
const categoryBg: Record<string, string> = {
    HEALTH: "rgba(19,236,106,0.12)", LEARNING: "rgba(59,130,246,0.12)",
    PRODUCTIVITY: "rgba(245,158,11,0.12)", SOCIAL: "rgba(236,72,153,0.12)",
    MINDFULNESS: "rgba(139,92,246,0.12)", OTHER: "rgba(107,114,128,0.12)",
    FITNESS: "rgba(19,236,106,0.12)",
}

const modes = [
    { id: "DISCIPLINE", label: "Discipline Mode", icon: Lock, desc: "Strict rules. 1.5x XP multiplier. Missed habits incur 2x decay penalty.", color: "#ef4444" },
    { id: "BALANCED", label: "Balanced Mode", icon: Shield, desc: "Standard rules. 1x XP multiplier. Flexible scheduling.", color: "#f59e0b" },
    { id: "COMPETITIVE", label: "Competitive Mode", icon: Swords, desc: "Global leaderboard. 2x XP multiplier. Zero tolerance for missed habits.", color: "#3b82f6" },
]

const emptyForm = {
    name: "", description: "", category: "HEALTH", frequency: "DAILY",
    difficulty: 2, targetValue: 1, targetDays: [] as number[],
}

// ── Club Challenges Section Component ─────────────────────────
interface ClubSectionProps {
    club: Club
    completingId: string | null
    loggedIds: Set<string>
    onLogClubHabit: (clubId: string, habitId: string, habitName: string) => void
    navigate: ReturnType<typeof useNavigate>
    onHabitCount?: (count: number) => void
}

function ClubHabitsCard({ club, completingId, loggedIds, onLogClubHabit, navigate, onHabitCount }: ClubSectionProps) {
    const { data: habits = [], isLoading } = useQuery<ClubHabit[]>({
        queryKey: ["club-habits", club._id],
        queryFn: () => clubService.getClubHabits(club._id),
        staleTime: 60_000,
    })

    // Report count to parent so it can show/hide the header
    useEffect(() => { onHabitCount?.(habits.length) }, [habits.length])

    if (isLoading || habits.length === 0) return null

    return (
        <div className="surface-card p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" style={{ color: "var(--green)" }} />
                    <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 60%)" }}>
                        {club.name} · Club Challenges
                    </h3>
                </div>
                <button onClick={() => navigate(`/clubs/${club._id}`)}
                    className="flex items-center gap-1 text-xs transition-colors"
                    style={{ color: "var(--green)" }}>
                    View Club <ExternalLink className="h-3 w-3" />
                </button>
            </div>
            <div className="flex flex-col gap-2">
                {habits.map((habit) => {
                    const hColor = categoryColors[habit.category || "OTHER"] || "#6b7280"
                    const hBg = categoryBg[habit.category || "OTHER"] || "rgba(107,114,128,0.12)"
                    const isSubmitting = completingId === habit._id
                    const isDone = loggedIds.has(habit._id) || isSubmitting

                    return (
                        <div key={habit._id} className="flex items-center gap-3 p-3 rounded-xl"
                            style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 12% 14%)" }}>
                            <button
                                className={`complete-btn ${isDone ? "completed" : ""}`}
                                disabled={isDone}
                                onClick={() => { if (!isDone) onLogClubHabit(club._id, habit._id, habit.name) }}
                                title={isDone ? "Logged today" : "Mark as done"}>
                                {isDone && <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(150 30% 4%)" }} />}
                            </button>
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: hBg, color: hColor }}>
                                <Target className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-semibold truncate ${isDone ? "line-through opacity-50" : ""}`}
                                    style={{ color: "hsl(150 10% 90%)" }}>{habit.name}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                                        style={{ background: hBg, color: hColor }}>{habit.category}</span>
                                    <span className="text-xs" style={{ color: "hsl(150 10% 45%)" }}>{habit.frequency}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

interface WrapperProps {
    clubs: Club[]
    completingClubHabitId: string | null
    loggedClubHabitIds: Set<string>
    onLogClubHabit: (clubId: string, habitId: string, habitName: string) => void
    navigate: ReturnType<typeof useNavigate>
}

/** Shows 'Club Challenges' heading only when at least one club has habits */
function ClubChallengesWrapper({ clubs, completingClubHabitId, loggedClubHabitIds, onLogClubHabit, navigate }: WrapperProps) {
    const [habitCounts, setHabitCounts] = useState<Record<string, number>>({})
    const totalHabits = Object.values(habitCounts).reduce((s, n) => s + n, 0)

    const handleCount = (clubId: string, count: number) =>
        setHabitCounts(prev => prev[clubId] === count ? prev : { ...prev, [clubId]: count })

    return (
        <div className="flex flex-col gap-3">
            {totalHabits > 0 && (
                <h3 className="text-xs font-bold uppercase tracking-wider px-1" style={{ color: "hsl(150 10% 40%)" }}>
                    🏆 Club Challenges
                </h3>
            )}
            {clubs.map(club => (
                <ClubHabitsCard
                    key={club._id}
                    club={club}
                    completingId={completingClubHabitId}
                    loggedIds={loggedClubHabitIds}
                    onLogClubHabit={onLogClubHabit}
                    navigate={navigate}
                    onHabitCount={count => handleCount(club._id, count)}
                />
            ))}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
export function Habits() {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const toast = useToast()
    const [showCreate, setShowCreate] = useState(false)
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
    const [completingId, setCompletingId] = useState<string | null>(null)
    const [completingClubHabitId, setCompletingClubHabitId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)
    const { loggedIds: loggedClubHabitIds, markLogged: markClubHabitLogged } = useTodayLoggedClubHabits()

    const { data: habits = [], isLoading } = useQuery({
        queryKey: ["habits"],
        queryFn: habitService.getHabits,
    })

    const { data: logs = [] } = useQuery({
        queryKey: ["logs"],
        queryFn: () => habitService.getHabitLogs(),
        staleTime: 30_000,
    })

    // User's clubs for Club Challenges section
    const { data: myClubs = [] } = useQuery<Club[]>({
        queryKey: ["clubs", "my"],
        queryFn: clubService.getMyClubs,
    })

    const closeForm = () => {
        setShowCreate(false)
        setEditingHabit(null)
        setForm(emptyForm)
    }

    const createMutation = useMutation({
        mutationFn: (data: Partial<Habit>) => habitService.createHabit(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["habits"] })
            closeForm()
            toast.success("Habit created!", "Start your streak today 🔥")
        },
        onError: (e: any) => toast.error("Failed to create habit", e?.response?.data?.message),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Habit> }) => habitService.updateHabit(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["habits"] })
            closeForm()
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => habitService.deleteHabit(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["habits"] })
            toast.info("Habit deleted")
        },
    })

    const logMutation = useMutation({
        mutationFn: (id: string) => habitService.logHabit(id),
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: ["logs"] })
            await queryClient.cancelQueries({ queryKey: ["habits"] })
            const prevLogs = queryClient.getQueryData(["logs"])
            const prevHabits = queryClient.getQueryData(["habits"])
            // Optimistically add a synthetic log entry
            queryClient.setQueryData(["logs"], (old: any[] | undefined) => [
                ...(old || []),
                { _id: `optimistic-${id}-${Date.now()}`, habitId: id, completedAt: new Date().toISOString(), xpEarned: 0 },
            ])
            // Optimistically bump the streak
            queryClient.setQueryData(["habits"], (old: any[] | undefined) =>
                (old || []).map((h: any) => h._id === id ? { ...h, currentStreak: (h.currentStreak || 0) + 1 } : h)
            )
            setCompletingId(null)
            toast.success("Habit logged! 🔥")
            return { prevLogs, prevHabits }
        },
        onSuccess: (data: any) => {
            const xp = data?.xpEarned ?? data?.log?.xpEarned ?? 0
            if (xp > 0) toast.xp(xp, "XP earned! ⚡")
        },
        onError: (e: any, _id: string, context: any) => {
            if (context?.prevLogs) queryClient.setQueryData(["logs"], context.prevLogs)
            if (context?.prevHabits) queryClient.setQueryData(["habits"], context.prevHabits)
            setCompletingId(null)
            toast.error("Failed to log habit", e?.response?.data?.message)
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["habits"] })
            queryClient.invalidateQueries({ queryKey: ["stats"] })
            queryClient.invalidateQueries({ queryKey: ["logs"] })
        },
    })

    const logClubHabitMutation = useMutation({
        mutationFn: ({ clubId, habitId, habitName: _n }: { clubId: string; habitId: string; habitName: string }) =>
            clubService.logClubHabit(clubId, habitId),
        onMutate: async ({ habitId, habitName }) => {
            markClubHabitLogged(habitId)
            setCompletingClubHabitId(null)
            toast.success(`${habitName} logged! 🏆`)
            return { habitId }
        },
        onSuccess: (data: any, { habitName }) => {
            const xp = data?.xpEarned ?? 0
            if (xp > 0) toast.xp(xp, `${habitName} +${xp} XP! 🏆`)
        },
        onError: (e: any, { habitId }) => {
            setCompletingClubHabitId(null)
            const msg: string = e?.response?.data?.message || e?.message || ""
            if (msg.toLowerCase().includes("already logged")) {
                markClubHabitLogged(habitId)
            } else {
                toast.error("Failed to log club habit", msg)
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["habits"] })
            queryClient.invalidateQueries({ queryKey: ["stats"] })
            queryClient.invalidateQueries({ queryKey: ["logs"] })
        },
    })

    const todayStr = new Date().toISOString().slice(0, 10)
    const todayCompletedIds = new Set(
        (logs as any[]).filter((l: any) => l.completedAt?.slice(0, 10) === todayStr).map((l: any) => l.habitId)
    )

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const payload = { ...form }
        if (form.frequency !== "CUSTOM") {
            payload.targetDays = []
        }
        if (editingHabit) {
            updateMutation.mutate({ id: editingHabit._id, data: payload })
        } else {
            createMutation.mutate(payload)
        }
    }

    const startEdit = (habit: Habit) => {
        setEditingHabit(habit)
        setForm({
            name: habit.name, description: habit.description || "",
            category: habit.category, frequency: habit.frequency,
            difficulty: typeof habit.difficulty === 'number' ? habit.difficulty : 2,
            targetValue: habit.targetValue || 1,
            targetDays: habit.targetDays || [],
        })
        setShowCreate(true)
    }

    const toggleDay = (day: number) => {
        setForm(f => ({
            ...f,
            targetDays: f.targetDays.includes(day)
                ? f.targetDays.filter(d => d !== day)
                : [...f.targetDays, day].sort((a, b) => a - b)
        }))
    }

    const formatTargetDays = (days: number[]) => {
        if (!days || days.length === 0) return ""
        return days.map(d => DAYS[d]).join(", ")
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "hsl(150 10% 95%)" }}>
                        Habit Configuration
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "hsl(150 10% 50%)" }}>
                        Manage your habit protocols and behavioral mode
                    </p>
                </div>
                <button
                    onClick={() => {
                        if (showCreate && !editingHabit) {
                            closeForm()
                        } else {
                            setEditingHabit(null)
                            setForm(emptyForm)
                            setShowCreate(true)
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}
                >
                    <Plus className="h-4 w-4" />
                    New Protocol
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Habits List */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    {/* Create/Edit Form */}
                    {showCreate && (
                        <div className="surface-card p-5">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "var(--green)" }}>
                                {editingHabit ? "Edit Protocol" : "Create Habit Protocol"}
                            </h3>
                            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Habit Name *</label>
                                        <input
                                            required
                                            value={form.name}
                                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            placeholder="e.g. Morning Run"
                                            className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1"
                                            style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Description</label>
                                        <input
                                            value={form.description}
                                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                            placeholder="Optional description"
                                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                            style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Category</label>
                                        <select
                                            value={form.category}
                                            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                            style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Frequency</label>
                                        <select
                                            value={form.frequency}
                                            onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                            style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                                        >
                                            {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                    {/* Custom days selector */}
                                    {form.frequency === "CUSTOM" && (
                                        <div className="col-span-2">
                                            <label className="text-xs font-semibold mb-2 block" style={{ color: "hsl(150 10% 55%)" }}>Select Days</label>
                                            <div className="flex gap-1 flex-wrap">
                                                {DAYS.map((day, idx) => (
                                                    <button key={idx} type="button"
                                                        onClick={() => toggleDay(idx)}
                                                        className="px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                                                        style={{
                                                            background: form.targetDays.includes(idx) ? "var(--green-dim)" : "hsl(150 15% 10%)",
                                                            color: form.targetDays.includes(idx) ? "var(--green)" : "hsl(150 10% 50%)",
                                                            border: form.targetDays.includes(idx) ? "1px solid rgba(19,236,106,0.3)" : "1px solid hsl(150 15% 16%)"
                                                        }}>
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Difficulty</label>
                                        <select
                                            value={form.difficulty}
                                            onChange={e => setForm(f => ({ ...f, difficulty: Number(e.target.value) }))}
                                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                            style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                                        >
                                            {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Target Value</label>
                                        <input
                                            type="number" min={1}
                                            value={form.targetValue}
                                            onChange={e => setForm(f => ({ ...f, targetValue: Number(e.target.value) }))}
                                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                            style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button type="submit"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="flex-1 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                                        style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}>
                                        {editingHabit
                                            ? (updateMutation.isPending ? "Saving..." : "Save Changes")
                                            : (createMutation.isPending ? "Creating..." : "Create Habit")}
                                    </button>
                                    <button type="button" onClick={closeForm}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold"
                                        style={{ background: "hsl(150 15% 10%)", color: "hsl(150 10% 60%)" }}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Personal Habits List */}
                    <div className="surface-card p-5">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "hsl(150 10% 60%)" }}>
                            Active Protocols ({habits.length})
                        </h3>
                        {isLoading ? (
                            <div className="text-sm py-4" style={{ color: "hsl(150 10% 40%)" }}>Loading...</div>
                        ) : habits.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-sm mb-2" style={{ color: "hsl(150 10% 40%)" }}>No habits configured yet.</div>
                                <button onClick={() => setShowCreate(true)} className="text-sm underline" style={{ color: "var(--green)" }}>
                                    Create your first protocol →
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {habits.map((habit: Habit) => {
                                    const done = todayCompletedIds.has(habit._id)
                                    const isCompleting = completingId === habit._id
                                    return (
                                        <div key={habit._id} className="habit-card flex items-center gap-3">
                                            <button
                                                className={`complete-btn ${done ? "completed" : ""}`}
                                                disabled={done || isCompleting}
                                                onClick={() => {
                                                    if (!done) {
                                                        setCompletingId(habit._id)
                                                        logMutation.mutate(habit._id)
                                                    }
                                                }}
                                            >
                                                {done && <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(150 30% 4%)" }} />}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-semibold ${done ? "line-through opacity-50" : ""}`}
                                                        style={{ color: "hsl(150 10% 90%)" }}>
                                                        {habit.name}
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                                        style={{ background: categoryBg[habit.category] || categoryBg.OTHER, color: categoryColors[habit.category] || categoryColors.OTHER }}>
                                                        {habit.category}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs flex items-center gap-1" style={{ color: "#f97316" }}>
                                                        <Flame className="h-3 w-3" /> {habit.currentStreak || 0}d streak
                                                    </span>
                                                    <span className="text-xs flex items-center gap-1" style={{ color: "var(--green)" }}>
                                                        <Zap className="h-3 w-3" /> {habit.xpValue || 10} XP
                                                    </span>
                                                    <span className="text-xs" style={{ color: "hsl(150 10% 45%)" }}>
                                                        {habit.frequency === "CUSTOM" && habit.targetDays && habit.targetDays.length > 0
                                                            ? formatTargetDays(habit.targetDays)
                                                            : habit.frequency}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button onClick={() => startEdit(habit)}
                                                    className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                                                    style={{ color: "hsl(150 10% 45%)" }}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button onClick={() => deleteMutation.mutate(habit._id)}
                                                    className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                                                    style={{ color: "hsl(0 60% 55%)" }}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Club Challenges ── */}
                    {myClubs.length > 0 && (
                        <ClubChallengesWrapper
                            clubs={myClubs}
                            completingClubHabitId={completingClubHabitId}
                            loggedClubHabitIds={loggedClubHabitIds}
                            onLogClubHabit={(clubId, habitId, habitName) => {
                                setCompletingClubHabitId(habitId)
                                logClubHabitMutation.mutate({ clubId, habitId, habitName })
                            }}
                            navigate={navigate}
                        />
                    )}
                </div>

                {/* Right: Mode Selector */}
                <div className="flex flex-col gap-4">
                    <div className="surface-card p-5">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "hsl(150 10% 60%)" }}>
                            Behavioral Mode
                        </h3>
                        <div className="flex flex-col gap-3">
                            {modes.map((mode) => (
                                <div key={mode.id} className="p-3 rounded-lg cursor-pointer transition-all"
                                    style={{ background: "hsl(150 15% 10%)", border: `1px solid hsl(150 12% 16%)` }}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <mode.icon className="h-4 w-4" style={{ color: mode.color }} />
                                        <span className="text-sm font-semibold" style={{ color: "hsl(150 10% 85%)" }}>{mode.label}</span>
                                    </div>
                                    <p className="text-xs" style={{ color: "hsl(150 10% 45%)" }}>{mode.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="surface-card p-5">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "hsl(150 10% 60%)" }}>
                            Your Performance
                        </h3>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs" style={{ color: "hsl(150 10% 50%)" }}>Total Habits</span>
                                <span className="text-sm font-bold" style={{ color: "hsl(150 10% 85%)" }}>{habits.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs" style={{ color: "hsl(150 10% 50%)" }}>Completed Today</span>
                                <span className="text-sm font-bold" style={{ color: "var(--green)" }}>{todayCompletedIds.size}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs" style={{ color: "hsl(150 10% 50%)" }}>Completion Rate</span>
                                <span className="text-sm font-bold" style={{ color: "var(--green)" }}>
                                    {habits.length > 0 ? Math.round((todayCompletedIds.size / habits.length) * 100) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
