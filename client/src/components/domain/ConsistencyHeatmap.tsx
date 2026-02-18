import { useMemo } from "react"

interface ConsistencyHeatmapProps {
    logs: any[]
    weeks?: number
}

export function ConsistencyHeatmap({ logs, weeks = 8 }: ConsistencyHeatmapProps) {
    const { cells, maxCount } = useMemo(() => {
        const now = new Date()
        const totalDays = weeks * 7
        const countMap: Record<string, number> = {}

        logs.forEach((l: any) => {
            const d = l.completedAt?.slice(0, 10)
            if (d) countMap[d] = (countMap[d] || 0) + 1
        })

        const cells = []
        for (let i = totalDays - 1; i >= 0; i--) {
            const d = new Date(now)
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().slice(0, 10)
            cells.push({ date: dateStr, count: countMap[dateStr] || 0 })
        }

        const maxCount = Math.max(1, ...Object.values(countMap))
        return { cells, maxCount }
    }, [logs, weeks])

    const getColor = (count: number) => {
        if (count === 0) return "hsl(150 15% 10%)"
        const intensity = Math.min(count / maxCount, 1)
        if (intensity < 0.25) return "rgba(19,236,106,0.2)"
        if (intensity < 0.5) return "rgba(19,236,106,0.4)"
        if (intensity < 0.75) return "rgba(19,236,106,0.65)"
        return "rgba(19,236,106,0.9)"
    }

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    // Group into columns (weeks)
    const columns: typeof cells[] = []
    for (let w = 0; w < weeks; w++) {
        columns.push(cells.slice(w * 7, (w + 1) * 7))
    }

    return (
        <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-max">
                {/* Day labels */}
                <div className="flex flex-col gap-1 mr-1">
                    <div className="h-4" />
                    {dayLabels.map(d => (
                        <div key={d} className="h-4 text-xs flex items-center" style={{ color: "hsl(150 10% 35%)", width: 24 }}>{d[0]}</div>
                    ))}
                </div>
                {/* Heatmap columns */}
                {columns.map((week, wi) => {
                    const firstDate = week[0]?.date
                    const monthLabel = firstDate ? new Date(firstDate).toLocaleDateString("en-US", { month: "short" }) : ""
                    const showMonth = wi === 0 || (firstDate && new Date(firstDate).getDate() <= 7)
                    return (
                        <div key={wi} className="flex flex-col gap-1">
                            <div className="h-4 text-xs" style={{ color: "hsl(150 10% 35%)", fontSize: 10 }}>
                                {showMonth ? monthLabel : ""}
                            </div>
                            {week.map((cell) => (
                                <div
                                    key={cell.date}
                                    title={`${cell.date}: ${cell.count} completions`}
                                    className="h-4 w-4 rounded-sm cursor-default transition-all"
                                    style={{ background: getColor(cell.count), border: "1px solid hsl(150 15% 12%)" }}
                                />
                            ))}
                        </div>
                    )
                })}
            </div>
            <div className="flex items-center gap-2 mt-3">
                <span className="text-xs" style={{ color: "hsl(150 10% 35%)" }}>Less</span>
                {[0, 0.25, 0.5, 0.75, 1].map(v => (
                    <div key={v} className="h-3 w-3 rounded-sm"
                        style={{ background: v === 0 ? "hsl(150 15% 10%)" : `rgba(19,236,106,${v * 0.9 + 0.1})` }} />
                ))}
                <span className="text-xs" style={{ color: "hsl(150 10% 35%)" }}>More</span>
            </div>
        </div>
    )
}
