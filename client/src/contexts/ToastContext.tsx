import { createContext, useContext, useState, useCallback, useRef } from "react"
import { CheckCircle2, XCircle, AlertCircle, Zap, X } from "lucide-react"

export type ToastType = "success" | "error" | "info" | "xp"

export interface Toast {
    id: string
    type: ToastType
    title: string
    message?: string
    duration?: number
}

interface ToastContextValue {
    showToast: (opts: Omit<Toast, "id">) => void
    success: (title: string, message?: string) => void
    error: (title: string, message?: string) => void
    info: (title: string, message?: string) => void
    xp: (amount: number, label?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error("useToast must be used within ToastProvider")
    return ctx
}

const TOAST_CONFIG = {
    success: {
        icon: CheckCircle2,
        color: "#13ec6a",
        bg: "rgba(19,236,106,0.08)",
        border: "rgba(19,236,106,0.25)",
        iconBg: "rgba(19,236,106,0.15)",
    },
    error: {
        icon: XCircle,
        color: "#ef4444",
        bg: "rgba(239,68,68,0.08)",
        border: "rgba(239,68,68,0.25)",
        iconBg: "rgba(239,68,68,0.15)",
    },
    info: {
        icon: AlertCircle,
        color: "#3b82f6",
        bg: "rgba(59,130,246,0.08)",
        border: "rgba(59,130,246,0.25)",
        iconBg: "rgba(59,130,246,0.15)",
    },
    xp: {
        icon: Zap,
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.08)",
        border: "rgba(245,158,11,0.25)",
        iconBg: "rgba(245,158,11,0.15)",
    },
}

function ToastItem({ toast, onDismiss }: { toast: Toast & { removing?: boolean }; onDismiss: () => void }) {
    const cfg = TOAST_CONFIG[toast.type]
    const Icon = cfg.icon

    return (
        <div
            className="toast-item"
            style={{
                background: `hsl(150 20% 7%)`,
                border: `1px solid ${cfg.border}`,
                borderRadius: "12px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                minWidth: "300px",
                maxWidth: "380px",
                boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${cfg.border}`,
                position: "relative",
                overflow: "hidden",
                animation: toast.removing ? "toastOut 0.35s ease forwards" : "toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}
        >
            {/* Accent bar */}
            <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: "3px",
                background: cfg.color, borderRadius: "12px 0 0 12px"
            }} />

            {/* Icon */}
            <div style={{
                width: 32, height: 32, borderRadius: "8px", flexShrink: 0,
                background: cfg.iconBg, display: "flex", alignItems: "center", justifyContent: "center"
            }}>
                <Icon style={{ color: cfg.color, width: 16, height: 16 }} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "hsl(150 10% 92%)", lineHeight: 1.3 }}>
                    {toast.title}
                </div>
                {toast.message && (
                    <div style={{ fontSize: "12px", color: "hsl(150 10% 55%)", marginTop: "2px", lineHeight: 1.4 }}>
                        {toast.message}
                    </div>
                )}
            </div>

            {/* Dismiss */}
            <button onClick={onDismiss} style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "hsl(150 10% 40%)", flexShrink: 0, padding: "2px",
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "4px", transition: "color 0.15s",
            }}
                onMouseOver={e => (e.currentTarget.style.color = "hsl(150 10% 70%)")}
                onMouseOut={e => (e.currentTarget.style.color = "hsl(150 10% 40%)")}
            >
                <X size={14} />
            </button>

            {/* Progress bar */}
            <div style={{
                position: "absolute", bottom: 0, left: 0, height: "2px",
                background: cfg.color, borderRadius: "0 0 12px 12px",
                animation: `toastProgress ${(toast.duration ?? 4000)}ms linear forwards`,
                opacity: 0.6,
            }} />
        </div>
    )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<(Toast & { removing?: boolean })[]>([])
    const counterRef = useRef(0)

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t))
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350)
    }, [])

    const showToast = useCallback((opts: Omit<Toast, "id">) => {
        const id = `toast-${Date.now()}-${counterRef.current++}`
        const duration = opts.duration ?? 4000
        setToasts(prev => [...prev.slice(-4), { ...opts, id, duration }])
        setTimeout(() => dismiss(id), duration)
    }, [dismiss])

    const success = useCallback((title: string, message?: string) =>
        showToast({ type: "success", title, message }), [showToast])

    const error = useCallback((title: string, message?: string) =>
        showToast({ type: "error", title, message }), [showToast])

    const info = useCallback((title: string, message?: string) =>
        showToast({ type: "info", title, message }), [showToast])

    const xp = useCallback((amount: number, label?: string) =>
        showToast({ type: "xp", title: `+${amount} XP`, message: label ?? "Habit logged!" }), [showToast])

    return (
        <ToastContext.Provider value={{ showToast, success, error, info, xp }}>
            {children}
            {/* Toast portal */}
            <div style={{
                position: "fixed", bottom: "24px", right: "24px",
                zIndex: 9999, display: "flex", flexDirection: "column",
                gap: "10px", alignItems: "flex-end", pointerEvents: "none",
            }}>
                {toasts.map(t => (
                    <div key={t.id} style={{ pointerEvents: "auto" }}>
                        <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}
