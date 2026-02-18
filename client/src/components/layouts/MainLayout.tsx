import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { LayoutDashboard, CheckSquare, Users, BarChart2, Settings, Zap, LogOut } from "lucide-react"

const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/habits", label: "Habits", icon: CheckSquare },
    { to: "/clubs", label: "Clubs", icon: Users },
    { to: "/analytics", label: "Stats", icon: BarChart2 },
]

const modeColors: Record<string, string> = {
    DISCIPLINE: "text-red-400 bg-red-400/10 border-red-400/20",
    BALANCED: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    COMPETITIVE: "text-blue-400 bg-blue-400/10 border-blue-400/20",
}

export function MainLayout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate("/login")
    }

    const mode = (user as any)?.mode || "BALANCED"
    const modeLabel = mode === "DISCIPLINE" ? "MONK MODE" : mode === "COMPETITIVE" ? "COMPETITIVE" : "BALANCED"

    return (
        <div className="flex min-h-screen w-full" style={{ background: "hsl(150 30% 4%)" }}>
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-20 flex w-56 flex-col"
                style={{ background: "hsl(150 20% 6%)", borderRight: "1px solid hsl(150 15% 11%)" }}>

                {/* Logo */}
                <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid hsl(150 15% 11%)" }}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}>
                        <Zap className="h-4 w-4" fill="currentColor" />
                    </div>
                    <div>
                        <div className="text-sm font-800 font-extrabold tracking-tight" style={{ color: "hsl(150 10% 95%)" }}>HabitEngine</div>
                        <div className={`text-[10px] font-bold border rounded px-1.5 py-0.5 mt-0.5 inline-block ${modeColors[mode] || modeColors.BALANCED}`}>
                            {modeLabel}
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? "active" : ""}`
                            }
                        >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom: Settings + User */}
                <div className="px-3 pb-4 flex flex-col gap-1" style={{ borderTop: "1px solid hsl(150 15% 11%)" }}>
                    <div className="pt-3">
                        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <Settings className="h-4 w-4 flex-shrink-0" />
                            <span>Settings</span>
                        </NavLink>
                        <button onClick={handleLogout} className="nav-item w-full text-left mt-1"
                            style={{ color: "hsl(0 60% 55%)" }}>
                            <LogOut className="h-4 w-4 flex-shrink-0" />
                            <span>Logout</span>
                        </button>
                    </div>

                    {/* User profile */}
                    <div className="flex items-center gap-3 mt-3 px-2 py-2 rounded-lg"
                        style={{ background: "hsl(150 15% 10%)" }}>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
                            style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(19,236,106,0.25)" }}>
                            {user?.username?.slice(0, 2).toUpperCase() || "U"}
                        </div>
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

            {/* Main content */}
            <main className="flex-1 ml-56 min-h-screen overflow-auto">
                <div className="p-6 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
