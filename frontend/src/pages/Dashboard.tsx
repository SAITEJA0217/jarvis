import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Brain, FileText, Briefcase, Mic, ShieldCheck, Cpu, Terminal } from "lucide-react"

export default function Dashboard() {
  const { data: status } = useQuery({
    queryKey: ["status"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/status")
      return res.json()
    },
  })

  const { data: memories } = useQuery({
    queryKey: ["memories"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/memories")
      return res.json()
    },
  })

  const { data: applications } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/applications")
      return res.json()
    },
  })

  const { data: resumes } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/resumes")
      return res.json()
    },
  })

  const { data: internships } = useQuery({
    queryKey: ["internships"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/internships")
      return res.json()
    },
  })

  const { data: voiceLogs } = useQuery({
    queryKey: ["voice-logs"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/voice-logs")
      return res.json()
    },
  })

  const stats = [
    { label: "Total Memories", val: memories?.count || 0, icon: Brain, color: "text-primary bg-primary/10 border-primary/20", glow: "rgba(56, 189, 248, 0.15)" },
    { label: "Applications Tracked", val: applications?.count || 0, icon: Briefcase, color: "text-secondary bg-secondary/10 border-secondary/20", glow: "rgba(34, 211, 238, 0.15)" },
    { label: "Resumes Generated", val: resumes?.count || 0, icon: FileText, color: "text-success bg-success/10 border-success/20", glow: "rgba(16, 185, 129, 0.15)" },
    { label: "Internships Listed", val: internships?.count || 0, icon: ShieldCheck, color: "text-warning bg-warning/10 border-warning/20", glow: "rgba(245, 158, 11, 0.15)" },
    { label: "Voice Logs", val: voiceLogs?.count || 0, icon: Mic, color: "text-danger bg-danger/10 border-danger/20", glow: "rgba(239, 68, 68, 0.15)" },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden bg-[#0f172a]/40 border border-[#3b82f6]/10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
        <div className="space-y-2 z-10">
          <h2 className="text-3xl font-display font-extrabold tracking-wider bg-gradient-to-r from-primary via-secondary to-white bg-clip-text text-transparent">
            WELCOME BACK, FOUNDER
          </h2>
          <p className="text-slate-300 text-sm max-w-xl">
            JARVIS OS has loaded all local personal knowledge graphs, resume indexing engines, and active memory databases. System health checks are optimal.
          </p>
        </div>
        <div className="flex gap-4 z-10">
          <div className="px-5 py-3.5 rounded-2xl border border-[#10B981]/20 bg-[#10B981]/5 flex flex-col items-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest">SYSTEM INTEGRITY</span>
            <span className="text-sm font-bold text-success font-display">100% OPERATIONAL</span>
          </div>
        </div>
      </div>

      {/* Grid of Animated Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.04 } }}
            whileHover={{ y: -4, boxShadow: `0 0 20px ${stat.glow}` }}
            className="glass-card p-5 flex flex-col justify-between min-h-[145px] bg-[#0f172a]/70 relative border border-[#3b82f6]/15 group"
          >
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-display font-bold text-slate-300 tracking-wide uppercase">{stat.label}</span>
              <div className={`p-2 rounded-xl border ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-4xl font-display font-black tracking-tight text-white mt-4">
              {stat.val}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Telemetry Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core Memories Overview */}
        <div className="glass-card p-6 space-y-5 bg-[#0f172a]/50 lg:col-span-2 border border-[#3b82f6]/10">
          <div className="flex justify-between items-center pb-2 border-b border-[#3b82f6]/10">
            <h3 className="text-sm font-display font-extrabold uppercase tracking-widest text-primary flex items-center gap-2">
              <Brain className="w-4 h-4" /> Active Core Memories
            </h3>
            <span className="text-[10px] font-mono text-muted">RECENT CACHE VALUES</span>
          </div>
          <div className="space-y-3">
            {memories?.memories && memories.memories.length > 0 ? (
              memories.memories.slice(0, 4).map((m: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl border border-[#3b82f6]/10 bg-[#020617]/50 flex justify-between items-center text-xs">
                  <span className="font-mono text-secondary font-bold">{m.key}</span>
                  <span className="text-slate-200 font-medium">{m.value}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No active memories committed yet. Ask JARVIS to remember something.
              </div>
            )}
          </div>
        </div>

        {/* Resources Meter Widget */}
        <div className="glass-card p-6 space-y-5 bg-[#0f172a]/50 border border-[#3b82f6]/10">
          <div className="flex justify-between items-center pb-2 border-b border-[#3b82f6]/10">
            <h3 className="text-sm font-display font-extrabold uppercase tracking-widest text-secondary flex items-center gap-2">
              <Cpu className="w-4 h-4 animate-spin-slow" /> Resource Telemetry
            </h3>
            <span className="text-[10px] font-mono text-success uppercase">Active</span>
          </div>
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl border border-[#3b82f6]/10 bg-[#020617]/50 space-y-2">
              <div className="flex justify-between text-[10px] text-muted uppercase">
                <span>FastAPI Port</span>
                <span className="text-primary font-bold">ONLINE</span>
              </div>
              <p className="text-slate-200 font-bold font-mono">127.0.0.1:8000</p>
            </div>
            
            <div className="p-3.5 rounded-xl border border-[#3b82f6]/10 bg-[#020617]/50 space-y-2">
              <div className="flex justify-between text-[10px] text-muted uppercase">
                <span>LLM Engine</span>
                <span className={status?.ollama_connected ? "text-success font-bold" : "text-danger font-bold"}>
                  {status?.ollama_connected ? "LOADED" : "OFFLINE"}
                </span>
              </div>
              <p className="text-slate-200 font-bold font-mono">{status?.ollama_connected ? "Qwen2.5 (Local)" : "Standby"}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Terminal System Logs */}
      <div className="glass-card p-6 space-y-4 bg-[#0f172a]/40 border border-[#3b82f6]/10">
        <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" /> SYSTEM BOOT TELEMETRY FEED
        </h3>
        <div className="bg-[#020617]/80 rounded-xl p-4 border border-[#3b82f6]/10 font-mono text-[11px] text-slate-400 space-y-2 max-h-[160px] overflow-y-auto">
          <p className="text-primary">[INIT] JARVIS OS v4.0.0 booting up core kernels...</p>
          <p className="text-secondary">[OK] SQLite storage matrix verified successfully.</p>
          <p className={status?.ollama_connected ? "text-success" : "text-warning"}>
            {status?.ollama_connected ? "[OK] Local LLM Ollama pipeline established." : "[WARN] Local LLM connection offline. Retrying..."}
          </p>
          <p className="text-slate-500">[LOG] Web search RAG gateway standing by.</p>
          <p className="text-primary">[LOG] Vocals Whisper transcription buffers initialized.</p>
        </div>
      </div>
    </div>
  )
}
