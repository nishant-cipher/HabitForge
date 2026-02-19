import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Sliders, CheckCircle2, Clock, AlertTriangle, Zap, ShieldCheck, Loader2, ChevronRight } from "lucide-react"
import api from "@/services/api"

const MODES = [
    {
        id: "DISCIPLINE",
        name: "Discipline Mode",
        subtitle: "Monk Mode — Strictest Protocol",
        description: "Maximum XP rewards but zero tolerance for misses. Edits are locked once submitted. A missed day applies a 20% XP penalty.",
        color: "#ef4444",
        glow: "rgba(239,68,68,0.15)",
        border: "rgba(239,68,68,0.3)",
        rules: [
            { icon: "🔒", text: "No log editing after submission" },
            { icon: "⚡", text: "1.5× XP multiplier" },
            { icon: "💀", text: "20% streak penalty on miss" },
            { icon: "🎯", text: "Strict daily deadlines enforced" },
        ],
    },
    {
        id: "BALANCED",
        name: "Balanced Mode",
        subtitle: "Recommended for most users",
        description: "Steady progression with reasonable flexibility. Log edits allowed within 2 hours. A smaller penalty keeps you on track without crushing streaks.",
        color: "#eab308",
        glow: "rgba(234,179,8,0.15)",
        border: "rgba(234,179,8,0.3)",
        rules: [
            { icon: "✏️", text: "2-hour edit window after logging" },
            { icon: "⚡", text: "1.0× XP multiplier (baseline)" },
            { icon: "🤝", text: "10% streak reduction on miss" },
            { icon: "📅", text: "Flexible daily targets" },
        ],
    },
    {
        id: "COMPETITIVE",
        name: "Competitive Mode",
        subtitle: "Speed & Efficiency Bonuses",
        description: "Race against the clock for efficiency bonuses. No editing allowed, but fast completions multiply your XP. Missed days don't penalise — but they won't reward either.",
        color: "#3b82f6",
        glow: "rgba(59,130,246,0.15)",
        border: "rgba(59,130,246,0.3)",
        rules: [
            { icon: "🚀", text: "Speed bonus: up to 1.3× for <5 min" },
            { icon: "⚡", text: "1.2× base XP multiplier" },
            { icon: "🔒", text: "Logs are locked immediately" },
            { icon: "0️⃣", text: "No penalty for missed days" },
        ],
    },
]

