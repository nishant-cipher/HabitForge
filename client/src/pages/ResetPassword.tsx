import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import api from "@/services/api"
import { KeyRound, ArrowLeft, Loader2, Check } from "lucide-react"

export function ResetPassword() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get("token") || ""

    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [message, setMessage] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            setStatus("error")
            setMessage("Passwords do not match")
            return
        }
        if (newPassword.length < 6) {
            setStatus("error")
            setMessage("Password must be at least 6 characters")
            return
        }
        setStatus("loading")
        try {
            const res = await api.post("/auth/reset-password", { token, newPassword })
            setStatus("success")
            setMessage(res.data.message || "Password reset successfully!")
            setTimeout(() => navigate("/login"), 2500)
        } catch (err: any) {
            setStatus("error")
            setMessage(err.response?.data?.message || "Failed to reset password. The link may have expired.")
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "hsl(150 30% 4%)" }}>
                <div className="text-center">
                    <p className="font-semibold mb-2" style={{ color: "#ef4444" }}>Invalid reset link</p>
                    <Link to="/forgot-password" className="text-sm" style={{ color: "var(--green)" }}>Request a new one</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{ background: "hsl(150 30% 4%)" }}>
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-3"
                        style={{ background: "var(--green-dim)", border: "1px solid rgba(19,236,106,0.25)" }}>
                        <KeyRound className="h-6 w-6" style={{ color: "var(--green)" }} />
                    </div>
                    <h1 className="text-2xl font-extrabold" style={{ color: "hsl(150 10% 95%)" }}>Reset Password</h1>
                    <p className="text-sm mt-1" style={{ color: "hsl(150 10% 50%)" }}>Choose a strong new password</p>
                </div>

                <div className="rounded-2xl p-6" style={{ background: "hsl(150 20% 7%)", border: "1px solid hsl(150 15% 13%)" }}>
                    {status === "success" ? (
                        <div className="text-center py-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full mx-auto mb-4"
                                style={{ background: "var(--green-dim)" }}>
                                <Check className="h-6 w-6" style={{ color: "var(--green)" }} />
                            </div>
                            <p className="font-semibold mb-1" style={{ color: "hsl(150 10% 90%)" }}>Password reset!</p>
                            <p className="text-sm" style={{ color: "hsl(150 10% 55%)" }}>{message}</p>
                            <p className="text-xs mt-2" style={{ color: "hsl(150 10% 40%)" }}>Redirecting to login…</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "hsl(150 10% 55%)" }}>
                                    New password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoFocus
                                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                                    style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "hsl(150 10% 55%)" }}>
                                    Confirm new password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                                    style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                                />
                            </div>

                            {status === "error" && (
                                <p className="text-xs font-semibold p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                                    {message}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-bold disabled:opacity-60"
                                style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}
                            >
                                {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                                Reset Password
                            </button>
                        </form>
                    )}
                </div>

                <div className="text-center mt-5">
                    <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
                        style={{ color: "var(--green)" }}>
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to login
                    </Link>
                </div>
            </div>
        </div>
    )
}
