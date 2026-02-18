import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/services/api"
import { Zap } from "lucide-react"

export function Register() {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)
        try {
            const response = await api.post("/auth/register", { username, email, password })
            const { accessToken, user } = response.data.data
            login(accessToken, user)
            navigate("/dashboard")
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to register")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "hsl(150 30% 4%)" }}>
            <div className="w-full max-w-sm">
                <div className="flex items-center gap-3 justify-center mb-8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}>
                        <Zap className="h-5 w-5" fill="currentColor" />
                    </div>
                    <span className="text-xl font-extrabold" style={{ color: "hsl(150 10% 95%)" }}>HabitEngine</span>
                </div>

                <div className="surface-card p-6">
                    <h1 className="text-xl font-bold mb-1" style={{ color: "hsl(150 10% 95%)" }}>Create your account</h1>
                    <p className="text-sm mb-5" style={{ color: "hsl(150 10% 50%)" }}>Start your habit transformation journey</p>

                    {error && (
                        <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "hsl(0 60% 60%)", border: "1px solid rgba(239,68,68,0.2)" }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Username</label>
                            <input
                                id="username" type="text" required
                                value={username} onChange={e => setUsername(e.target.value)}
                                placeholder="alexchen"
                                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                                style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Email</label>
                            <input
                                id="email" type="email" required
                                value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                                style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Password</label>
                            <input
                                id="password" type="password" required minLength={6}
                                value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                                style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                            />
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full py-2.5 rounded-lg text-sm font-bold transition-all mt-1"
                            style={{ background: "var(--green)", color: "hsl(150 30% 4%)", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-4" style={{ color: "hsl(150 10% 45%)" }}>
                        Already have an account?{" "}
                        <Link to="/login" className="font-semibold" style={{ color: "var(--green)" }}>
                            Sign in →
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
