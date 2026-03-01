import { useState, useRef, useEffect } from "react"
import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
    LayoutDashboard, CheckSquare, Users, BarChart2,
    Settings, Zap, LogOut, ListTodo, Sliders
} from "lucide-react"

const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/habits", label: "Habits", icon: CheckSquare },
    { to: "/tasks", label: "Tasks", icon: ListTodo },
    { to: "/clubs", label: "Clubs", icon: Users },
    { to: "/analytics", label: "Stats", icon: BarChart2 },
    { to: "/mode", label: "Mode", icon: Sliders },
]

// Bottom tab bar — Dashboard, Habits, Tasks, Clubs, Stats, Settings
const bottomNavItems = navItems.slice(0, 5)

/** Avatar circle shared between sidebar user card and mobile top bar */
export function UserAvatar({ size = 8, textSize = "text-xs" }: { size?: number; textSize?: string }) {
    const { user } = useAuth()
    return (
        <div
            className={`flex h-${size} w-${size} items-center justify-center rounded-full font-bold flex-shrink-0 ${textSize}`}
            style={{
                background: "var(--green-dim)",
                color: "var(--green)",
                border: "1px solid rgba(19,236,106,0.3)",
            }}
        >
            {user?.username?.slice(0, 2).toUpperCase() || "U"}
        </div>
    )
}

