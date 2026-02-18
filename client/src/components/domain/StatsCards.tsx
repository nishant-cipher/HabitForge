import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Flame, CalendarCheck, Loader2 } from "lucide-react"
import api from "@/services/api"

interface AllStats {
    totalXP?: number;
    currentStreak?: number;
    longestStreak?: number;
    totalCompletions?: number;
    perfectDays?: number;
}

async function fetchStats(): Promise<AllStats> {
    try {
        const response = await api.get("/gamification/stats/all")
        return response.data.data || {}
    } catch {
        return {}
    }
}

export function StatsCards() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["stats"],
        queryFn: fetchStats,
        staleTime: 60_000,
    })

    const cards = [
        {
            title: "Current Streak",
            value: isLoading ? "—" : `${stats?.currentStreak ?? 0} Days`,
            icon: Flame,
            color: "text-orange-500",
            sub: stats?.longestStreak ? `Best: ${stats.longestStreak} days` : "Keep it up!",
        },
        {
            title: "Total XP",
            value: isLoading ? "—" : (stats?.totalXP ?? 0).toLocaleString(),
            icon: Trophy,
            color: "text-yellow-500",
            sub: "Experience points earned",
        },
        {
            title: "Total Completions",
            value: isLoading ? "—" : `${stats?.totalCompletions ?? 0}`,
            icon: CalendarCheck,
            color: "text-green-500",
            sub: "Habits completed",
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((stat) => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {stat.title}
                        </CardTitle>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {stat.value}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stat.sub}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
