import { useQuery } from "@tanstack/react-query"
import { habitService } from "@/services/habitService"
import { analyticsService } from "@/services/analyticsService"
import { XPChart } from "@/components/domain/XPChart"
import { ConsistencyHeatmap } from "@/components/domain/ConsistencyHeatmap"
import { BarChart2, Zap, Flame, CheckCircle2, TrendingUp } from "lucide-react"

const categoryColors: Record<string, string> = {
    HEALTH: "#13ec6a", LEARNING: "#3b82f6", PRODUCTIVITY: "#f59e0b",
    SOCIAL: "#ec4899", MINDFULNESS: "#8b5cf6", OTHER: "#6b7280",
}

export function Analytics() {
    const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: habitService.getStats, staleTime: 30_000 })
    const { data: logs = [] } = useQuery({ queryKey: ["logs"], queryFn: habitService.getLogs, staleTime: 30_000 })
    const { data: habits = [] } = useQuery({ queryKey: ["habits"], queryFn: habitService.getHabits })
    useQuery({ queryKey: ["trends"], queryFn: () => analyticsService.getTrends("MONTHLY"), staleTime: 60_000 })

    const categoryBreakdown = habits.reduce((acc: Record<string, number>, h: any) => {
        acc[h.category] = (acc[h.category] || 0) + 1
        return acc
    }, {})

    const habitStats = stats?.habitStats || []

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "hsl(150 10% 95%)" }}>Behavioral Analytics</h1>
                <p className="text-sm mt-1" style={{ color: "hsl(150 10% 50%)" }}>Advanced insights into your habit performance</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Current Streak", value: `${stats?.currentStreak || 0}d`, icon: Flame, color: "#f97316" },
                    { label: "Longest Streak", value: `${stats?.longestStreak || 0}d`, icon: TrendingUp, color: "var(--green)" },
                    { label: "Total XP", value: (stats?.totalXP || 0).toLocaleString(), icon: Zap, color: "#f59e0b" },
                    { label: "Total Completions", value: (stats?.totalCompletions || 0).toLocaleString(), icon: CheckCircle2, color: "#3b82f6" },
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="surface-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="h-4 w-4" style={{ color: "var(--green)" }} />
                        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>XP Over Time (30 days)</h2>
                    </div>
                    <XPChart logs={logs} days={30} />
                </div>
                <div className="surface-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart2 className="h-4 w-4" style={{ color: "var(--green)" }} />
                        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>Category Breakdown</h2>
                    </div>
                    {Object.keys(categoryBreakdown).length === 0 ? (
                        <div className="text-sm py-8 text-center" style={{ color: "hsl(150 10% 40%)" }}>No habits yet.</div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {Object.entries(categoryBreakdown).map(([cat, count]) => {
                                const pct = Math.round(((count as number) / habits.length) * 100)
                                return (
                                    <div key={cat}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span style={{ color: categoryColors[cat] || "#6b7280" }}>{cat}</span>
                                            <span style={{ color: "hsl(150 10% 55%)" }}>{count as number} ({pct}%)</span>
                                        </div>
                                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(150 15% 12%)" }}>
                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: categoryColors[cat] || "#6b7280" }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="surface-card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-4 w-4" style={{ color: "var(--green)" }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>Consistency Map</h2>
                </div>
                <ConsistencyHeatmap logs={logs} weeks={12} />
            </div>

            {habitStats.length > 0 && (
                <div className="surface-card p-5">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "hsl(150 10% 70%)" }}>Per-Habit Performance</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: "1px solid hsl(150 15% 12%)" }}>
                                    {["Habit", "Streak", "Completions", "Last Done"].map(h => (
                                        <th key={h} className="text-left py-2 px-3 text-xs font-semibold" style={{ color: "hsl(150 10% 45%)" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {habitStats.map((hs: any) => (
                                    <tr key={hs.habitId} style={{ borderBottom: "1px solid hsl(150 15% 10%)" }}>
                                        <td className="py-2 px-3 font-medium" style={{ color: "hsl(150 10% 85%)" }}>{hs.name}</td>
                                        <td className="py-2 px-3">
                                            <span className="flex items-center gap-1 text-xs" style={{ color: "#f97316" }}>
                                                <Flame className="h-3 w-3" />{hs.currentStreak}d
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 text-xs" style={{ color: "var(--green)" }}>{hs.totalCompletions}</td>
                                        <td className="py-2 px-3 text-xs" style={{ color: "hsl(150 10% 45%)" }}>
                                            {hs.lastCompleted ? new Date(hs.lastCompleted).toLocaleDateString() : "Never"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
