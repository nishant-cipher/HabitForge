import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import api from "@/services/api"
import { User, LogOut, Shield, Bell, AlertTriangle, Check, Loader2 } from "lucide-react"

type SaveState = "idle" | "saving" | "success" | "error"

function useSaveState() {
    const [state, setState] = useState<SaveState>("idle")
    const [msg, setMsg] = useState("")
    const trigger = async (fn: () => Promise<void>) => {
        setState("saving")
        setMsg("")
        try {
            await fn()
            setState("success")
            setMsg("Saved!")
            setTimeout(() => setState("idle"), 2500)
        } catch (err: any) {
            setState("error")
            setMsg(err.response?.data?.message || err.message || "Something went wrong")
            setTimeout(() => setState("idle"), 4000)
        }
    }
    return { state, msg, trigger }
}

function SaveBtn({ state, msg, label = "Save Changes" }: { state: SaveState; msg: string; label?: string }) {
    const isLoading = state === "saving"
    const isSuccess = state === "success"
    const isError = state === "error"
    return (
        <div className="flex items-center gap-3">
            <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 transition-all"
                style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}
            >
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isSuccess && <Check className="h-3.5 w-3.5" />}
                {label}
            </button>
            {msg && (
                <span className="text-xs font-semibold" style={{ color: isError ? "#ef4444" : "var(--green)" }}>
                    {msg}
                </span>
            )}
        </div>
    )
}

export function Settings() {
    const { user, logout, updateUser } = useAuth()
    const navigate = useNavigate()

    // Profile section
    const [username, setUsername] = useState(user?.username || "")
    const [email, setEmail] = useState(user?.email || "")
    const profileSave = useSaveState()

    // Password section
    const [currentPwd, setCurrentPwd] = useState("")
    const [newPwd, setNewPwd] = useState("")
    const [confirmPwd, setConfirmPwd] = useState("")
    const pwdSave = useSaveState()

    // Notifications section
    const [notifs, setNotifs] = useState({
        dailyReminders: user?.notificationPrefs?.dailyReminders ?? true,
        streakAlerts: user?.notificationPrefs?.streakAlerts ?? true,
        clubActivity: user?.notificationPrefs?.clubActivity ?? true,
    })
    const notifSave = useSaveState()

    // Delete account state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteInput, setDeleteInput] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState("")

    const handleLogout = () => {
        logout()
        navigate("/login")
    }

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault()
        profileSave.trigger(async () => {
            // Update username via profile endpoint
            if (username !== user?.username) {
                const res = await api.put("/users/profile", { username })
                updateUser({ username: res.data.data?.user?.username || username })
            }
            // Update email via dedicated endpoint
            if (email !== user?.email) {
                const res = await api.patch("/users/email", { email })
                updateUser({ email: res.data.data?.email || email })
            }
        })
    }

    const handlePasswordSave = (e: React.FormEvent) => {
        e.preventDefault()
        pwdSave.trigger(async () => {
            if (!currentPwd || !newPwd || !confirmPwd) throw new Error("All fields are required")
            if (newPwd !== confirmPwd) throw new Error("New passwords do not match")
            if (newPwd.length < 6) throw new Error("Password must be at least 6 characters")
            await api.patch("/users/password", { currentPassword: currentPwd, newPassword: newPwd })
            setCurrentPwd(""); setNewPwd(""); setConfirmPwd("")
        })
    }

    const handleToggle = async (key: keyof typeof notifs) => {
        const updated = { ...notifs, [key]: !notifs[key] }
        setNotifs(updated)
        notifSave.trigger(async () => {
            await api.patch("/users/notifications", updated)
        })
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

    const inputStyle = {
        background: "hsl(150 15% 10%)",
        border: "1px solid hsl(150 15% 16%)",
        color: "hsl(150 10% 90%)",
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
                <form onSubmit={handleProfileSave} className="flex flex-col gap-3">
                    <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Username</label>
                        <input value={username} onChange={e => setUsername(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={inputStyle} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Email</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={inputStyle} />
                    </div>
                    <SaveBtn state={profileSave.state} msg={profileSave.msg} />
                </form>
            </div>

            {/* Security */}
            <div className="surface-card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-4 w-4" style={{ color: "var(--green)" }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>Security</h2>
                </div>
                <form onSubmit={handlePasswordSave} className="flex flex-col gap-3">
                    <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Current Password</label>
                        <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
                            placeholder="••••••••" className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={inputStyle} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>New Password</label>
                        <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                            placeholder="••••••••" className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={inputStyle} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: "hsl(150 10% 55%)" }}>Confirm New Password</label>
                        <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                            placeholder="••••••••" className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={inputStyle} />
                    </div>
                    <SaveBtn state={pwdSave.state} msg={pwdSave.msg} label="Update Password" />
                </form>
            </div>

            {/* Notifications */}
            <div className="surface-card p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" style={{ color: "var(--green)" }} />
                        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(150 10% 70%)" }}>Notifications</h2>
                    </div>
                    {notifSave.msg && (
                        <span className="text-xs font-semibold" style={{ color: notifSave.state === "error" ? "#ef4444" : "var(--green)" }}>
                            {notifSave.msg}
                        </span>
                    )}
                </div>
                {([
                    { key: "dailyReminders" as const, label: "Daily habit reminders", desc: "Get reminded to complete your habits" },
                    { key: "streakAlerts" as const, label: "Streak alerts", desc: "Alert when your streak is at risk" },
                    { key: "clubActivity" as const, label: "Club activity", desc: "Updates from your clubs" },
                ] as const).map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid hsl(150 15% 11%)" }}>
                        <div>
                            <div className="text-sm font-medium" style={{ color: "hsl(150 10% 85%)" }}>{item.label}</div>
                            <div className="text-xs" style={{ color: "hsl(150 10% 45%)" }}>{item.desc}</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleToggle(item.key)}
                            className="w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-200 focus:outline-none"
                            style={{ background: notifs[item.key] ? "var(--green)" : "hsl(150 10% 20%)" }}
                            aria-checked={notifs[item.key]}
                            role="switch"
                        >
                            <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200"
                                style={{ left: notifs[item.key] ? "calc(100% - 18px)" : "2px" }} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Danger Zone */}
            <div className="surface-card p-5" style={{ borderColor: "rgba(239,68,68,0.2)" }}>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "hsl(0 60% 55%)" }}>Danger Zone</h2>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4" style={{ borderBottom: "1px solid hsl(150 15% 11%)" }}>
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "hsl(150 20% 7%)", border: "1px solid rgba(239,68,68,0.3)" }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-bold" style={{ color: "hsl(150 10% 95%)" }}>Delete Account</h2>
                        </div>
                        <p className="text-sm mb-4" style={{ color: "hsl(150 10% 60%)" }}>
                            This action is <strong>irreversible</strong>. It will permanently delete your account, including all habits, logs, stats, and active sessions.
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
                            <input type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
                                placeholder="DELETE" className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                style={{ background: "hsl(150 20% 4%)", border: "1px solid hsl(150 15% 16%)", color: "hsl(150 10% 90%)" }} />
                        </div>
                        <div className="flex items-center gap-3 w-full">
                            <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); setDeleteError("") }}
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
