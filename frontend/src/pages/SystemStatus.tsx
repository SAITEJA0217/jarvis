import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Server, Database, BrainCircuit, Mic, Waves, Activity, AlertTriangle, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export default function SystemStatus() {
  const { data: status, isLoading } = useQuery({
    queryKey: ["status"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/status")
      return res.json()
    },
    refetchInterval: 5000 // Poll every 5s
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-display">Interrogating mainframe core status...</p>
      </div>
    )
  }

  const modules = [
    { 
      name: "Ollama Local LLM", 
      description: "Cognitive core & contextual response engine", 
      icon: BrainCircuit, 
      active: status?.ollama_connected 
    },
    { 
      name: "Whisper STT", 
      description: "Real-time speech to text transcription matrix", 
      icon: Mic, 
      active: status?.whisper_running 
    },
    { 
      name: "ElevenLabs TTS", 
      description: "Neural voice articulation synthesizer", 
      icon: Waves, 
      active: status?.elevenlabs_connected 
    },
    { 
      name: "FastAPI Backend", 
      description: "Asynchronous REST routing & orchestrator", 
      icon: Server, 
      active: status?.fastapi_online 
    },
    { 
      name: "SQLite Database", 
      description: "Persistent memory & application index storage", 
      icon: Database, 
      active: status?.database_connected 
    },
  ]

  const onlineCount = modules.filter(m => m.active).length
  const allSystemsGo = onlineCount === modules.length

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight font-display bg-gradient-to-r from-primary via-secondary to-white bg-clip-text text-transparent flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary animate-pulse" />
            SYSTEM CORE STATUS
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Live diagnostic feed of core AI subsystems, routers, and localized services.
          </p>
        </div>

        {/* Global Alert Badge */}
        <div className={cn(
          "glass-card px-5 py-3 rounded-2xl flex items-center gap-3 border transition-colors",
          allSystemsGo ? "border-[#10B981]/30 bg-[#10B981]/5" : "border-[#F59E0B]/30 bg-[#F59E0B]/5"
        )}>
          {allSystemsGo ? (
            <>
              <ShieldCheck className="w-5 h-5 text-success animate-bounce" />
              <div>
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Overall Integrity</div>
                <div className="text-sm font-bold text-success font-display">NOMINAL - ALL SYSTEMS ONLINE</div>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-warning animate-pulse" />
              <div>
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Overall Integrity</div>
                <div className="text-sm font-bold text-warning font-display">DEGRADED - SOME MODULES OFFLINE</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grid of Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod, idx) => (
          <motion.div
            key={mod.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.05 } }}
            whileHover={{ y: -3 }}
            className="relative"
          >
            <Card className="glass-card overflow-hidden hover:border-primary/30 transition-all h-full bg-[#0f172a]/70">
              <CardHeader className="pb-4 border-b border-[#3b82f6]/5">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-xl border",
                      mod.active ? "bg-primary/10 border-primary/20 text-primary" : "bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]"
                    )}>
                      <mod.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-md font-display font-bold text-white">
                        {mod.name}
                      </CardTitle>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Core Subsystem</span>
                    </div>
                  </div>
                  
                  {/* Glowing Status Dot */}
                  <span className="relative flex h-3 w-3">
                    {mod.active && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                    )}
                    <span className={cn(
                      "relative inline-flex rounded-full h-3 w-3",
                      mod.active ? "bg-[#10B981]" : "bg-[#EF4444]"
                    )}></span>
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4 space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed min-h-[32px]">
                  {mod.description}
                </p>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-[#3b82f6]/5">
                  <span className="text-muted-foreground">Network Status</span>
                  <span className={cn(
                    "font-bold font-display uppercase tracking-wider",
                    mod.active ? "text-success" : "text-danger"
                  )}>
                    {mod.active ? "CONNECTED" : "OFFLINE"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}