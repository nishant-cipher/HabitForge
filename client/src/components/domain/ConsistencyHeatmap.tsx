import { useMemo } from "react"
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts"

interface ConsistencyHeatmapProps {
    logs: any[]
    habits?: any[]
    weeks?: number
}

// ── Colour palette for categories ─────────────────────────────────
const CAT_COLORS: Record<string, string> = {
    HEALTH: "#13ec6a",
    FITNESS: "#13ec6a",
    LEARNING: "#3b82f6",
    PRODUCTIVITY: "#f59e0b",
    SOCIAL: "#ec4899",
    MINDFULNESS: "#8b5cf6",
    OTHER: "#6b7280",
}


// ── Heatmap colour ─────────────────────────────────────────────────
function getHeatColor(count: number, max: number) {
    if (count === 0) return "hsl(150 15% 10%)"
    const t = Math.min(count / max, 1)
    if (t < 0.25) return "rgba(19,236,106,0.2)"
    if (t < 0.5) return "rgba(19,236,106,0.4)"
    if (t < 0.75) return "rgba(19,236,106,0.65)"
    return "rgba(19,236,106,0.9)"
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// ── Radar / Category hexagon (pure SVG) ───────────────────────────
function CategoryRadar({ data }: { data: { label: string; value: number; color: string }[] }) {
    if (data.length === 0) return null
    const cx = 150, cy = 150, r = 90
    const n = data.length
    const max = Math.max(1, ...data.map(d => d.value))
    const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2

    const polyPoints = data.map((d, i) => {
        const a = angleFor(i)
        const len = (d.value / max) * r
        return [cx + Math.cos(a) * len, cy + Math.sin(a) * len]
    })

    const rings = [0.25, 0.5, 0.75, 1]

    return (
        <svg viewBox="0 0 300 300" className="w-full h-full" overflow="visible">
            {/* Rings */}
            {rings.map(frac => {
                const pts = data.map((_, i) => {
                    const a = angleFor(i)
                    return `${cx + Math.cos(a) * r * frac},${cy + Math.sin(a) * r * frac}`
                })
                return (
                    <polygon
                        key={frac}
                        points={pts.join(" ")}
                        fill="none"
                        stroke="hsl(150 15% 15%)"
                        strokeWidth={1}
                    />
                )
            })}
            {/* Axis lines */}
            {data.map((_, i) => {
                const a = angleFor(i)
                return (
                    <line
                        key={i}
                        x1={cx} y1={cy}
                        x2={cx + Math.cos(a) * r}
                        y2={cy + Math.sin(a) * r}
                        stroke="hsl(150 15% 18%)"
                        strokeWidth={1}
                    />
                )
            })}
            {/* Filled polygon (use first color or green) */}
            <polygon
                points={polyPoints.map(p => p.join(",")).join(" ")}
                fill="rgba(19,236,106,0.1)"
                stroke="#13ec6a"
                strokeWidth={1.5}
            />
            {/* Per-category colored dots */}
            {polyPoints.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={4}
                    fill={data[i].color}
                    stroke="hsl(150 20% 8%)"
                    strokeWidth={1}
                />
            ))}
            {/* Labels */}
            {data.map((d, i) => {
                const a = angleFor(i)
                const lx = cx + Math.cos(a) * (r + 40)
                const ly = cy + Math.sin(a) * (r + 40)
                return (
                    <g key={i}>
                        <text
                            x={lx} y={ly - 6}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={10}
                            fill={d.color}
                            fontFamily="Manrope, sans-serif"
                            fontWeight="700"
                            letterSpacing="0.3"
                        >
                            {d.label}
                        </text>
                        <text
                            x={lx} y={ly + 7}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={8}
                            fill="hsl(150 10% 40%)"
                            fontFamily="Manrope, sans-serif"
                        >
                            {d.value}
                        </text>
                    </g>
                )
            })}
        </svg>
    )
}

