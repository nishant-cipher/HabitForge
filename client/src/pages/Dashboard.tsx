import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { habitService } from "@/services/habitService"
import { Flame, Zap, CheckCircle2, Trophy, Calendar, Target } from "lucide-react"
import { XPChart } from "@/components/domain/XPChart"
import { ConsistencyHeatmap } from "@/components/domain/ConsistencyHeatmap"
import { useState } from "react"

const categoryColors: Record<string, string> = {
    HEALTH: "#13ec6a",
    LEARNING: "#3b82f6",
    PRODUCTIVITY: "#f59e0b",
    SOCIAL: "#ec4899",
    MINDFULNESS: "#8b5cf6",
    OTHER: "#6b7280",
}

const categoryBg: Record<string, string> = {
    HEALTH: "rgba(19,236,106,0.12)",
    LEARNING: "rgba(59,130,246,0.12)",
    PRODUCTIVITY: "rgba(245,158,11,0.12)",
    SOCIAL: "rgba(236,72,153,0.12)",
    MINDFULNESS: "rgba(139,92,246,0.12)",
    OTHER: "rgba(107,114,128,0.12)",
}

export function Dashboard() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [completingId, setCompletingId] = useState<string | null>(null)

    const { data: habits = [] } = useQuery({
        queryKey: ["habits"],
        queryFn: habitService.getHabits,
    })

    const { data: stats } = useQuery({
        queryKey: ["stats"],
        queryFn: habitService.getStats,
        staleTime: 30_000,
    })

    const { data: logs = [] } = useQuery({
        queryKey: ["logs"],
        queryFn: habitService.getLogs,
        staleTime: 30_000,
    })

    const logMutation = useMutation({
        mutationFn: (id: string) => habitService.logHabit(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["habits"] })
            queryClient.invalidateQueries({ queryKey: ["stats"] })
            queryClient.invalidateQueries({ queryKey: ["logs"] })
            setCompletingId(null)
        },
        onError: () => setCompletingId(null),
    })

    const now = new Date()
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })

    const streak = stats?.currentStreak ?? 0
    const totalXP = stats?.totalXP ?? user?.xp ?? 0
    const totalCompletions = stats?.totalCompletions ?? 0
    const level = stats?.level ?? user?.level ?? 1

    // Today's completed habit IDs from logs
    const todayStr = now.toISOString().slice(0, 10)
    const todayCompletedIds = new Set(
        logs
            .filter((l: any) => l.completedAt?.slice(0, 10) === todayStr)
            .map((l: any) => l.habitId)
    )

    const todayHabits = habits.filter((h: any) => h.isActive !== false)

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
                        {streak > 0 && (
                            <span className="ml-3 inline-flex items-center gap-1 font-semibold" style={{ color: "var(--green)" }}>
                                <Flame className="h-4 w-4" /> {streak} Day Streak
                            </span>
                        )}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: "hsl(150 10% 80%)" }}>{user?.username}</div>
                    <div className="text-xs" style={{ color: "hsl(150 10% 50%)" }}>Level {level}</div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Current Streak", value: `${streak}d`, icon: Flame, color: "#f97316" },
                    { label: "Total XP", value: totalXP.toLocaleString(), icon: Zap, color: "var(--green)" },
                    { label: "Completions", value: totalCompletions.toLocaleString(), icon: CheckCircle2, color: "#3b82f6" },
                    { label: "Level", value: level, icon: Trophy, color: "#f59e0b" },
                ].map((stat) => (
                    <div key={stat.label} className="surface-card p-5 flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                            style={{ background: `${stat.color}18`, border: `1px solid ${stat.color}30` }}>
                            <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                        </div>
                        <div>
                            <div className="text-2xl font-extrabold" style={{ color: stat.color }}>{stat.value}</div>
                            <div className="text-xs font-medium" style={{ color: "hsl(150 10% 50%)" }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Missions */}
                <div className="lg:col-span-1 surface-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="h-4 w-4" style={{ color: "var(--green)" }} />
                        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>
                            Today's Missions
                        </h2>
                        <span className="ml-auto badge-green">{todayCompletedIds.size}/{todayHabits.length}</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {todayHabits.length === 0 ? (
                            <div className="text-center py-6 text-sm" style={{ color: "hsl(150 10% 40%)" }}>
                                No habits yet. <a href="/habits" className="underline" style={{ color: "var(--green)" }}>Create one →</a>
                            </div>
                        ) : (
                            todayHabits.map((habit: any) => {
                                const done = todayCompletedIds.has(habit._id)
                                const isCompleting = completingId === habit._id
                                return (
                                    <div key={habit._id} className="flex items-center gap-3 py-2"
                                        style={{ borderBottom: "1px solid hsl(150 15% 11%)" }}>
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
                                            <div className={`text-sm font-semibold truncate ${done ? "line-through opacity-50" : ""}`}
                                                style={{ color: "hsl(150 10% 88%)" }}>
                                                {habit.name}
                                            </div>
                                            <div className="text-xs" style={{ color: "hsl(150 10% 45%)" }}>
                                                {habit.category} • {habit.xpValue || 10} XP
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded"
                                                style={{
                                                    background: categoryBg[habit.category] || categoryBg.OTHER,
                                                    color: categoryColors[habit.category] || categoryColors.OTHER,
                                                }}>
                                                {habit.currentStreak || 0}🔥
                                            </span>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* XP Momentum Chart */}
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
