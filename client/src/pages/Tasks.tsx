import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { taskService, type Task, type TaskDifficulty, TASK_XP } from "@/services/taskService"
import { useToast } from "@/contexts/ToastContext"
import { useNotifications } from "@/hooks/useNotifications"
import { useConfetti } from "@/hooks/useConfetti"
import { Plus, CheckCircle2, Trash2, ListTodo, Zap, Clock, Target } from "lucide-react"

const DIFFICULTIES: { key: TaskDifficulty; label: string; color: string; bg: string }[] = [
    { key: "EASY", label: "Easy", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    { key: "MEDIUM", label: "Medium", color: "#eab308", bg: "rgba(234,179,8,0.12)" },
    { key: "HARD", label: "Hard", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
    { key: "EPIC", label: "Epic", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
]

function DiffBadge({ diff }: { diff: TaskDifficulty }) {
    const d = DIFFICULTIES.find(x => x.key === diff) || DIFFICULTIES[0]
    return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: d.bg, color: d.color }}>
            {d.label.toUpperCase()}
        </span>
    )
}

export function Tasks() {
    const qc = useQueryClient()
    const toast = useToast()
    const { notify } = useNotifications()
    const { confetti } = useConfetti()
    const [showForm, setShowForm] = useState(false)
    const [title, setTitle] = useState("")
    const [desc, setDesc] = useState("")
    const [diff, setDiff] = useState<TaskDifficulty>("MEDIUM")

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ["tasks"],
        queryFn: taskService.getTasks,
    })

    const { data: stats } = useQuery({
        queryKey: ["tasks-stats"],
        queryFn: taskService.getStats,
    })

    const createMutation = useMutation({
        mutationFn: () => taskService.createTask(title.trim(), diff, desc.trim() || undefined),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["tasks"] })
            qc.invalidateQueries({ queryKey: ["tasks-stats"] })
            setTitle(""); setDesc(""); setDiff("MEDIUM"); setShowForm(false)
            toast.success("Task forged! 🔥")
        },
        onError: (e: any) => toast.error("Failed to create task", e?.response?.data?.message || e?.message),
    })

    const completeMutation = useMutation({
        mutationFn: (taskId: string) => taskService.completeTask(taskId),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ["tasks"] })
            qc.invalidateQueries({ queryKey: ["tasks-stats"] })
            qc.invalidateQueries({ queryKey: ["profile"] })
            toast.xp(data.xpEarned, "Task completed!")
            notify("Task completed! ⚡", `+${data.xpEarned} XP earned`)
            confetti()
        },
        onError: (e: any) => toast.error("Failed to complete task", e?.response?.data?.message || e?.message),
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

    const pending = (tasks as Task[]).filter(t => !t.isCompleted)
    const completed = (tasks as Task[]).filter(t => t.isCompleted)

    return (
        <div className="flex flex-col gap-6" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "hsl(150 10% 95%)" }}>
                        Task Forge
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "hsl(150 10% 50%)" }}>
                        One-off tasks with difficulty-based XP rewards
                    </p>
                </div>
                <button onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                    style={{ background: "#13ec6a", color: "hsl(150 30% 4%)", boxShadow: "0 0 16px rgba(19,236,106,0.35)" }}>
                    <Plus className="h-4 w-4" /> Forge Task
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total Tasks", value: stats?.total ?? 0, icon: ListTodo, color: "#3b82f6" },
                    { label: "Completed Today", value: stats?.completedToday ?? 0, icon: CheckCircle2, color: "#22c55e" },
                    { label: "XP Earned Today", value: `${stats?.xpEarnedToday ?? 0} XP`, icon: Zap, color: "#13ec6a" },
                    { label: "Pending", value: stats?.pending ?? 0, icon: Clock, color: "#f97316" },
                ].map(s => (
                    <div key={s.label} className="surface-card p-4 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
                            style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
                            <s.icon className="h-4 w-4" style={{ color: s.color }} />
                        </div>
                        <div>
                            <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                            <div className="text-xs" style={{ color: "hsl(150 10% 50%)" }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-40 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.7)" }}>
                    <div className="w-full max-w-md rounded-2xl p-6 mx-4"
                        style={{ background: "hsl(150 20% 8%)", border: "1px solid hsl(150 15% 14%)" }}>
                        <h2 className="text-lg font-bold mb-4" style={{ color: "hsl(150 10% 90%)" }}>
                            Forge a New Task
                        </h2>
                        <div className="flex flex-col gap-4">
                            <input
                                autoFocus
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Task title…"
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                style={{ background: "hsl(150 20% 11%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                                onKeyDown={e => e.key === "Enter" && title.trim() && createMutation.mutate()}
                            />
                            <input
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                placeholder="Description (optional)"
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                style={{ background: "hsl(150 20% 11%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                            />
                            {/* Difficulty picker */}
                            <div className="grid grid-cols-4 gap-2">
                                {DIFFICULTIES.map(d => (
                                    <button key={d.key}
                                        onClick={() => setDiff(d.key)}
                                        className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-bold transition-all"
                                        style={{
                                            background: diff === d.key ? d.bg : "hsl(150 20% 11%)",
                                            border: `1px solid ${diff === d.key ? d.color : "hsl(150 15% 15%)"}`,
                                            color: diff === d.key ? d.color : "hsl(150 10% 50%)",
                                        }}>
                                        {d.label}
                                        <span className="text-[10px] opacity-70">+{TASK_XP[d.key]} XP</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2 mt-5">
                            <button onClick={() => setShowForm(false)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ background: "hsl(150 20% 11%)", color: "hsl(150 10% 60%)", border: "1px solid hsl(150 15% 15%)" }}>
                                Cancel
                            </button>
                            <button
                                onClick={() => createMutation.mutate()}
                                disabled={!title.trim() || createMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-40 disabled:scale-100"
                                style={{ background: "#13ec6a", color: "hsl(150 30% 4%)" }}>
                                {createMutation.isPending ? "Creating…" : "Forge Task"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Task lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending */}
                <div className="surface-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="h-4 w-4" style={{ color: "#f97316" }} />
                        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>
                            Pending
                        </h2>
                        <span className="ml-auto badge-green" style={{ background: "rgba(249,115,22,0.12)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)" }}>
                            {pending.length}
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-8 text-sm" style={{ color: "hsl(150 10% 40%)" }}>Loading…</div>
                    ) : pending.length === 0 ? (
                        <div className="text-center py-8 flex flex-col items-center gap-2" style={{ color: "hsl(150 10% 40%)" }}>
                            <CheckCircle2 className="h-8 w-8 opacity-20" />
                            <span className="text-sm">All clear! Forge a new task to get started.</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pending.map((task: Task) => (
                                <div key={task._id} className="group/task flex items-start gap-3 py-2.5 px-3 rounded-xl cursor-default transition-all duration-200"
                                    style={{ background: "hsl(150 20% 9%)", border: "1px solid hsl(150 15% 12%)" }}>
                                    <button
                                        onClick={() => !completeMutation.isPending && completeMutation.mutate(task._id)}
                                        className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full border-2 transition-all hover:scale-110"
                                        style={{ borderColor: "#13ec6a" }}
                                        title="Mark complete"
                                    />
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <div
                                            className="overflow-hidden transition-all duration-300 ease-in-out"
                                            style={{ maxHeight: "var(--task-expanded, 1.35rem)" }}
                                            onMouseEnter={e => (e.currentTarget.style.maxHeight = "12rem")}
                                            onMouseLeave={e => (e.currentTarget.style.maxHeight = "1.35rem")}
                                        >
                                            <div className="text-sm font-semibold leading-snug break-words" style={{ color: "hsl(150 10% 88%)" }}>
                                                {task.title}
                                            </div>
                                            {task.description && (
                                                <div className="text-xs mt-0.5 break-words" style={{ color: "hsl(150 10% 45%)" }}>{task.description}</div>
                                            )}
                                        </div>
                                    </div>
                                    <DiffBadge diff={task.difficulty} />
                                    <span className="text-xs font-bold flex-shrink-0" style={{ color: "#13ec6a" }}>
                                        +{TASK_XP[task.difficulty]} XP
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

                {/* Completed */}
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
                            No completed tasks yet
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {completed.map((task: Task) => (
                                <div key={task._id} className="group/task flex items-start gap-3 py-2.5 px-3 rounded-xl opacity-60 cursor-default"
                                    style={{ background: "hsl(150 20% 8%)", border: "1px solid hsl(150 15% 10%)" }}>
                                    <CheckCircle2 className="flex-shrink-0 mt-0.5 h-5 w-5" style={{ color: "#22c55e" }} />
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <div
                                            className="overflow-hidden transition-all duration-300 ease-in-out"
                                            style={{ maxHeight: "1.35rem" }}
                                            onMouseEnter={e => (e.currentTarget.style.maxHeight = "12rem")}
                                            onMouseLeave={e => (e.currentTarget.style.maxHeight = "1.35rem")}
                                        >
                                            <div className="text-sm font-semibold line-through leading-snug break-words" style={{ color: "hsl(150 10% 75%)" }}>
                                                {task.title}
                                            </div>
                                        </div>
                                    </div>
                                    <DiffBadge diff={task.difficulty} />
                                    <span className="text-xs font-semibold flex-shrink-0" style={{ color: "#22c55e" }}>
                                        +{task.xpEarned ?? TASK_XP[task.difficulty]} XP
                                    </span>
                                    <button onClick={() => deleteMutation.mutate(task._id)}
                                        className="flex-shrink-0 p-1 rounded-lg opacity-40 hover:opacity-100"
                                        style={{ color: "#ef4444" }}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