export function MainLayout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
    const avatarRef = useRef<HTMLDivElement>(null)

    // Close avatar dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
                setAvatarMenuOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleLogout = () => {
        setAvatarMenuOpen(false)
        logout()
        navigate("/login")
    }

    return (
        <div className="flex min-h-screen w-full" style={{ background: "hsl(150 30% 4%)" }}>

            {/* ── Desktop Sidebar ──────────────────────────────────── */}
            <aside
                className="hidden md:flex fixed inset-y-0 left-0 z-40 w-56 flex-col"
                style={{
                    background: "hsl(150 20% 6%)",
                    borderRight: "1px solid hsl(150 15% 11%)"
                }}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-5 py-5"
                    style={{ borderBottom: "1px solid hsl(150 15% 11%)" }}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}>
                        <Zap className="h-4 w-4" fill="currentColor" />
                    </div>
                    <div style={{
                        fontFamily: "'Press Start 2P', cursive",
                        fontSize: "13px",
                        color: "hsl(150 10% 95%)",
                        letterSpacing: "0.02em",
                        lineHeight: 1.4
                    }}>HabitForge</div>
                </div>

                {/* Nav */}
                <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                        >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom: Settings + User */}
                <div className="px-3 pb-4 flex flex-col gap-1"
                    style={{ borderTop: "1px solid hsl(150 15% 11%)" }}>
                    <div className="pt-3">
                        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <Settings className="h-4 w-4 flex-shrink-0" />
                            <span>Settings</span>
                        </NavLink>
                        <button
                            onClick={handleLogout}
                            className="nav-item w-full text-left mt-1"
                            style={{ color: "hsl(0 60% 55%)" }}
                        >
                            <LogOut className="h-4 w-4 flex-shrink-0" />
                            <span>Logout</span>
                        </button>
                    </div>

                    {/* User card */}
                    <div className="flex items-center gap-3 mt-3 px-2 py-2 rounded-lg"
                        style={{ background: "hsl(150 15% 10%)" }}>
                        <UserAvatar size={8} textSize="text-xs" />
                        <div className="min-w-0">
                            <div className="text-sm font-semibold truncate" style={{ color: "hsl(150 10% 90%)" }}>
                                {user?.username || "User"}
                            </div>
                            <div className="text-xs" style={{ color: "hsl(150 10% 50%)" }}>
                                LVL {user?.level || 1} • {user?.xp || 0} XP
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main Content ─────────────────────────────────────── */}
            <main className="flex-1 md:ml-56 min-h-screen overflow-auto">

                {/* Mobile sticky top bar */}
                <div
                    className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3"
                    style={{ background: "hsl(150 20% 6%)", borderBottom: "1px solid hsl(150 15% 11%)" }}
                >
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                            style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}>
                            <Zap className="h-3.5 w-3.5" fill="currentColor" />
                        </div>
                        <span style={{
                            fontFamily: "'Press Start 2P', cursive",
                            fontSize: "12px",
                            color: "hsl(150 10% 95%)",
                            letterSpacing: "0.02em"
                        }}>HabitForge</span>
                    </div>

                    {/* Avatar + dropdown */}
                    <div ref={avatarRef} className="relative">
                        <button
                            onClick={() => setAvatarMenuOpen(v => !v)}
                            className="flex items-center gap-2 rounded-xl px-2 py-1 transition-colors"
                            style={{ background: avatarMenuOpen ? "hsl(150 15% 12%)" : "transparent" }}
                        >
                            <UserAvatar size={8} textSize="text-xs" />
                            <div className="text-left hidden xs:block">
                                <div className="text-xs font-semibold leading-tight" style={{ color: "hsl(150 10% 85%)" }}>
                                    {user?.username}
                                </div>
                                <div className="text-[10px]" style={{ color: "hsl(150 10% 45%)" }}>
                                    LVL {user?.level || 1}
                                </div>
                            </div>
                        </button>

                        {/* Dropdown menu */}
                        {avatarMenuOpen && (
                            <div
                                className="absolute right-0 top-full mt-2 w-44 rounded-xl overflow-hidden shadow-xl z-50"
                                style={{
                                    background: "hsl(150 20% 8%)",
                                    border: "1px solid hsl(150 15% 14%)",
                                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
                                }}
                            >
                                {/* User info pill */}
                                <div className="px-3 py-3" style={{ borderBottom: "1px solid hsl(150 15% 12%)" }}>
                                    <div className="text-sm font-semibold" style={{ color: "hsl(150 10% 90%)" }}>
                                        {user?.username}
                                    </div>
                                    <div className="text-xs" style={{ color: "hsl(150 10% 45%)" }}>
                                        LVL {user?.level || 1} • {user?.xp || 0} XP
                                    </div>
                                </div>
                                {/* Mode link */}
                                <NavLink
                                    to="/mode"
                                    onClick={() => setAvatarMenuOpen(false)}
                                    className="flex items-center gap-2.5 px-3 py-2.5 w-full text-sm transition-colors hover:bg-white/5"
                                    style={{ color: "hsl(150 10% 75%)" }}
                                >
                                    <Sliders className="h-4 w-4 flex-shrink-0" />
                                    Mode Config
                                </NavLink>
                                {/* Settings link */}
                                <NavLink
                                    to="/settings"
                                    onClick={() => setAvatarMenuOpen(false)}
                                    className="flex items-center gap-2.5 px-3 py-2.5 w-full text-sm transition-colors hover:bg-white/5"
                                    style={{ color: "hsl(150 10% 75%)" }}
                                >
                                    <Settings className="h-4 w-4 flex-shrink-0" />
                                    Settings
                                </NavLink>
                                {/* Divider */}
                                <div style={{ borderTop: "1px solid hsl(150 15% 12%)" }} />
                                {/* Logout */}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2.5 px-3 py-2.5 w-full text-sm transition-colors hover:bg-red-500/10"
                                    style={{ color: "hsl(0 60% 60%)" }}
                                >
                                    <LogOut className="h-4 w-4 flex-shrink-0" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Page content */}
                <div className="p-3 sm:p-6 max-w-7xl mx-auto pb-20 md:pb-6">
                    <Outlet />
                </div>
            </main>

            {/* ── Mobile Bottom Tab Bar ────────────────────────────── */}
            <nav
                className="md:hidden fixed bottom-0 inset-x-0 z-20 flex items-center justify-around px-1 py-2"
                style={{
                    background: "hsl(150 20% 6%)",
                    borderTop: "1px solid hsl(150 15% 11%)",
                }}
            >
                {bottomNavItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all"
                        style={({ isActive }) => ({
                            color: isActive ? "var(--green)" : "hsl(150 10% 45%)",
                        })}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="text-[10px] font-semibold">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    )
}