export function ModeConfig() {
    const qc = useQueryClient()
    const navigate = useNavigate()
    const [confirmMode, setConfirmMode] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000) }

    const { data: profile, isLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const r = await api.get("/users/profile")
            return r.data.data || r.data
        },
    })

    const changeMutation = useMutation({
        mutationFn: async (mode: string) => {
            const r = await api.put("/users/profile", { mode })
            return r.data
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["profile"] })
            setConfirmMode(null)
            showToast(`Switched to ${data.data?.mode || "new"} mode successfully!`)
        },
        onError: (err: any) => {
            setConfirmMode(null)
            showToast(err?.response?.data?.message || "Failed to change mode")
        },
    })

    const currentMode = profile?.mode || "BALANCED"
    const modeInfo = profile?.modeChangeInfo || { canChange: true, daysRemaining: 0 }
    const canChange = modeInfo.canChange !== false

    const graceSilver = profile?.graceSilverCards || 0
    const graceGold = profile?.graceGoldCards || 0

    return (
        <div className="min-h-screen" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {/* Toast */}
            {toast && (
                <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold animate-fade-in-up"
                    style={{ background: "hsl(150 20% 10%)", border: "1px solid rgba(19,236,106,0.3)", color: "#13ec6a", boxShadow: "0 0 20px rgba(19,236,106,0.1)" }}>
                    {toast}
                </div>
            )}

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Sliders className="h-6 w-6" style={{ color: "#13ec6a" }} />
                    <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "hsl(150 10% 95%)" }}>Habit Engine Mode</h1>
                </div>
                <p className="text-sm" style={{ color: "hsl(150 10% 50%)" }}>
                    Configure your behavioural protocol. Changes are locked for <strong style={{ color: "hsl(150 10% 75%)" }}>15 days</strong> after switching.
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#13ec6a" }} />
                </div>
            ) : (
                <>
                    {/* Cooldown warning */}
                    {!canChange && (
                        <div className="flex items-center gap-3 rounded-xl px-4 py-3.5 mb-6"
                            style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)" }}>
                            <Clock className="h-4 w-4 flex-shrink-0" style={{ color: "#eab308" }} />
                            <div className="text-sm" style={{ color: "#eab308" }}>
                                Mode locked — you can change again in <strong>{modeInfo.daysRemaining} day{modeInfo.daysRemaining !== 1 ? "s" : ""}</strong>.
                            </div>
                        </div>
                    )}

                    {/* Grace Cards panel */}
                    <div className="rounded-xl px-5 py-4 mb-8"
                        style={{ background: "hsl(150 20% 7%)", border: "1px solid hsl(150 15% 12%)" }}>
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="h-4 w-4" style={{ color: "#13ec6a" }} />
                            <span className="text-sm font-bold" style={{ color: "hsl(150 10% 85%)" }}>Grace Cards</span>
                            <span className="text-xs ml-auto" style={{ color: "hsl(150 10% 40%)" }}>Earned at streak milestones</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <GraceCard
                                label="Silver Card"
                                count={graceSilver}
                                color="#c0c0c0"
                                glow="rgba(192,192,192,0.2)"
                                description="Forgives 1 missed habit"
                                earned="Earned at 7-day streak"
                                onUse={() => navigate("/dashboard")}
                            />
                            <GraceCard
                                label="Gold Card"
                                count={graceGold}
                                color="#f59e0b"
                                glow="rgba(245,158,11,0.2)"
                                description="Forgives an entire missed day"
                                earned="Earned at 15-day streak"
                                onUse={() => navigate("/dashboard")}
                            />
                        </div>
                    </div>

                    {/* Mode cards */}
                    <div className="space-y-4">
                        {MODES.map((mode) => {
                            const isActive = currentMode === mode.id
                            return (
                                <div key={mode.id}
                                    className="rounded-2xl p-5 transition-all"
                                    style={{
                                        background: isActive ? mode.glow : "hsl(150 20% 7%)",
                                        border: `1px solid ${isActive ? mode.border : "hsl(150 15% 12%)"}`,
                                        boxShadow: isActive ? `0 0 24px ${mode.glow}` : "none",
                                    }}>
                                    {/* Mode header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {isActive && <CheckCircle2 className="h-4 w-4" style={{ color: mode.color }} />}
                                                <span className="font-extrabold" style={{ color: isActive ? mode.color : "hsl(150 10% 85%)" }}>
                                                    {mode.name}
                                                </span>
                                                {isActive && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                        style={{ background: `${mode.glow}`, color: mode.color, border: `1px solid ${mode.border}` }}>
                                                        ACTIVE
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs mt-0.5" style={{ color: isActive ? mode.color + "cc" : "hsl(150 10% 45%)" }}>
                                                {mode.subtitle}
                                            </div>
                                        </div>

                                        {!isActive && (
                                            <button
                                                onClick={() => canChange ? setConfirmMode(mode.id) : showToast(`Mode locked for ${modeInfo.daysRemaining} more day(s).`)}
                                                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                                                style={{
                                                    background: canChange ? "hsl(150 20% 11%)" : "hsl(150 20% 8%)",
                                                    border: `1px solid ${canChange ? mode.border : "hsl(150 15% 13%)"}`,
                                                    color: canChange ? mode.color : "hsl(150 10% 40%)",
                                                }}>
                                                {canChange ? "Switch" : <><Clock className="h-3 w-3" /> Locked</>}
                                                {canChange && <ChevronRight className="h-3 w-3" />}
                                            </button>
                                        )}
                                    </div>

                                    <p className="text-xs mb-4 leading-relaxed" style={{ color: "hsl(150 10% 50%)" }}>{mode.description}</p>

                                    {/* Rules */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {mode.rules.map((r, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs"
                                                style={{ color: "hsl(150 10% 60%)" }}>
                                                <span>{r.icon}</span>
                                                <span>{r.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {/* Confirm modal */}
            {confirmMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
                    <div className="max-w-sm w-full mx-4 rounded-2xl p-6"
                        style={{ background: "hsl(150 20% 7%)", border: "1px solid rgba(234,179,8,0.3)" }}>
                        <AlertTriangle className="h-6 w-6 mb-3" style={{ color: "#eab308" }} />
                        <h3 className="text-base font-extrabold mb-2" style={{ color: "hsl(150 10% 92%)" }}>Confirm Mode Change</h3>
                        <p className="text-sm mb-5" style={{ color: "hsl(150 10% 55%)" }}>
                            Switching to <strong style={{ color: "hsl(150 10% 85%)" }}>{MODES.find(m => m.id === confirmMode)?.name}</strong> will lock your mode for <strong style={{ color: "#eab308" }}>15 days</strong>. Are you sure?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmMode(null)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ background: "hsl(150 20% 10%)", border: "1px solid hsl(150 15% 15%)", color: "hsl(150 10% 55%)" }}>
                                Cancel
                            </button>
                            <button
                                onClick={() => changeMutation.mutate(confirmMode!)}
                                disabled={changeMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                                style={{ background: "#13ec6a", color: "hsl(150 30% 4%)" }}>
                                {changeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                                Confirm Switch
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

interface GraceCardProps {
    label: string; count: number; color: string; glow: string
    description: string; earned: string; onUse: () => void
}

function GraceCard({ label, count, color, glow, description, earned, onUse }: GraceCardProps) {
    return (
        <div className="rounded-xl px-4 py-3" style={{ background: "hsl(150 20% 9%)", border: "1px solid hsl(150 15% 14%)" }}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold" style={{ color }}>{label}</span>
                <span className="text-lg font-extrabold" style={{ color }}>{count}</span>
            </div>
            <p className="text-[11px] mb-1" style={{ color: "hsl(150 10% 45%)" }}>{description}</p>
            <p className="text-[10px] mb-2" style={{ color: "hsl(150 10% 35%)" }}>{earned}</p>
            <button onClick={onUse} disabled={count === 0}
                className="w-full py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                    background: count > 0 ? glow : "hsl(150 20% 10%)",
                    border: `1px solid ${count > 0 ? color + "40" : "hsl(150 15% 13%)"}`,
                    color: count > 0 ? color : "hsl(150 10% 35%)",
                }}>
                {count > 0 ? "Use on Dashboard" : "None available"}
            </button>
        </div>
    )
}
