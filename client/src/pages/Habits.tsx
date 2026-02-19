import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { habitService, type Habit } from "@/services/habitService"
import { Plus, Flame, Zap, Pencil, Trash2, CheckCircle2, Lock, Shield, Swords } from "lucide-react"

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
}
const categoryBg: Record<string, string> = {
    HEALTH: "rgba(19,236,106,0.12)", LEARNING: "rgba(59,130,246,0.12)",
    PRODUCTIVITY: "rgba(245,158,11,0.12)", SOCIAL: "rgba(236,72,153,0.12)",
    MINDFULNESS: "rgba(139,92,246,0.12)", OTHER: "rgba(107,114,128,0.12)",
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

export function Habits() {
    const queryClient = useQueryClient()
    const [showCreate, setShowCreate] = useState(false)
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
    const [completingId, setCompletingId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)

    const { data: habits = [], isLoading } = useQuery({
        queryKey: ["habits"],
        queryFn: habitService.getHabits,
    })

    const { data: logs = [] } = useQuery({
        queryKey: ["logs"],
        queryFn: habitService.getLogs,
        staleTime: 30_000,
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
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Habit> }) => habitService.updateHabit(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["habits"] })
            closeForm()  // Fix: also close form and reset on successful update
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => habitService.deleteHabit(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
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

    const todayStr = new Date().toISOString().slice(0, 10)
    const todayCompletedIds = new Set(
        logs.filter((l: any) => l.completedAt?.slice(0, 10) === todayStr).map((l: any) => l.habitId)
    )

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const payload = { ...form }
        // Only send targetDays if frequency is CUSTOM
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
                                            onChange={e => setForm(f => ({ ...f, frequency: e.target.value, targetDays: [] }))}
                                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                            style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                                        >
                                            {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>

                                    {/* Custom Days Picker — shown only when CUSTOM frequency is selected */}
                                    {form.frequency === "CUSTOM" && (
                                        <div className="col-span-2">
                                            <label className="text-xs font-semibold mb-2 block" style={{ color: "hsl(150 10% 55%)" }}>
                                                Select Days *
                                            </label>
                                            <div className="flex gap-2 flex-wrap">
                                                {DAYS.map((day, idx) => {
                                                    const selected = form.targetDays.includes(idx)
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={day}
                                                            onClick={() => toggleDay(idx)}
                                                            className="w-10 h-10 rounded-lg text-xs font-bold transition-all"
                                                            style={{
                                                                background: selected ? "var(--green)" : "hsl(150 15% 10%)",
                                                                color: selected ? "hsl(150 30% 4%)" : "hsl(150 10% 55%)",
                                                                border: selected ? "none" : "1px solid hsl(150 15% 16%)",
                                                            }}
                                                        >
                                                            {day}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                            {form.targetDays.length === 0 && (
                                                <p className="text-xs mt-1" style={{ color: "hsl(0 60% 55%)" }}>
                                                    Please select at least one day
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Difficulty</label>
                                        <select
                                            value={form.difficulty}
                                            onChange={e => setForm(f => ({ ...f, difficulty: parseInt(e.target.value) }))}
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
                                            onChange={e => setForm(f => ({ ...f, targetValue: parseInt(e.target.value) || 1 }))}
                                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                            style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-1">
                                    <button type="submit"
                                        disabled={
                                            createMutation.isPending || updateMutation.isPending ||
                                            (form.frequency === "CUSTOM" && form.targetDays.length === 0)
                                        }
                                        className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                                        style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}>
                                        {editingHabit
                                            ? (updateMutation.isPending ? "Saving..." : "Update Protocol")
                                            : (createMutation.isPending ? "Creating..." : "Create Protocol")}
                                    </button>
                                    <button type="button" onClick={closeForm}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold"
                                        style={{ background: "hsl(150 15% 12%)", color: "hsl(150 10% 70%)" }}>
                                        Cancel
                                    </button>
                                </div>
                                {(createMutation.error || updateMutation.error) && (
                                    <div className="text-xs text-red-400 mt-1">
                                        {(createMutation.error as any)?.response?.data?.message ||
                                            (updateMutation.error as any)?.response?.data?.message ||
                                            "Failed to save habit"}
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {/* Habits List */}
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
