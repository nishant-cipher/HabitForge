import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts"
import { useMemo } from "react"

interface XPChartProps {
    logs: any[]
    days?: number
}

export function XPChart({ logs, days = 7 }: XPChartProps) {
    const data = useMemo(() => {
        const now = new Date()
        const result = []
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now)
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().slice(0, 10)
            const dayLogs = logs.filter((l: any) => l.completedAt?.slice(0, 10) === dateStr)
            const xp = dayLogs.reduce((sum: number, l: any) => sum + (l.xpEarned || 10), 0)
            result.push({
                date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                xp,
                completions: dayLogs.length,
            })
        }
        return result
    }, [logs, days])

    const hasData = data.some(d => d.xp > 0)

    if (!hasData) {
        return (
            <div className="flex items-center justify-center h-40 text-sm" style={{ color: "hsl(150 10% 35%)" }}>
                Complete habits to see your XP momentum
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#13ec6a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#13ec6a" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 12%)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "hsl(150 10% 40%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(150 10% 40%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                    contentStyle={{ background: "hsl(150 20% 8%)", border: "1px solid hsl(150 15% 14%)", borderRadius: 8, color: "hsl(150 10% 90%)" }}
                    labelStyle={{ color: "hsl(150 10% 60%)", fontSize: 12 }}
                    formatter={(val: any) => [`${val} XP`, "XP Earned"]}
                />
                <Area type="monotone" dataKey="xp" stroke="#13ec6a" strokeWidth={2} fill="url(#xpGradient)" dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    )
}
