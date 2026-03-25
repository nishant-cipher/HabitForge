import { Link } from "react-router-dom"
import { Zap, Hammer, Wrench, ArrowLeft, Loader2 } from "lucide-react"

export function ComingSoon() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-slate-50 font-sans selection:bg-[#13ec6a] selection:text-black flex flex-col items-center justify-center p-4 overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#13ec6a]/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[3000ms]" />

            {/* Authentic HabitForge Logo */}
            <div className="flex items-center gap-3 mb-12 animate-in fade-in slide-in-from-top-8 duration-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-[0_0_15px_-3px_#13ec6a]" style={{ background: "var(--green)", color: "hsl(150 30% 4%)" }}>
                    <Zap className="h-5 w-5" fill="currentColor" />
                </div>
                <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: "16px", color: "hsl(150 10% 95%)", letterSpacing: "0.02em", marginTop: "4px" }}>
                    HabitForge
                </span>
            </div>

            {/* Main Content Card */}
            <div className="relative z-10 max-w-lg w-full bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-md text-center shadow-2xl animate-in zoom-in-95 fade-in duration-700 delay-150 fill-mode-both">

                {/* Graphics / Animated Elements */}
                <div className="flex justify-center items-center gap-6 mb-8">
                    <Wrench className="h-10 w-10 text-[#13ec6a] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
                    <Hammer className="h-10 w-10 text-[#13ec6a] animate-bounce" style={{ animationDelay: "200ms", animationDirection: "alternate-reverse" }} />
                </div>

                <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
                    Coming <span className="text-[#13ec6a]">Soon</span>
                </h1>

                <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                    We're actively working in the forge to bring you this feature. Check back later to see the sparks fly!
                </p>

                <Link
                    to="/"
                    className="group inline-flex items-center gap-2 bg-white/10 text-white px-8 py-3 rounded-lg font-bold hover:bg-white/20 transition-all border border-white/10 backdrop-blur-md"
                >
                    <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" /> Back to Home
                </Link>
            </div>

            {/* Ambient Footer text */}
            <div className="absolute bottom-8 text-sm text-slate-600 animate-in fade-in duration-1000 delay-500 fill-mode-both">
                &copy; {new Date().getFullYear()} HabitForge. Forge your discipline.
            </div>
        </div>
    )
}
