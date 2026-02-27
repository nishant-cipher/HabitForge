import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { useTodayLoggedClubHabits } from "@/hooks/useTodayLoggedClubHabits"
import { scheduleEndOfDayReminder } from "@/hooks/useNotifications"
import { useConfetti } from "@/hooks/useConfetti"
import { habitService } from "@/services/habitService"
import { clubService, type Club, type ClubHabit } from "@/services/clubService"
import { taskService, type Task, TASK_XP } from "@/services/taskService"
import api from "@/services/api"
import { Flame, Zap, CheckCircle2, Trophy, Calendar, Target, ShieldCheck, Sliders, ListTodo, ChevronRight, ExternalLink } from "lucide-react"
import { XPChart } from "@/components/domain/XPChart"
import { ConsistencyHeatmap } from "@/components/domain/ConsistencyHeatmap"

const categoryColors: Record<string, string> = {
    HEALTH: "#13ec6a", LEARNING: "#3b82f6", PRODUCTIVITY: "#f59e0b",
    SOCIAL: "#ec4899", MINDFULNESS: "#8b5cf6", OTHER: "#6b7280",
    FITNESS: "#13ec6a",
}
const categoryBg: Record<string, string> = {
    HEALTH: "rgba(19,236,106,0.12)", LEARNING: "rgba(59,130,246,0.12)", PRODUCTIVITY: "rgba(245,158,11,0.12)",
    SOCIAL: "rgba(236,72,153,0.12)", MINDFULNESS: "rgba(139,92,246,0.12)", OTHER: "rgba(107,114,128,0.12)",
    FITNESS: "rgba(19,236,106,0.12)",
}
const MODE_INFO: Record<string, { label: string; color: string; bg: string }> = {
    DISCIPLINE: { label: "Discipline", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    BALANCED: { label: "Balanced", color: "#eab308", bg: "rgba(234,179,8,0.12)" },
    COMPETITIVE: { label: "Competitive", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
}

// ── Club Challenges Section ────────────────────────────────────────────────
interface ClubChallengesSectionProps {
    clubs: Club[]
    completingId: string | null
    loggedClubHabitIds: Set<string>
    onLogClubHabit: (clubId: string, habitId: string, habitName: string) => void
    navigate: ReturnType<typeof useNavigate>
}

/** Shows "Club Challenges" label + cards only when >=1 club actually has habits */
function ClubChallengesSection({ clubs, completingId, loggedClubHabitIds, onLogClubHabit, navigate }: ClubChallengesSectionProps) {
    // habitCounts[clubId] is set once the child query resolves
    const [habitCounts, setHabitCounts] = useState<Record<string, number>>({})
    const totalHabits = Object.values(habitCounts).reduce((s, n) => s + n, 0)

    const handleCount = (clubId: string, count: number) =>
        setHabitCounts(prev => prev[clubId] === count ? prev : { ...prev, [clubId]: count })

    return (
        <div className="flex flex-col gap-3">
            {totalHabits > 0 && (
                <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" style={{ color: "#f59e0b" }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>
                        Club Challenges
                    </h2>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {clubs.map(club => (
                    <ClubHabitsInDashboard
                        key={club._id}
                        club={club}
                        completingId={completingId}
                        loggedClubHabitIds={loggedClubHabitIds}
                        onLogClubHabit={onLogClubHabit}
                        navigate={navigate}
                        onHabitCount={count => handleCount(club._id, count)}
                    />
                ))}
            </div>
        </div>
    )
}

function ClubHabitsInDashboard({ club, completingId, loggedClubHabitIds, onLogClubHabit, navigate, onHabitCount }: {
    club: Club
    completingId: string | null
    loggedClubHabitIds: Set<string>
    onLogClubHabit: (clubId: string, habitId: string, habitName: string) => void
    navigate: ReturnType<typeof useNavigate>
    onHabitCount?: (count: number) => void
}) {
    const { data: habits = [], isLoading } = useQuery<ClubHabit[]>({
        queryKey: ["club-habits", club._id],
        queryFn: () => clubService.getClubHabits(club._id),
        staleTime: 60_000,
    })

    // Notify parent of habit count once query resolves
    useEffect(() => {
        if (!isLoading) onHabitCount?.(habits.length)
    }, [isLoading, habits.length, onHabitCount])

    if (isLoading || habits.length === 0) return null

    return (
        <div className="surface-card p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 55%)" }}>
                    🏆 {club.name}
                </h3>
                <button onClick={() => navigate(`/clubs/${club._id}`)}
                    className="flex items-center gap-1 text-xs" style={{ color: "var(--green)" }}>
                    View <ExternalLink className="h-3 w-3" />
                </button>
            </div>
            <div className="flex flex-col gap-2">
                {habits.map(habit => {
                    const hColor = categoryColors[habit.category || "OTHER"] || "#6b7280"
                    const hBg = categoryBg[habit.category || "OTHER"] || "rgba(107,114,128,0.12)"
                    const isCompleting = completingId === habit._id
                    const isLogged = loggedClubHabitIds.has(habit._id)
                    const isDone = isLogged || isCompleting
                    return (
                        <div key={habit._id} className="flex items-center gap-3 py-1.5"
                            style={{ borderBottom: "1px solid hsl(150 15% 11%)" }}>
                            <button
                                className={`complete-btn ${isDone ? "completed" : ""}`}
                                disabled={isDone}
                                onClick={() => { if (!isDone) onLogClubHabit(club._id, habit._id, habit.name) }}>
                                {isDone && <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(150 30% 4%)" }} />}
                            </button>
                            <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: hBg, color: hColor }}>
                                <Target className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-semibold truncate ${isDone ? "line-through opacity-50" : ""}`}
                                    style={{ color: "hsl(150 10% 88%)" }}>{habit.name}</div>
                                <div className="text-xs" style={{ color: "hsl(150 10% 45%)" }}>{habit.category} · {habit.frequency}</div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}


export function Dashboard() {
    const { user } = useAuth()
    const qc = useQueryClient()
    const navigate = useNavigate()
    const toast = useToast()
    const { confetti } = useConfetti()
    const [completingHabitId, setCompletingHabitId] = useState<string | null>(null)
    const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)
    const [completingClubHabitId, setCompletingClubHabitId] = useState<string | null>(null)
    const { loggedIds: loggedClubHabitIds, markLogged: markClubHabitLogged } = useTodayLoggedClubHabits()

    // ── Queries ───────────────────────────────────────────────────────────────
    const { data: habits = [] } = useQuery({ queryKey: ["habits"], queryFn: habitService.getHabits })

    const { data: allStats = [] } = useQuery({
        queryKey: ["stats"],
        queryFn: habitService.getAllStats,
        staleTime: 30_000,
    })

    const { data: logs = [] } = useQuery({
        queryKey: ["logs"],
        queryFn: () => habitService.getHabitLogs(),
        staleTime: 30_000,
    })

    const { data: profile } = useQuery({
        queryKey: ["profile"],
        queryFn: async () => { const r = await api.get("/users/profile"); return r.data.data || r.data },
        staleTime: 60_000,
    })

    const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: taskService.getTasks })

    const { data: myClubs = [] } = useQuery<Club[]>({
        queryKey: ["clubs", "my"],
        queryFn: clubService.getMyClubs,
        staleTime: 60_000,
    })

    // ── Habit log mutation ────────────────────────────────────────────────────
    const logHabitMutation = useMutation({
        mutationFn: (id: string) => habitService.logHabit(id),
        onSuccess: (data: any, id: string) => {
            qc.invalidateQueries({ queryKey: ["habits"] })
            qc.invalidateQueries({ queryKey: ["stats"] })
            qc.invalidateQueries({ queryKey: ["logs"] })
            setCompletingHabitId(null)
            const habitName = habits.find((h: any) => h._id === id)?.name
            const xp = data?.xpEarned ?? data?.log?.xpEarned ?? 0
            toast.xp(xp, habitName ? `${habitName} logged! 🔥` : "Habit logged! Keep the streak going 🔥")
            confetti()
        },
        onError: (e: any) => {
            setCompletingHabitId(null)
            toast.error("Failed to log habit", e?.response?.data?.message)
        },
    })

    // ── Club habit log mutation ───────────────────────────────────────────────
    const logClubHabitMutation = useMutation({
        mutationFn: ({ clubId, habitId, habitName: _habitName }: { clubId: string; habitId: string; habitName: string }) =>
            clubService.logClubHabit(clubId, habitId),
        onSuccess: (data: any, { habitId, habitName }) => {
            qc.invalidateQueries({ queryKey: ["habits"] })
            qc.invalidateQueries({ queryKey: ["stats"] })
            qc.invalidateQueries({ queryKey: ["logs"] })
            setCompletingClubHabitId(null)
            markClubHabitLogged(habitId)
            const xp = data?.xpEarned ?? 0
            toast.xp(xp, `${habitName} logged! 🏆`)
            confetti()
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
    })

    // ── Task complete mutation ─────────────────────────────────────────────────
    const completeTaskMutation = useMutation({
        mutationFn: (id: string) => taskService.completeTask(id),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["tasks"] })
            qc.invalidateQueries({ queryKey: ["tasks-stats"] })
            qc.invalidateQueries({ queryKey: ["profile"] })
            setCompletingTaskId(null)
            toast.xp(data.xpEarned, "Task completed! 🎯")
            confetti()
        },
        onError: (e: any) => {
            setCompletingTaskId(null)
            toast.error("Failed to complete task", e?.response?.data?.message)
        },
    })

    // ── Grace card mutation ───────────────────────────────────────────────────
    const useGraceCardMutation = useMutation({
        mutationFn: (type: "silver" | "gold") => habitService.useGraceCard(type),
        onSuccess: (_, type) => {
            qc.invalidateQueries({ queryKey: ["profile"] })
            if (type === "gold") toast.success("Gold Card used!", "Full day forgiven 🌟")
            else toast.success("Silver Card used!", "Habit forgiven 🛡️")
        },
        onError: (e: any) => toast.error("Grace card failed", e?.response?.data?.message),
    })

    // ── Derived values ────────────────────────────────────────────────────────
    const now = new Date()
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    const todayStr = now.toISOString().slice(0, 10)

    const topStreak = (allStats as any[]).reduce((max: number, s: any) => Math.max(max, s.currentStreak || 0), 0)
    const totalCompletions = (allStats as any[]).reduce((sum: number, s: any) => sum + (s.totalCompletions || 0), 0)
    const totalXP = profile?.xp ?? (user as any)?.xp ?? 0
    const level = profile?.level ?? (user as any)?.level ?? 1

    const todayCompletedIds = new Set(
        (logs as any[]).filter((l: any) => l.completedAt?.slice(0, 10) === todayStr).map((l: any) => l.habitId)
    )
    const todayHabits = (habits as any[]).filter((h: any) => h.isActive !== false)
    const pendingTasks = (tasks as Task[]).filter(t => !t.isCompleted)
    const pendingHabitCount = todayHabits.filter((h: any) => !todayCompletedIds.has(h._id)).length
    const pendingTaskCount = pendingTasks.length

    // ── Schedule end-of-day OS notification via Service Worker ────────────────
    // Fires once per calendar day at 9 PM if there are items left to do.
    useEffect(() => {
        if (pendingHabitCount === 0 && pendingTaskCount === 0) return
        scheduleEndOfDayReminder(pendingHabitCount, pendingTaskCount, 0)
    }, [pendingHabitCount, pendingTaskCount])

    const graceSilver = profile?.graceSilverCards || 0
    const graceGold = profile?.graceGoldCards || 0
    const currentMode = profile?.mode || (user as any)?.mode || "BALANCED"
    const modeInfo = MODE_INFO[currentMode] || MODE_INFO.BALANCED

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "hsl(150 10% 95%)" }}>
                        Command Center
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "hsl(150 10% 50%)" }}>
                        {dateStr}
                        {topStreak > 0 && (
                            <span className="ml-3 inline-flex items-center gap-1 font-semibold" style={{ color: "var(--green)" }}>
                                <Flame className="h-4 w-4" /> {topStreak}d streak
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate("/mode")}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
                        style={{ background: modeInfo.bg, color: modeInfo.color, border: `1px solid ${modeInfo.color}30` }}>
                        <Sliders className="h-3 w-3" /> {modeInfo.label} Mode
                    </button>
                    <div className="text-right">
                        <div className="text-sm font-semibold" style={{ color: "hsl(150 10% 80%)" }}>{user?.username}</div>
                        <div className="text-xs" style={{ color: "hsl(150 10% 50%)" }}>Level {level}</div>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Best Streak", value: `${topStreak}d`, icon: Flame, color: "#f97316" },
                    { label: "Total XP", value: totalXP.toLocaleString(), icon: Zap, color: "var(--green)" },
                    { label: "Completions", value: totalCompletions.toLocaleString(), icon: CheckCircle2, color: "#3b82f6" },
                    { label: "Level", value: level, icon: Trophy, color: "#f59e0b" },
                ].map(s => (
                    <div key={s.label} className="surface-card p-5 flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                            style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
                            <s.icon className="h-5 w-5" style={{ color: s.color }} />
                        </div>
                        <div>
                            <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                            <div className="text-xs font-medium" style={{ color: "hsl(150 10% 50%)" }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Habits + XP Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Habits */}
                <div className="lg:col-span-1 surface-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="h-4 w-4" style={{ color: "var(--green)" }} />
                        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>
                            Today's Habits
                        </h2>
                        <span className="ml-auto badge-green">
                            {todayCompletedIds.size}/{todayHabits.length}
                        </span>
                    </div>

                    <div className="flex flex-col gap-2">
                        {todayHabits.length === 0 ? (
                            <div className="text-center py-6 text-sm" style={{ color: "hsl(150 10% 40%)" }}>
                                No habits yet.{" "}
                                <button onClick={() => navigate("/habits")} className="underline" style={{ color: "var(--green)" }}>
                                    Create one →
                                </button>
                            </div>
                        ) : (
                            todayHabits.map((habit: any) => {
                                const done = todayCompletedIds.has(habit._id)
                                const isLoading = completingHabitId === habit._id
                                return (
                                    <div key={habit._id} className="flex items-center gap-3 py-2"
                                        style={{ borderBottom: "1px solid hsl(150 15% 11%)" }}>
                                        <button
                                            className={`complete-btn ${done ? "completed" : ""}`}
                                            disabled={done || isLoading}
                                            onClick={() => {
                                                if (!done && !isLoading) {
                                                    setCompletingHabitId(habit._id)
                                                    logHabitMutation.mutate(habit._id)
                                                }
                                            }}>
                                            {done && <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(150 30% 4%)" }} />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-semibold truncate ${done ? "line-through opacity-50" : ""}`}
                                                style={{ color: "hsl(150 10% 88%)" }}>
                                                {habit.name}
                                            </div>
                                            <div className="text-xs" style={{ color: "hsl(150 10% 45%)" }}>
                                                {habit.category}
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded flex-shrink-0"
                                            style={{
                                                background: categoryBg[habit.category] || categoryBg.OTHER,
                                                color: categoryColors[habit.category] || categoryColors.OTHER,
                                            }}>
                                            {habit.currentStreak || 0}🔥
                                        </span>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* XP Chart */}
                <div className="lg:col-span-2 surface-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="h-4 w-4" style={{ color: "var(--green)" }} />
                        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>
                            XP Momentum
                        </h2>
                    </div>
                    <XPChart logs={logs} />
                </div>
            </div>

            {/* Club Challenges */}
            {myClubs.length > 0 && (
                <ClubChallengesSection
                    clubs={myClubs}
                    completingId={completingClubHabitId}
                    loggedClubHabitIds={loggedClubHabitIds}
                    onLogClubHabit={(clubId, habitId, habitName) => {
                        setCompletingClubHabitId(habitId)
                        logClubHabitMutation.mutate({ clubId, habitId, habitName })
                    }}
                    navigate={navigate}
                />
            )}

            {/* Tasks + Grace Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Tasks with inline complete */}
                <div className="surface-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <ListTodo className="h-4 w-4" style={{ color: "#3b82f6" }} />
                        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>
                            Active Tasks
                        </h2>
                        <button onClick={() => navigate("/tasks")} className="ml-auto flex items-center gap-1 text-xs"
                            style={{ color: "#3b82f6" }}>
                            View all <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>

                    {pendingTasks.length === 0 ? (
                        <div className="text-center py-8 flex flex-col items-center gap-2 text-sm"
                            style={{ color: "hsl(150 10% 40%)" }}>
                            <ListTodo className="h-7 w-7 opacity-30" />
                            No tasks pending •{" "}
                            <button onClick={() => navigate("/tasks")} style={{ color: "#3b82f6" }} className="underline">
                                Forge one →
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pendingTasks.slice(0, 6).map((task: Task) => (
                                <div key={task._id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
                                    style={{ background: "hsl(150 20% 9%)", border: "1px solid hsl(150 15% 12%)" }}>
                                    {/* Inline complete button */}
                                    <button
                                        onClick={() => {
                                            if (completingTaskId !== task._id) {
                                                setCompletingTaskId(task._id)
                                                completeTaskMutation.mutate(task._id)
                                            }
                                        }}
                                        disabled={completingTaskId === task._id}
                                        className="flex-shrink-0 h-5 w-5 rounded-full border-2 transition-all hover:scale-110 hover:bg-green-500/20 disabled:opacity-50"
                                        style={{ borderColor: "#13ec6a" }}
                                        title="Mark complete"
                                    />
                                    <div className="flex-1 text-sm truncate" style={{ color: "hsl(150 10% 85%)" }}>
                                        {task.title}
                                    </div>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                                        style={{
                                            background: { EASY: "rgba(34,197,94,0.12)", MEDIUM: "rgba(234,179,8,0.12)", HARD: "rgba(249,115,22,0.12)", EPIC: "rgba(239,68,68,0.12)" }[task.difficulty],
                                            color: { EASY: "#22c55e", MEDIUM: "#eab308", HARD: "#f97316", EPIC: "#ef4444" }[task.difficulty],
                                        }}>
                                        {task.difficulty}
                                    </span>
                                    <span className="text-xs font-bold flex-shrink-0" style={{ color: "#13ec6a" }}>
                                        +{TASK_XP[task.difficulty]} XP
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Grace Cards */}
                <div className="surface-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck className="h-4 w-4" style={{ color: "#f59e0b" }} />
                        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>
                            Grace Cards
                        </h2>
                        <span className="ml-auto text-xs" style={{ color: "hsl(150 10% 40%)" }}>Earned via streaks</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Silver */}
                        <div className="rounded-xl p-4" style={{ background: "hsl(150 20% 9%)", border: "1px solid hsl(150 15% 14%)" }}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold" style={{ color: "#c0c0c0" }}>Silver</span>
                                <span className="text-xl font-extrabold" style={{ color: "#c0c0c0" }}>{graceSilver}</span>
                            </div>
                            <p className="text-[11px] mb-3" style={{ color: "hsl(150 10% 40%)" }}>Forgives 1 habit • 7d streak</p>
                            <button onClick={() => useGraceCardMutation.mutate("silver")}
                                disabled={graceSilver === 0 || useGraceCardMutation.isPending}
                                className="w-full py-1.5 rounded-lg text-xs font-bold"
                                style={{
                                    background: graceSilver > 0 ? "rgba(192,192,192,0.15)" : "hsl(150 20% 10%)",
                                    border: `1px solid ${graceSilver > 0 ? "rgba(192,192,192,0.3)" : "hsl(150 15% 13%)"}`,
                                    color: graceSilver > 0 ? "#c0c0c0" : "hsl(150 10% 35%)",
                                }}>
                                {graceSilver > 0 ? "Use Silver Card" : "None available"}
                            </button>
                        </div>
                        {/* Gold */}
                        <div className="rounded-xl p-4" style={{ background: "hsl(150 20% 9%)", border: "1px solid hsl(150 15% 14%)" }}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold" style={{ color: "#f59e0b" }}>Gold</span>
                                <span className="text-xl font-extrabold" style={{ color: "#f59e0b" }}>{graceGold}</span>
                            </div>
                            <p className="text-[11px] mb-3" style={{ color: "hsl(150 10% 40%)" }}>Forgives full day • 15d streak</p>
                            <button onClick={() => useGraceCardMutation.mutate("gold")}
                                disabled={graceGold === 0 || useGraceCardMutation.isPending}
                                className="w-full py-1.5 rounded-lg text-xs font-bold"
                                style={{
                                    background: graceGold > 0 ? "rgba(245,158,11,0.15)" : "hsl(150 20% 10%)",
                                    border: `1px solid ${graceGold > 0 ? "rgba(245,158,11,0.3)" : "hsl(150 15% 13%)"}`,
                                    color: graceGold > 0 ? "#f59e0b" : "hsl(150 10% 35%)",
                                }}>
                                {graceGold > 0 ? "Use Gold Card" : "None available"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Consistency Map */}
            <div className="surface-card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4" style={{ color: "var(--green)" }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>
                        Consistency Map
                    </h2>
                </div>
                <ConsistencyHeatmap logs={logs} />
            </div>
        </div>
    )
}
