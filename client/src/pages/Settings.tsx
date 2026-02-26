import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import api from "@/services/api"
import { User, LogOut, Shield, Bell, AlertTriangle } from "lucide-react"

export function Settings() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [username, setUsername] = useState(user?.username || "")
    const [email, setEmail] = useState(user?.email || "")

    // Delete account state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteInput, setDeleteInput] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState("")

    const handleLogout = () => {
        logout()
        navigate("/login")
    }

    const handleDeleteAccount = async () => {
        if (deleteInput !== "DELETE") return
        setIsDeleting(true)
        setDeleteError("")
        try {
            await api.delete("/users/profile")
            logout()
            navigate("/register")
        } catch (err: any) {
            setDeleteError(err.response?.data?.message || "Failed to delete account")
            setIsDeleting(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "hsl(150 10% 95%)" }}>Settings</h1>
                <p className="text-sm mt-1" style={{ color: "hsl(150 10% 50%)" }}>Manage your account and preferences</p>
            </div>

            {/* Profile */}
            <div className="surface-card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <User className="h-4 w-4" style={{ color: "var(--green)" }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>Profile</h2>
                </div>
                <div className="flex items-center gap-4 mb-5">
                    <div className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold"
                        style={{ background: "var(--green-dim)", color: "var(--green)", border: "2px solid rgba(19,236,106,0.3)" }}>
                        {user?.username?.slice(0, 2).toUpperCase() || "U"}
                    </div>
                    <div>
                        <div className="font-bold" style={{ color: "hsl(150 10% 90%)" }}>{user?.username}</div>
                        <div className="text-sm" style={{ color: "hsl(150 10% 50%)" }}>{user?.email}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--green)" }}>Level {user?.level || 1} • {user?.xp || 0} XP</div>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Username</label>
                        <input value={username} onChange={e => setUsername(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Email</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }} />
                    </div>
                    <button className="px-4 py-2 rounded-lg text-sm font-semibold w-fit"
                        style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}>
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Security */}
            <div className="surface-card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-4 w-4" style={{ color: "var(--green)" }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>Security</h2>
                </div>
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>New Password</label>
                        <input type="password" placeholder="••••••••"
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{ background: "hsl(150 15% 10%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }} />
                    </div>
                    <button className="px-4 py-2 rounded-lg text-sm font-semibold w-fit"
                        style={{ background: "hsl(150 15% 12%)", color: "hsl(150 10% 70%)", border: "1px solid hsl(150 15% 18%)" }}>
                        Update Password
                    </button>
                </div>
            </div>

            {/* Notifications */}
            <div className="surface-card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Bell className="h-4 w-4" style={{ color: "var(--green)" }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>Notifications</h2>
                </div>
                {[
                    { label: "Daily habit reminders", desc: "Get reminded to complete your habits" },
                    { label: "Streak alerts", desc: "Alert when your streak is at risk" },
                    { label: "Club activity", desc: "Updates from your clubs" },
                ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid hsl(150 15% 11%)" }}>
                        <div>
                            <div className="text-sm font-medium" style={{ color: "hsl(150 10% 85%)" }}>{item.label}</div>
                            <div className="text-xs" style={{ color: "hsl(150 10% 45%)" }}>{item.desc}</div>
                        </div>
                        <div className="w-10 h-5 rounded-full relative cursor-pointer" style={{ background: "var(--green)" }}>
                            <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Danger Zone */}
            <div className="surface-card p-5" style={{ borderColor: "rgba(239,68,68,0.2)" }}>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "hsl(0 60% 55%)" }}>Danger Zone</h2>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid hsl(150 15% 11%)" }}>
                        <div>
                            <div className="text-sm font-semibold" style={{ color: "hsl(150 10% 85%)" }}>Sign Out</div>
                            <div className="text-xs" style={{ color: "hsl(150 10% 45%)" }}>Log out of this device</div>
                        </div>
                        <button onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                            style={{ background: "hsl(150 20% 10%)", color: "hsl(150 10% 80%)", border: "1px solid hsl(150 15% 16%)" }}>
                            <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold" style={{ color: "hsl(0 60% 60%)" }}>Delete Account</div>
                            <div className="text-xs" style={{ color: "hsl(0 60% 50%)", opacity: 0.8 }}>Permanently delete your data</div>
                        </div>
                        <button onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                            style={{ background: "rgba(239,68,68,0.1)", color: "hsl(0 60% 60%)", border: "1px solid rgba(239,68,68,0.2)" }}>
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ animation: "toastIn 0.2s ease" }}>
                    <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "hsl(150 20% 7%)", border: "1px solid rgba(239,68,68,0.3)" }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-bold" style={{ color: "hsl(150 10% 95%)" }}>Delete Account</h2>
                        </div>
                        <p className="text-sm mb-4" style={{ color: "hsl(150 10% 60%)" }}>
                            This action is <strong>irreversible</strong>.
                            It will permanently delete your account, including all habits, logs, stats, and active sessions.
                        </p>

                        {deleteError && (
                            <div className="mb-4 text-xs font-semibold p-3 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                                {deleteError}
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="text-xs font-semibold mb-2 block" style={{ color: "hsl(150 10% 70%)" }}>
                                Type <strong style={{ color: "hsl(150 10% 90%)" }}>DELETE</strong> to confirm
                            </label>
                            <input
                                type="text"
                                value={deleteInput}
                                onChange={e => setDeleteInput(e.target.value)}
                                placeholder="DELETE"
                                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                style={{ background: "hsl(150 20% 4%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }}
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full">
                            <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); setDeleteError(""); }}
                                disabled={isDeleting}
                                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                                style={{ background: "hsl(150 20% 12%)", color: "hsl(150 10% 70%)", border: "1px solid hsl(150 15% 18%)" }}>
                                Cancel
                            </button>
                            <button onClick={handleDeleteAccount}
                                disabled={deleteInput !== "DELETE" || isDeleting}
                                className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                                style={{ background: "#ef4444", color: "hsl(150 30% 4%)" }}>
                                {isDeleting ? "Deleting..." : "Delete Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
