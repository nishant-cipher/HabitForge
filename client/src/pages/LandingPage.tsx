import { Link } from "react-router-dom"
import { Users, BarChart3, ArrowRight, Zap, Target, Github, Heart } from "lucide-react"

export function LandingPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-slate-50 font-sans selection:bg-[#13ec6a] selection:text-black flex flex-col overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/10 shrink-0 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Authentic HabitForge Logo */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}>
                                <Zap className="h-4 w-4" fill="currentColor" />
                            </div>
                            <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: "12px", color: "hsl(150 10% 95%)", letterSpacing: "0.02em", marginTop: "2px" }}>
                                HabitForge
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                Log In
                            </Link>
                            <Link
                                to="/register"
                                className="text-sm font-semibold bg-[#13ec6a] text-black px-4 py-2 rounded-md hover:bg-[#10c85a] transition-colors"
                            >
                                Sign Up
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col pt-16">

                {/* Hero Section */}
                <section className="relative w-full flex-1 flex flex-col items-center justify-center pt-24 pb-20 px-4 sm:px-6 lg:px-8 text-center overflow-hidden min-h-[500px]">
                    {/* Subtle Glow Background Effect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#13ec6a]/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[4000ms]" />

                    <h1 className="relative text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl text-white animate-in fade-in zoom-in-95 duration-700 fill-mode-both delay-150">
                        Forge Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#13ec6a] to-[#0a9f46]">Discipline</span>
                    </h1>
                    <p className="relative text-xl text-slate-400 mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both delay-300">
                        A premium habit tracking and task management platform designed to help you build momentum, enforce strict behavioral rules, and conquer your goals.
                    </p>
                    <div className="relative flex flex-col sm:flex-row gap-4 items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both delay-500">
                        <Link
                            to="/register"
                            className="group flex items-center gap-2 bg-[#13ec6a] text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#10c85a] hover:scale-105 transition-all w-full sm:w-auto justify-center shadow-[0_0_30px_-5px_#13ec6a]"
                        >
                            Start Forging <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            to="/login"
                            className="flex items-center gap-2 bg-white/10 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/20 transition-all w-full sm:w-auto justify-center border border-white/10 backdrop-blur-sm"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                </section>

                {/* Features Section */}
                <section className="w-full bg-black/50 py-24 border-y border-white/5 relative z-10 shrink-0 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both delay-700">
                            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                                Systems Built for <span className="text-[#13ec6a]">Consistency</span>
                            </h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">
                                Stop relying on motivation. HabitForge provides the tools to build a robust system of habits that run on autopilot.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm hover:border-[#13ec6a]/50 hover:bg-[#13ec6a]/5 transition-all group animate-in fade-in zoom-in-95 duration-700 fill-mode-both delay-[800ms]">
                                <div className="bg-[#13ec6a]/20 p-4 rounded-xl inline-block mb-6 group-hover:scale-110 group-hover:bg-[#13ec6a]/30 transition-all duration-300">
                                    <Zap className="h-8 w-8 text-[#13ec6a]" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">The Rule Engine</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Configure strict behavioral modes and enforce them. Setup daily, weekly, or custom schedules that adapt to your evolving lifestyle.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm hover:border-[#13ec6a]/50 hover:bg-[#13ec6a]/5 transition-all group animate-in fade-in zoom-in-95 duration-700 fill-mode-both delay-[900ms]">
                                <div className="bg-[#13ec6a]/20 p-4 rounded-xl inline-block mb-6 group-hover:scale-110 group-hover:bg-[#13ec6a]/30 transition-all duration-300">
                                    <Users className="h-8 w-8 text-[#13ec6a]" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Social Clubs</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Join forces with friends. Create competitive groups, track shared habits, and stay accountable with real-time leaderboards.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm hover:border-[#13ec6a]/50 hover:bg-[#13ec6a]/5 transition-all group animate-in fade-in zoom-in-95 duration-700 fill-mode-both delay-[1000ms]">
                                <div className="bg-[#13ec6a]/20 p-4 rounded-xl inline-block mb-6 group-hover:scale-110 group-hover:bg-[#13ec6a]/30 transition-all duration-300">
                                    <BarChart3 className="h-8 w-8 text-[#13ec6a]" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Deep Analytics</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Visualize your momentum over time. Analyze historical data, completion rates, and identify your strongest streaks through visual metrics.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bottom CTA */}
                <section className="w-full py-24 px-4 sm:px-6 lg:px-8 text-center relative z-10 shrink-0">
                    <div className="max-w-3xl mx-auto bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-3xl p-12 backdrop-blur-md animate-in fade-in zoom-in duration-1000 fill-mode-both delay-[1100ms]">
                        <div className="animate-bounce">
                            <Target className="h-12 w-12 text-[#13ec6a] mx-auto mb-6" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">Ready to level up your life?</h2>
                        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                            Join HabitForge today and start building the discipline needed to achieve your goals. It takes less than a minute.
                        </p>
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center bg-[#13ec6a] text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#10c85a] transition-colors w-full sm:w-auto shadow-[0_0_20px_-5px_#13ec6a]"
                        >
                            Create Your Free Account
                        </Link>
                    </div>
                </section>
            </main>

            {/* Better Footer Section */}
            <footer className="w-full border-t border-white/10 bg-[#060606] pt-16 pb-8 shrink-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-1">
                            {/* Footer Logo */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}>
                                    <Zap className="h-4 w-4" fill="currentColor" />
                                </div>
                                <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: "12px", color: "hsl(150 10% 95%)", letterSpacing: "0.02em", marginTop: "2px" }}>
                                    HabitForge
                                </span>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                Forging discipline and building momentum through powerful systems and community accountability.
                            </p>
                            <div className="flex gap-4">
                                <a href="https://github.com/Sujayz22/HabitForge" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#13ec6a] transition-colors"><Github className="h-5 w-5" /></a>
                            </div>
                        </div>

                        <div className="col-span-1">
                            <h4 className="text-white font-semibold mb-6">Product</h4>
                            <ul className="space-y-4 text-sm text-slate-400">
                                <li><Link to="/coming-soon" className="hover:text-[#13ec6a] transition-colors">Features</Link></li>
                                <li><Link to="/coming-soon" className="hover:text-[#13ec6a] transition-colors">Modes</Link></li>
                                <li><Link to="/coming-soon" className="hover:text-[#13ec6a] transition-colors">Social Clubs</Link></li>
                                <li><Link to="/coming-soon" className="hover:text-[#13ec6a] transition-colors">Pricing</Link></li>
                            </ul>
                        </div>

                        <div className="col-span-1">
                            <h4 className="text-white font-semibold mb-6">Resources</h4>
                            <ul className="space-y-4 text-sm text-slate-400">
                                <li><Link to="/coming-soon" className="hover:text-[#13ec6a] transition-colors">Documentation</Link></li>
                                <li><Link to="/coming-soon" className="hover:text-[#13ec6a] transition-colors">Blog</Link></li>
                                <li><Link to="/coming-soon" className="hover:text-[#13ec6a] transition-colors">Community</Link></li>
                                <li><Link to="/coming-soon" className="hover:text-[#13ec6a] transition-colors">Help Center</Link></li>
                            </ul>
                        </div>

                        <div className="col-span-1">
                            <h4 className="text-white font-semibold mb-6">Legal</h4>
                            <ul className="space-y-4 text-sm text-slate-400">
                                <li><Link to="/coming-soon" className="hover:text-[#13ec6a] transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/coming-soon" className="hover:text-[#13ec6a] transition-colors">Terms of Service</Link></li>
                                <li><Link to="/coming-soon" className="hover:text-[#13ec6a] transition-colors">Cookie Policy</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-slate-500">
                            &copy; {new Date().getFullYear()} HabitForge. All rights reserved.
                        </p>
                        <div className="text-sm text-slate-500 flex items-center gap-1">
                            Designed with <Heart className="h-4 w-4 text-[#13ec6a] mx-1 inline" /> by Team Phoenix.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
