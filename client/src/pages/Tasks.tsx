import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    taskService, type Task, type TaskDifficulty, type TaskPriority,
    TASK_XP, PRIORITY_ORDER, type CreateTaskParams, type UpdateTaskParams
} from "@/services/taskService"
import { useToast } from "@/contexts/ToastContext"
import { useNotifications, scheduleTaskReminder } from "@/hooks/useNotifications"
import { useConfetti } from "@/hooks/useConfetti"
import { Plus, CheckCircle2, Trash2, ListTodo, Zap, Clock, Target, Bell, ArrowUpDown, Calendar, Flag, Pencil, X, Check } from "lucide-react"

// ── Constants ─────────────────────────────────────────────────────────────────
const TITLE_MAX = 100
const DESC_MAX = 200

const DIFFICULTIES: { key: TaskDifficulty; label: string; color: string; bg: string }[] = [
    { key: "EASY", label: "Easy", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    { key: "MEDIUM", label: "Medium", color: "#eab308", bg: "rgba(234,179,8,0.12)" },
    { key: "HARD", label: "Hard", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
    { key: "EPIC", label: "Epic", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
]

const PRIORITIES: { key: TaskPriority; label: string; color: string; bg: string }[] = [
    { key: "LOW", label: "Low", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
    { key: "MEDIUM", label: "Medium", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    { key: "HIGH", label: "High", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    { key: "CRITICAL", label: "Critical", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
]

type SortKey = "default" | "deadline" | "difficulty" | "priority"

// ── Helper components ─────────────────────────────────────────────────────────
function DiffBadge({ diff }: { diff: TaskDifficulty }) {
    const d = DIFFICULTIES.find(x => x.key === diff) || DIFFICULTIES[1]
    return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: d.bg, color: d.color }}>
            {d.label.toUpperCase()}
        </span>
    )
}

function PriorityBadge({ p }: { p: TaskPriority }) {
    const info = PRIORITIES.find(x => x.key === p) || PRIORITIES[1]
    return (
        <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: info.bg, color: info.color }}>
            <Flag className="h-2.5 w-2.5" />{info.label.toUpperCase()}
        </span>
    )
}

function DeadlineBadge({ deadline }: { deadline: string }) {
    const dt = new Date(deadline)
    const now = new Date()
    const diffMs = dt.getTime() - now.getTime()
    const diffH = diffMs / 3_600_000
    const overdue = diffMs < 0
    const urgent = !overdue && diffH < 24

    const label = overdue
        ? `Overdue · ${dt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
        : dt.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })

    return (
        <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{
                background: overdue ? "rgba(239,68,68,0.18)" : urgent ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.12)",
                color: overdue ? "#ef4444" : urgent ? "#f59e0b" : "#60a5fa",
            }}>
            <Calendar className="h-2.5 w-2.5" />{label}
        </span>
    )
}

// ── Helpers ──────────────────────────────────────────────────────────────────
/** Format a Date as a local datetime-local value (YYYY-MM-DDTHH:MM) — NO UTC shift */
function toLocalDTString(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function CharCounter({ current, max }: { current: number; max: number }) {
    const over = current > max
    const close = current > max * 0.8
    return (
        <span className="text-[10px] font-mono" style={{ color: over ? "#ef4444" : close ? "#f59e0b" : "hsl(150 10% 40%)" }}>
            {current}/{max}
        </span>
    )
}

/** Cancel an existing task reminder in the Service Worker */
async function cancelTaskReminder(taskId: string) {
    if (!("serviceWorker" in navigator)) return
    try {
        const reg = await navigator.serviceWorker.ready
        reg.active?.postMessage({ type: "CANCEL_TASK_REMINDER", taskId })
    } catch { /* best-effort */ }
}

// ── Main component ─────────────────────────────────────────────────────────────
export function Tasks() {
    const qc = useQueryClient()
    const toast = useToast()
    const { notify } = useNotifications()
    const { confetti } = useConfetti()

    // Create form state
    const [showForm, setShowForm] = useState(false)
    const [title, setTitle] = useState("")
    const [desc, setDesc] = useState("")
    const [diff, setDiff] = useState<TaskDifficulty>("MEDIUM")
    const [priority, setPriority] = useState<TaskPriority | "">("")
    const [deadline, setDeadline] = useState("")
    const [reminder, setReminder] = useState(false)
    const [reminderAt, setReminderAt] = useState("")    // datetime-local string

    // Edit state
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState("")
    const [editDesc, setEditDesc] = useState("")
    const [editPriority, setEditPriority] = useState<TaskPriority | "">("")
    const [editDeadline, setEditDeadline] = useState("")
    const [editReminder, setEditReminder] = useState(false)
    const [editReminderAt, setEditReminderAt] = useState("")  // datetime-local string
    const [editDiff, setEditDiff] = useState<TaskDifficulty>("MEDIUM")

    // Sort state
    const [sortBy, setSortBy] = useState<SortKey>("default")

    const resetForm = () => {
        setTitle(""); setDesc(""); setDiff("MEDIUM")
        setPriority(""); setDeadline(""); setReminder(false); setReminderAt("")
        setShowForm(false)
    }

    const openEdit = (task: Task) => {
        setEditingTaskId(task._id)
        setEditTitle(task.title)
        setEditDesc(task.description ?? "")
        setEditDiff(task.difficulty)
        setEditPriority(task.priority ?? "")
        setEditDeadline(task.deadline ? toLocalDTString(new Date(task.deadline)) : "")
        setEditReminder(task.reminder ?? false)
        setEditReminderAt(task.reminderAt ? toLocalDTString(new Date(task.reminderAt)) : "")
    }

    const closeEdit = () => setEditingTaskId(null)

    // Queries
    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ["tasks"],
        queryFn: taskService.getTasks,
    })

    const { data: stats } = useQuery({
        queryKey: ["tasks-stats"],
        queryFn: taskService.getStats,
    })

    // Mutations
    const createMutation = useMutation({
        mutationFn: () => {
            const params: CreateTaskParams = {
                title: title.trim(),
                difficulty: diff,
                description: desc.trim() || undefined,
                priority: priority || undefined,
                deadline: deadline ? new Date(deadline).toISOString() : undefined,
                reminder,
                reminderAt: reminder && reminderAt ? new Date(reminderAt).toISOString() : undefined,
            }
            return taskService.createTask(params)
        },
        onSuccess: (task) => {
            qc.invalidateQueries({ queryKey: ["tasks"] })
            qc.invalidateQueries({ queryKey: ["tasks-stats"] })
            // Schedule SW reminder at the chosen reminderAt time (falls back to deadline)
            if (task.reminder) {
                const fireAt = task.reminderAt ? new Date(task.reminderAt) : task.deadline ? new Date(task.deadline) : null
                if (fireAt) scheduleTaskReminder(task._id, task.title, fireAt)
            }
            resetForm()
            toast.success("Task forged! 🔥")
        },
        onError: (e: any) => toast.error("Failed to create task", e?.response?.data?.message || e?.message),
    })

    const updateMutation = useMutation({
        mutationFn: ({ taskId, oldDeadline, params }: { taskId: string; oldDeadline?: string; params: UpdateTaskParams }) => {
            // Cancel old reminder before updating
            if (oldDeadline) cancelTaskReminder(taskId)
            return taskService.updateTask(taskId, params)
        },
        onSuccess: (task) => {
            qc.invalidateQueries({ queryKey: ["tasks"] })
            // Reschedule reminder at the chosen reminderAt time (falls back to deadline)
            if (task.reminder) {
                const fireAt = task.reminderAt ? new Date(task.reminderAt) : task.deadline ? new Date(task.deadline) : null
                if (fireAt) scheduleTaskReminder(task._id, task.title, fireAt)
            }
            closeEdit()
            toast.success("Task updated ✏️")
        },
        onError: (e: any) => toast.error("Failed to update task", e?.response?.data?.message || e?.message),
    })

    const completeMutation = useMutation({
        mutationFn: (taskId: string) => taskService.completeTask(taskId),
        onMutate: async (taskId: string) => {
            await qc.cancelQueries({ queryKey: ["tasks"] })
            const prevTasks = qc.getQueryData(["tasks"])
            // Optimistically mark the task as completed
            qc.setQueryData(["tasks"], (old: any[] | undefined) =>
                (old || []).map((t: any) => t._id === taskId ? { ...t, isCompleted: true, completedAt: new Date().toISOString() } : t)
            )
            toast.success("Task completed!")
            notify("Task completed! ⚡", "XP incoming...")
            confetti()
            return { prevTasks }
        },
        onSuccess: (data) => {
            if (data.xpEarned > 0) toast.xp(data.xpEarned, `+${data.xpEarned} XP earned! ⚡`)
        },
        onError: (e: any, _id: string, context: any) => {
            if (context?.prevTasks) qc.setQueryData(["tasks"], context.prevTasks)
            toast.error("Failed to complete task", e?.response?.data?.message || e?.message)
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ["tasks"] })
            qc.invalidateQueries({ queryKey: ["tasks-stats"] })
            qc.invalidateQueries({ queryKey: ["profile"] })
        },
    })

    const clearCompletedMutation = useMutation({
        mutationFn: taskService.clearCompleted,
        onSuccess: (res) => {
            qc.invalidateQueries({ queryKey: ["tasks"] })
            qc.invalidateQueries({ queryKey: ["tasks-stats"] })
            toast.success(`Cleared ${res.deletedCount} completed task${res.deletedCount !== 1 ? "s" : ""}`)
        },
        onError: (e: any) => toast.error("Failed to clear tasks", e?.response?.data?.message || e?.message),
    })

    const deleteMutation = useMutation({
        mutationFn: (taskId: string) => taskService.deleteTask(taskId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["tasks"] })
            qc.invalidateQueries({ queryKey: ["tasks-stats"] })
        },
    })

    // Sort + split pending / completed
    const sortedPending = useMemo(() => {
        const raw = (tasks as Task[]).filter(t => !t.isCompleted)
        if (sortBy === "default") return raw
        return [...raw].sort((a, b) => {
            if (sortBy === "deadline") {
                if (!a.deadline && !b.deadline) return 0
                if (!a.deadline) return 1
                if (!b.deadline) return -1
                return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
            }
            if (sortBy === "difficulty") {
                const order = { EASY: 0, MEDIUM: 1, HARD: 2, EPIC: 3 }
                return (order[b.difficulty] ?? 0) - (order[a.difficulty] ?? 0)
            }
            if (sortBy === "priority") {
                const pa = a.priority ? PRIORITY_ORDER[a.priority] : -1
                const pb = b.priority ? PRIORITY_ORDER[b.priority] : -1
                return pb - pa
            }
            return 0
        })
    }, [tasks, sortBy])

    const completed = (tasks as Task[]).filter(t => t.isCompleted)

    // Deadline min — must be LOCAL time string for datetime-local input
    const todayMin = toLocalDTString(new Date())

    const canCreate = title.trim().length > 0 && title.length <= TITLE_MAX && desc.length <= DESC_MAX
    const canSaveEdit = editTitle.trim().length > 0 && editTitle.length <= TITLE_MAX && editDesc.length <= DESC_MAX

    return (
        <div className="flex flex-col gap-6" style={{ fontFamily: "'Manrope', sans-serif" }}>

            {/* Header */}
            <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "hsl(150 10% 95%)" }}>
                            Task Forge
                        </h1>
                        <p className="text-sm mt-1" style={{ color: "hsl(150 10% 50%)" }}>
                            One-off tasks with difficulty-based XP rewards
                        </p>
                    </div>
                    <button onClick={() => setShowForm(v => !v)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 flex-shrink-0"
                        style={{ background: "#13ec6a", color: "hsl(150 30% 4%)", boxShadow: "0 0 16px rgba(19,236,106,0.35)" }}>
                        <Plus className="h-4 w-4" /> Forge Task
                    </button>
                </div>
                {/* Sort control — scrollable on mobile */}
                <div className="overflow-x-auto pb-0.5">
                    <div className="flex items-center gap-1 p-1 rounded-xl w-max"
                        style={{ background: "hsl(150 15% 9%)", border: "1px solid hsl(150 15% 14%)" }}>
                        <ArrowUpDown className="h-3.5 w-3.5 ml-1 flex-shrink-0" style={{ color: "hsl(150 10% 40%)" }} />
                        {([
                            { key: "default", label: "Default" },
                            { key: "deadline", label: "Deadline" },
                            { key: "difficulty", label: "Difficulty" },
                            { key: "priority", label: "Priority" },
                        ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
                            <button key={key} onClick={() => setSortBy(key)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap"
                                style={{
                                    background: sortBy === key ? "var(--green-dim)" : "transparent",
                                    color: sortBy === key ? "var(--green)" : "hsl(150 10% 45%)",
                                }}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { icon: ListTodo, label: "Total Tasks", value: stats?.total ?? 0, color: "hsl(150 10% 70%)" },
                    { icon: CheckCircle2, label: "Done Today", value: stats?.completedToday ?? 0, color: "#22c55e" },
                    { icon: Zap, label: "XP Today", value: `+${stats?.xpEarnedToday ?? 0}`, color: "#f59e0b" },
                    { icon: Clock, label: "Pending", value: stats?.pending ?? 0, color: "#3b82f6" },
                ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="surface-card p-4 flex flex-col gap-1">
                        <Icon className="h-4 w-4 mb-1" style={{ color }} />
                        <div className="text-xl font-extrabold" style={{ color }}>{value}</div>
                        <div className="text-xs" style={{ color: "hsl(150 10% 45%)" }}>{label}</div>
                    </div>
                ))}
            </div>


            {/* Create Task Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
                    onClick={resetForm}>
                    <div className="surface-card w-full max-w-lg flex flex-col gap-4 p-6 max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}>

                        {/* Modal header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold" style={{ color: "hsl(150 10% 92%)" }}>New Task Protocol</h2>
                                <p className="text-xs mt-0.5" style={{ color: "hsl(150 10% 45%)" }}>Forge a task and earn XP on completion</p>
                            </div>
                            <button onClick={resetForm}
                                className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                                style={{ color: "hsl(150 10% 50%)" }}>
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Title */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold" style={{ color: "hsl(150 10% 55%)" }}>Title *</label>
                                <CharCounter current={title.length} max={TITLE_MAX} />
                            </div>
                            <input value={title} onChange={e => setTitle(e.target.value)}
                                placeholder="What needs to be done?"
                                autoFocus
                                maxLength={TITLE_MAX + 10}
                                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                                style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold" style={{ color: "hsl(150 10% 55%)" }}>Description</label>
                                <CharCounter current={desc.length} max={DESC_MAX} />
                            </div>
                            <textarea value={desc} onChange={e => setDesc(e.target.value)}
                                placeholder="Optional details..."
                                rows={2}
                                maxLength={DESC_MAX + 10}
                                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                                style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                            />
                        </div>

                        {/* Difficulty + Priority */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Difficulty</label>
                                <div className="flex gap-1.5 flex-wrap">
                                    {DIFFICULTIES.map(d => (
                                        <button key={d.key} type="button" onClick={() => setDiff(d.key)}
                                            className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                                            style={{
                                                background: diff === d.key ? d.bg : "hsl(150 15% 10%)",
                                                color: diff === d.key ? d.color : "hsl(150 10% 45%)",
                                                border: `1px solid ${diff === d.key ? d.color + "44" : "hsl(150 15% 16%)"}`,
                                            }}>
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>
                                    Priority <span style={{ color: "hsl(150 10% 35%)" }}>(optional)</span>
                                </label>
                                <div className="flex gap-1.5 flex-wrap">
                                    {PRIORITIES.map(p => (
                                        <button key={p.key} type="button" onClick={() => setPriority(prev => prev === p.key ? "" : p.key)}
                                            className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                                            style={{
                                                background: priority === p.key ? p.bg : "hsl(150 15% 10%)",
                                                color: priority === p.key ? p.color : "hsl(150 10% 45%)",
                                                border: `1px solid ${priority === p.key ? p.color + "44" : "hsl(150 15% 16%)"}`,
                                            }}>
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Deadline + Reminder */}
                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>
                                        Deadline <span style={{ color: "hsl(150 10% 35%)" }}>(optional)</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={deadline}
                                        min={todayMin}
                                        onChange={e => { setDeadline(e.target.value); if (!e.target.value) { setReminder(false); setReminderAt("") } }}
                                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                        style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 80%)" }}
                                    />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <button
                                        type="button"
                                        disabled={!deadline}
                                        onClick={() => { if (deadline) { setReminder(v => !v); setReminderAt("") } }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-30"
                                        style={{
                                            background: reminder ? "rgba(19,236,106,0.12)" : "hsl(150 15% 10%)",
                                            color: reminder ? "var(--green)" : "hsl(150 10% 45%)",
                                            border: `1px solid ${reminder ? "rgba(19,236,106,0.3)" : "hsl(150 15% 16%)"}`,
                                        }}>
                                        <Bell className="h-3.5 w-3.5" />
                                        {reminder ? "Reminder on" : "Set reminder"}
                                    </button>
                                    {!deadline && (
                                        <p className="text-[10px] mt-1" style={{ color: "hsl(150 10% 35%)" }}>Set a deadline to enable reminder</p>
                                    )}
                                </div>
                            </div>
                            {reminder && (
                                <div>
                                    <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>
                                        🔔 Remind me at
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={reminderAt}
                                        min={todayMin}
                                        max={deadline}
                                        onChange={e => setReminderAt(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                        style={{ background: "rgba(19,236,106,0.06)", border: "1px solid rgba(19,236,106,0.25)", color: "hsl(150 10% 85%)" }}
                                    />
                                    <p className="text-[10px] mt-1" style={{ color: "hsl(150 10% 35%)" }}>Pick when you want the notification — before or at the deadline</p>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div style={{ borderTop: "1px solid hsl(150 15% 12%)" }} />

                        {/* XP preview + actions */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs flex items-center gap-1.5" style={{ color: "#f59e0b" }}>
                                <Zap className="h-3.5 w-3.5" /> {TASK_XP[diff]} XP on completion
                            </span>
                            <div className="flex gap-2">
                                <button onClick={resetForm}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold"
                                    style={{ background: "hsl(150 15% 10%)", color: "hsl(150 10% 55%)" }}>
                                    Cancel
                                </button>
                                <button onClick={() => createMutation.mutate()}
                                    disabled={!canCreate || createMutation.isPending}
                                    className="px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                                    style={{ background: "#13ec6a", color: "hsl(150 30% 4%)" }}>
                                    {createMutation.isPending ? "Forging..." : "Forge Task"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Pending Tasks */}
            <div className="surface-card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Target className="h-4 w-4" style={{ color: "#3b82f6" }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>
                        Pending
                    </h2>
                    <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded"
                        style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa" }}>
                        {sortedPending.length}
                    </span>
                </div>

                {isLoading ? (
                    <div className="text-sm py-6 text-center" style={{ color: "hsl(150 10% 40%)" }}>Loading...</div>
                ) : sortedPending.length === 0 ? (
                    <div className="text-center py-8 text-sm" style={{ color: "hsl(150 10% 40%)" }}>
                        No pending tasks. Forge a new one! ⚡
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {sortedPending.map(task => (
                            <div key={task._id}>
                                {/* ── Task row ── */}
                                <div className="flex flex-col gap-1.5 p-3 rounded-xl transition-all"
                                    style={{ background: "hsl(150 15% 10%)", border: `1px solid ${editingTaskId === task._id ? "hsl(150 30% 22%)" : "hsl(150 12% 14%)"}` }}>
                                    <div className="flex items-center gap-3">
                                        {/* Complete button */}
                                        <button
                                            onClick={() => completeMutation.mutate(task._id)}
                                            disabled={completeMutation.isPending}
                                            className="h-5 w-5 rounded-full border-2 flex-shrink-0 transition-all hover:scale-110"
                                            style={{ borderColor: "hsl(150 20% 30%)" }}
                                            title="Mark complete"
                                        />
                                        {/* Title + desc */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold truncate" style={{ color: "hsl(150 10% 90%)" }}>
                                                {task.title}
                                            </div>
                                            {task.description && (
                                                <div className="text-xs truncate mt-0.5" style={{ color: "hsl(150 10% 45%)" }}>
                                                    {task.description}
                                                </div>
                                            )}
                                        </div>
                                        {/* Badges */}
                                        <DiffBadge diff={task.difficulty} />
                                        <span className="text-xs font-bold flex-shrink-0" style={{ color: "#13ec6a" }}>
                                            +{TASK_XP[task.difficulty]} XP
                                        </span>
                                        {/* Edit button */}
                                        <button
                                            onClick={() => editingTaskId === task._id ? closeEdit() : openEdit(task)}
                                            className="flex-shrink-0 p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
                                            style={{ color: editingTaskId === task._id ? "var(--green)" : "hsl(150 10% 60%)" }}
                                            title="Edit task"
                                        >
                                            {editingTaskId === task._id
                                                ? <X className="h-3.5 w-3.5" />
                                                : <Pencil className="h-3.5 w-3.5" />
                                            }
                                        </button>
                                        <button onClick={() => deleteMutation.mutate(task._id)}
                                            className="flex-shrink-0 p-1 rounded-lg opacity-40 hover:opacity-100 transition-opacity"
                                            style={{ color: "#ef4444" }}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    {/* Priority / Deadline labels */}
                                    {(task.priority || task.deadline) && (
                                        <div className="flex items-center gap-1.5 pl-8 flex-wrap">
                                            {task.priority && <PriorityBadge p={task.priority} />}
                                            {task.deadline && <DeadlineBadge deadline={task.deadline} />}
                                            {task.reminder && task.deadline && (
                                                <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                                    style={{ background: "rgba(19,236,106,0.1)", color: "var(--green)" }}>
                                                    <Bell className="h-2.5 w-2.5" /> Reminder set
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* ── Inline Edit Panel ── */}
                                {editingTaskId === task._id && (
                                    <div className="mt-1 p-4 rounded-xl flex flex-col gap-3"
                                        style={{ background: "hsl(150 15% 8%)", border: "1px solid hsl(150 25% 18%)" }}>
                                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--green)" }}>
                                            Edit Task
                                        </p>

                                        {/* Edit Title */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-xs font-semibold" style={{ color: "hsl(150 10% 55%)" }}>Title *</label>
                                                <CharCounter current={editTitle.length} max={TITLE_MAX} />
                                            </div>
                                            <input
                                                value={editTitle}
                                                onChange={e => setEditTitle(e.target.value)}
                                                maxLength={TITLE_MAX + 10}
                                                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                                style={{ background: "hsl(150 15% 12%)", border: "1px solid hsl(150 20% 20%)", color: "hsl(150 10% 90%)" }}
                                            />
                                        </div>

                                        {/* Edit Description */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-xs font-semibold" style={{ color: "hsl(150 10% 55%)" }}>Description</label>
                                                <CharCounter current={editDesc.length} max={DESC_MAX} />
                                            </div>
                                            <textarea
                                                value={editDesc}
                                                onChange={e => setEditDesc(e.target.value)}
                                                rows={2}
                                                maxLength={DESC_MAX + 10}
                                                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                                                style={{ background: "hsl(150 15% 12%)", border: "1px solid hsl(150 20% 20%)", color: "hsl(150 10% 90%)" }}
                                            />
                                        </div>

                                        {/* Edit Difficulty */}
                                        <div>
                                            <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Difficulty</label>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {DIFFICULTIES.map(d => (
                                                    <button key={d.key} type="button"
                                                        onClick={() => setEditDiff(d.key)}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                                                        style={{
                                                            background: editDiff === d.key ? d.bg : "hsl(150 15% 12%)",
                                                            color: editDiff === d.key ? d.color : "hsl(150 10% 45%)",
                                                            border: `1px solid ${editDiff === d.key ? d.color + "44" : "hsl(150 20% 20%)"}`,
                                                        }}>
                                                        {d.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Edit Priority */}
                                        <div>
                                            <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>
                                                Priority <span style={{ color: "hsl(150 10% 35%)" }}>(optional)</span>
                                            </label>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {PRIORITIES.map(p => (
                                                    <button key={p.key} type="button"
                                                        onClick={() => setEditPriority(prev => prev === p.key ? "" : p.key)}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                                                        style={{
                                                            background: editPriority === p.key ? p.bg : "hsl(150 15% 12%)",
                                                            color: editPriority === p.key ? p.color : "hsl(150 10% 45%)",
                                                            border: `1px solid ${editPriority === p.key ? p.color + "44" : "hsl(150 20% 20%)"}`,
                                                        }}>
                                                        {p.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Edit Deadline + Reminder */}
                                        <div className="flex flex-col gap-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>
                                                        Deadline
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={editDeadline}
                                                        min={todayMin}
                                                        onChange={e => {
                                                            setEditDeadline(e.target.value)
                                                            if (!e.target.value) { setEditReminder(false); setEditReminderAt("") }
                                                        }}
                                                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                                        style={{ background: "hsl(150 15% 12%)", border: "1px solid hsl(150 20% 20%)", color: "hsl(150 10% 80%)" }}
                                                    />
                                                </div>
                                                <div className="flex flex-col justify-end">
                                                    <button
                                                        type="button"
                                                        disabled={!editDeadline}
                                                        onClick={() => { if (editDeadline) { setEditReminder(v => !v); setEditReminderAt("") } }}
                                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-30"
                                                        style={{
                                                            background: editReminder ? "rgba(19,236,106,0.12)" : "hsl(150 15% 12%)",
                                                            color: editReminder ? "var(--green)" : "hsl(150 10% 45%)",
                                                            border: `1px solid ${editReminder ? "rgba(19,236,106,0.3)" : "hsl(150 20% 20%)"}`,
                                                        }}>
                                                        <Bell className="h-3.5 w-3.5" />
                                                        {editReminder ? "Reminder on" : "Set reminder"}
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Reminder time picker */}
                                            {editReminder && (
                                                <div>
                                                    <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>
                                                        🔔 Remind me at
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={editReminderAt}
                                                        min={todayMin}
                                                        max={editDeadline}
                                                        onChange={e => setEditReminderAt(e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                                        style={{ background: "rgba(19,236,106,0.06)", border: "1px solid rgba(19,236,106,0.25)", color: "hsl(150 10% 85%)" }}
                                                    />
                                                    <p className="text-[10px] mt-1" style={{ color: "hsl(150 10% 35%)" }}>Pick when you want the notification</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Edit actions */}
                                        <div className="flex justify-end gap-2 pt-1">
                                            <button onClick={closeEdit}
                                                className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                                                style={{ background: "hsl(150 15% 12%)", color: "hsl(150 10% 55%)" }}>
                                                Cancel
                                            </button>
                                            <button
                                                disabled={!canSaveEdit || updateMutation.isPending}
                                                onClick={() => {
                                                    const params: UpdateTaskParams = {
                                                        title: editTitle.trim(),
                                                        description: editDesc.trim() || undefined,
                                                        difficulty: editDiff,
                                                        priority: editPriority || undefined,
                                                        deadline: editDeadline ? new Date(editDeadline).toISOString() : "",
                                                        reminder: editReminder,
                                                        reminderAt: editReminder && editReminderAt ? new Date(editReminderAt).toISOString() : "",
                                                    }
                                                    updateMutation.mutate({ taskId: task._id, oldDeadline: task.deadline, params })
                                                }}
                                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                                style={{ background: "#13ec6a", color: "hsl(150 30% 4%)" }}>
                                                <Check className="h-3.5 w-3.5" />
                                                {updateMutation.isPending ? "Saving..." : "Save"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Completed Tasks */}
            <div className="surface-card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-4 w-4" style={{ color: "#22c55e" }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>
                        Completed
                    </h2>
                    <span className="ml-auto badge-green">{completed.length}</span>
                    {completed.length > 0 && (
                        <button
                            onClick={() => clearCompletedMutation.mutate()}
                            disabled={clearCompletedMutation.isPending}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                            <Trash2 className="h-3 w-3" />
                            {clearCompletedMutation.isPending ? "Clearing..." : "Clear All"}
                        </button>
                    )}
                </div>

                {completed.length === 0 ? (
                    <div className="text-center py-8 text-sm" style={{ color: "hsl(150 10% 40%)" }}>
                        Complete some tasks to see them here
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {completed.map(task => (
                            <div key={task._id} className="flex items-center gap-3 p-3 rounded-xl opacity-60"
                                style={{ background: "hsl(150 15% 9%)", border: "1px solid hsl(150 12% 13%)" }}>
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "#22c55e" }} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm line-through truncate" style={{ color: "hsl(150 10% 65%)" }}>
                                        {task.title}
                                    </div>
                                </div>
                                <DiffBadge diff={task.difficulty} />
                                <span className="text-xs font-bold flex-shrink-0" style={{ color: "#13ec6a" }}>
                                    +{task.xpEarned ?? TASK_XP[task.difficulty]} XP
                                </span>
                                <button onClick={() => deleteMutation.mutate(task._id)}
                                    className="flex-shrink-0 p-1 rounded-lg opacity-40 hover:opacity-100 transition-opacity"
                                    style={{ color: "#ef4444" }}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
