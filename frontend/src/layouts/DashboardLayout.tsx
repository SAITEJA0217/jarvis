import { Link, Outlet, useLocation } from "react-router-dom"
import { Bot, LayoutDashboard, User, Brain, Briefcase, FileText, ClipboardList, Mic, Activity, Settings, Search, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const NAV_ITEMS = [
  { name: "AI Assistant", href: "/", icon: Bot },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Memory Center", href: "/memories", icon: Brain },
  { name: "Internship Center", href: "/internships", icon: Briefcase },
  { name: "Resume Center", href: "/resumes", icon: FileText },
  { name: "Applications", href: "/applications", icon: ClipboardList },
  { name: "Voice Logs", href: "/voice-logs", icon: Mic },
  { name: "Web Search Center", href: "/search", icon: Search },
  { name: "System Status", href: "/status", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
]

export default function DashboardLayout() {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden relative font-sans">
      {/* Premium Floating Decorative Background Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-secondary/5 blur-[100px] pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-68 border-r border-slate-800/60 bg-slate-950/40 backdrop-blur-2xl flex flex-col z-10">
        <div className="h-20 flex items-center px-8 border-b border-slate-800/40">
          <Link to="/" className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary animate-pulse" />
            <div>
              <h1 className="text-lg font-display font-extrabold tracking-wider bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                JARVIS OS
              </h1>
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">SYSTEM ACTIVE</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative group",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/20 glow-cyan"
                    : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-100 border border-transparent"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <item.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-primary" : "text-slate-400")} />
                <span className="tracking-wide">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Card at the bottom */}
        <div className="p-4 border-t border-slate-800/40 bg-slate-950/60">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            {/* Avatar with glow online indicator */}
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-display font-bold text-slate-950">
                K
              </div>
              <span className="absolute bottom-[-1px] right-[-1px] w-3.5 h-3.5 bg-success border-2 border-slate-950 rounded-full animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold truncate text-slate-100 font-display">Karka Saiteja Reddy</h4>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Founder</span>
                <span className="text-[9px] text-muted-foreground font-mono">ID: 01</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden z-10">
        <header className="h-20 border-b border-slate-800/40 bg-slate-950/20 backdrop-blur-md flex items-center px-8 justify-between">
          <h2 className="text-xl font-display font-bold text-slate-100 tracking-wide">
            {NAV_ITEMS.find((item) => item.href === location.pathname)?.name || "AI Command Center"}
          </h2>
          <div className="text-xs font-mono text-muted flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>SECURE OS SESSION</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
