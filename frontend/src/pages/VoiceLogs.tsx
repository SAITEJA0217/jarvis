import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mic, Radio, Terminal, Sparkles, Cpu } from "lucide-react"

export default function VoiceLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ["voice-logs"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/voice-logs")
      return res.json()
    },
    refetchInterval: 2000 // Poll every 2 seconds for live updates
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-display">Interfacing with vocal log registers...</p>
      </div>
    )
  }

  const logs = data?.logs || []

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight font-display bg-gradient-to-r from-primary via-secondary to-white bg-clip-text text-transparent flex items-center gap-3">
            <Mic className="w-8 h-8 text-primary" />
            VOICE COMMAND LOGS
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Real-time transcript analysis, intent routing, and command execution pipelines.
          </p>
        </div>

        {/* Streaming Indicator */}
        <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-2 border border-[#22D3EE]/30 bg-[#22D3EE]/5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
          </span>
          <span className="text-xs text-secondary font-bold font-display uppercase tracking-wider">Listening Feed Live</span>
        </div>
      </div>

      <Card className="glass-card overflow-hidden bg-[#0f172a]/60">
        <CardHeader className="border-b border-[#3b82f6]/10 pb-4">
          <CardTitle className="text-lg flex items-center gap-2 font-display text-white">
            <Radio className="w-5 h-5 text-primary animate-pulse" />
            Audited Voice Triggers & Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[#3b82f6]/10">
            <AnimatePresence initial={false}>
              {logs.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-muted-foreground p-12 space-y-2"
                >
                  <Cpu className="w-12 h-12 mx-auto text-muted-foreground/35 animate-spin" />
                  <p className="font-semibold text-white">No Voice Commands Found</p>
                  <p className="text-xs max-w-sm mx-auto">
                    Speak into the AI Orb homepage or verify microphone integration is online.
                  </p>
                </motion.div>
              ) : (
                logs.map((log: any, idx: number) => (
                  <motion.div
                    key={log.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-primary/5 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-secondary glow-cyan" />
                        <p className="font-display font-semibold text-white text-md">
                          "{log.transcript}"
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Terminal className="w-3.5 h-3.5 text-secondary" />
                          Intent: <span className="text-white font-medium">{log.intent || "Unknown"}</span>
                        </span>
                        <span>•</span>
                        <span className="text-xs">{log.created_at || "Just now"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className="bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20 font-mono text-[11px] px-3 py-1 uppercase tracking-wider">
                        Router: {log.router}
                      </Badge>
                      <div className="p-1.5 rounded-lg bg-secondary/10 border border-secondary/20">
                        <Sparkles className="w-4 h-4 text-secondary" />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}