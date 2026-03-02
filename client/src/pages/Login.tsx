import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/services/api"
import { Zap, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function Login() {
    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const isEmail = identifier.includes("@")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)
        try {
            const payload = isEmail
                ? { email: identifier.trim(), password }
                : { username: identifier.trim(), password }
            const response = await api.post("/auth/login", payload)
            const { user } = response.data.data
            login(user)
            navigate("/dashboard")
        } catch (err: any) {
            setError(err.response?.data?.message || "Incorrect credentials")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "hsl(150 30% 4%)" }}>
            <Dialog open={!!error} onOpenChange={(open) => !open && setError("")}>
                <DialogContent className="sm:max-w-md border-red-900/50" style={{ background: "hsl(150 20% 7%)" }}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-500">
                            <AlertTriangle className="h-5 w-5" />
                            Login Failed
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {error}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="destructive"
                            onClick={() => setError("")}
                            className="bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30"
                        >
                            Try Again
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="flex items-center gap-3 justify-center mb-8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}>
                        <Zap className="h-5 w-5" fill="currentColor" />
                    </div>
                    <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: "14px", color: "hsl(150 10% 95%)", letterSpacing: "0.02em" }}>HabitForge</span>
                </div>

                <div className="surface-card p-6">
                    <h1 className="text-xl font-bold mb-1" style={{ color: "hsl(150 10% 95%)" }}>Welcome back</h1>
                    <p className="text-sm mb-6" style={{ color: "hsl(150 10% 50%)" }}>Sign in to your command center</p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>
                                {isEmail ? "Email" : identifier ? "Username" : "Email or Username"}
                            </label>
                            <input
                                id="identifier" type="text" required
                                value={identifier} onChange={e => setIdentifier(e.target.value)}
                                placeholder="you@example.com or username"
                                autoComplete="username"
                                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                                style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold" style={{ color: "hsl(150 10% 55%)" }}>Password</label>

                            </div>
                            <input
                                id="password" type="password" required
                                value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                                style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                            />
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full py-2.5 rounded-lg text-sm font-bold transition-all mt-1"
                            style={{ background: "var(--green)", color: "hsl(150 30% 4%)", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>
                    <Link to="/forgot-password" className="text-xs font-medium transition-opacity hover:opacity-70 mt-1"
                        style={{ color: "var(--green)" }}>
                        Forgot password?
                    </Link>
                    <p className="text-center text-sm mt-4" style={{ color: "hsl(150 10% 45%)" }}>
                        No account?{" "}
                        <Link to="/register" className="font-semibold" style={{ color: "var(--green)" }}>
                            Create one →
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