// ── Main component ────────────────────────────────────────────────
export function ConsistencyHeatmap({ logs, habits = [], weeks = 26 }: ConsistencyHeatmapProps) {
    const { cells, maxCount, barData, radarData } = useMemo(() => {
        const now = new Date()
        const totalDays = weeks * 7
        const countMap: Record<string, number> = {}
        const catCounts: Record<string, number> = {}

        // Build habitId → category lookup
        const habitCatMap: Record<string, string> = {}
        habits.forEach((h: any) => {
            if (h._id && h.category) habitCatMap[h._id] = h.category.toUpperCase()
        })

        logs.forEach((l: any) => {
            const d = l.completedAt?.slice(0, 10)
            if (d) countMap[d] = (countMap[d] || 0) + 1

            // Category breakdown
            const cat = (habitCatMap[l.habitId] || l.category || "OTHER").toUpperCase()
            catCounts[cat] = (catCounts[cat] || 0) + 1
        })

        // Heatmap cells
        const cells = []
        for (let i = totalDays - 1; i >= 0; i--) {
            const d = new Date(now)
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().slice(0, 10)
            cells.push({ date: dateStr, count: countMap[dateStr] || 0 })
        }

        // Bar chart: last 7 days
        const barData = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(now)
            d.setDate(d.getDate() - (6 - i))
            const dateStr = d.toISOString().slice(0, 10)
            return {
                day: d.toLocaleDateString("en-US", { weekday: "short" }),
                count: countMap[dateStr] || 0,
            }
        })

        // Radar: derive axes from the user's actual habits (DB categories only)
        const habitCats = [...new Set(
            habits.map((h: any) => h.category?.toUpperCase()).filter(Boolean)
        )]
        // Fall back to any category that has logs if habits list is empty
        const activeCats = habitCats.length > 0
            ? habitCats
            : [...new Set(Object.keys(catCounts))]
        // Need at least 3 points for a polygon; pad with zeros from DB categories if needed
        const padded = activeCats.length >= 3 ? activeCats : [...new Set([...activeCats, ...Object.keys(CAT_COLORS)])].slice(0, Math.max(3, activeCats.length))
        const radarData = padded.map((c: string) => ({
            label: c,
            value: catCounts[c] || 0,
            color: CAT_COLORS[c] || "#6b7280",
        }))

        const maxCount = Math.max(1, ...Object.values(countMap))
        return { cells, maxCount, barData, radarData }
    }, [logs, habits, weeks])

    // Group into weekly columns
    const columns: typeof cells[] = []
    for (let w = 0; w < weeks; w++) {
        columns.push(cells.slice(w * 7, (w + 1) * 7))
    }

    const barMax = Math.max(1, ...barData.map(b => b.count))

    return (
        <div className="flex flex-col gap-5">
            {/* ── Row: Heatmap (flex-1) + Divider + Radar (flex-1) ── */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                {/* Heatmap side — cells stretch to fill available width */}
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(150 10% 40%)" }}>
                        Completion history (6 months)
                    </p>
                    <div className="flex gap-[3px] w-full">
                        {/* Day labels — fixed width */}
                        <div className="flex flex-col gap-[3px] flex-shrink-0" style={{ width: 18 }}>
                            <div style={{ height: 14 }} />
                            {DAYS.map(d => (
                                <div key={d} className="text-[9px] flex items-center" style={{ color: "hsl(150 10% 35%)", height: 14 }}>{d[0]}</div>
                            ))}
                        </div>
                        {/* Columns — each flex-1 so they share remaining width */}
                        {columns.map((week, wi) => {
                            const firstDate = week[0]?.date
                            const monthLabel = firstDate ? new Date(firstDate).toLocaleDateString("en-US", { month: "short" }) : ""
                            const showMonth = wi === 0 || (firstDate && new Date(firstDate).getDate() <= 7)
                            return (
                                <div key={wi} className="flex-1 flex flex-col gap-[3px] min-w-0">
                                    <div className="text-[9px]" style={{ color: "hsl(150 10% 35%)", height: 14, overflow: "hidden" }}>
                                        {showMonth ? monthLabel : ""}
                                    </div>
                                    {week.map(cell => (
                                        <div
                                            key={cell.date}
                                            title={`${cell.date}: ${cell.count} completions`}
                                            className="rounded-sm cursor-default"
                                            style={{
                                                width: "100%",
                                                maxWidth: 18,
                                                aspectRatio: "1 / 1",
                                                background: getHeatColor(cell.count, maxCount),
                                                border: "1px solid hsl(150 15% 11%)",
                                            }}
                                        />
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px]" style={{ color: "hsl(150 10% 35%)" }}>Less</span>
                        {[0, 0.25, 0.5, 0.75, 1].map(v => (
                            <div key={v} className="h-3 w-3 rounded-sm"
                                style={{ background: v === 0 ? "hsl(150 15% 10%)" : `rgba(19,236,106,${v * 0.9 + 0.1})` }} />
                        ))}
                        <span className="text-[10px]" style={{ color: "hsl(150 10% 35%)" }}>More</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px self-stretch" style={{ background: "hsl(150 15% 13%)" }} />
                <div className="block sm:hidden h-px w-full" style={{ background: "hsl(150 15% 13%)" }} />

                {/* Radar side */}
                <div className="flex flex-col items-center gap-2 w-full sm:w-[280px] sm:flex-shrink-0" >
                    <p className="text-[10px] font-semibold uppercase tracking-wider self-start" style={{ color: "hsl(150 10% 40%)" }}>
                        Habit category breakdown
                    </p>
                    <div className="w-full" style={{ aspectRatio: "1 / 1" }}>
                        <CategoryRadar data={radarData} />
                    </div>
                </div>
            </div>

            {/* ── Bar Chart: last 7 days ── */}
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(150 10% 40%)" }}>
                    Last 7 days — completions
                </p>
                <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={barData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap="25%">
                        <XAxis
                            dataKey="day"
                            tick={{ fill: "hsl(150 10% 45%)", fontSize: 11, fontFamily: "Manrope, sans-serif" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: "hsl(150 10% 35%)", fontSize: 9 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{ background: "hsl(150 20% 8%)", border: "1px solid hsl(150 15% 14%)", borderRadius: 8 }}
                            labelStyle={{ color: "hsl(150 10% 60%)", fontSize: 11, fontFamily: "Manrope, sans-serif" }}
                            itemStyle={{ color: "#13ec6a", fontSize: 11 }}
                            formatter={(v: any) => [`${v} completion${v !== 1 ? "s" : ""}`]}
                            cursor={{ fill: "rgba(255,255,255,0.025)" }}
                        />
                        <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={48}>
                            {barData.map((entry, i) => {
                                const intensity = entry.count / barMax
                                return (
                                    <Cell
                                        key={i}
                                        fill={
                                            entry.count > 0
                                                ? `rgba(19,236,106,${0.25 + intensity * 0.7})`
                                                : "hsl(150 15% 11%)"
                                        }
                                        stroke={entry.count > 0 ? `rgba(19,236,106,${0.3 + intensity * 0.4})` : "none"}
                                        strokeWidth={1}
                                    />
                                )
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
