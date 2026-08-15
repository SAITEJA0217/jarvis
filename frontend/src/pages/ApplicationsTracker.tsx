import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Building, Calendar, ArrowRightLeft, Sparkles, CheckCircle2, XCircle, Clock, Send } from "lucide-react"

const STATUSES = ["Applied", "Interviewing", "Accepted", "Rejected"]

const STATUS_CONFIGS: Record<string, {
  color: string;
  borderColor: string;
  glowColor: string;
  badgeBg: string;
  icon: any;
}> = {
  Applied: {
    color: "text-[#38BDF8]",
    borderColor: "border-[#38BDF8]/20",
    glowColor: "rgba(56, 189, 248, 0.15)",
    badgeBg: "bg-[#38BDF8]/10 text-[#38BDF8]",
    icon: Send
  },
  Interviewing: {
    color: "text-[#F59E0B]",
    borderColor: "border-[#F59E0B]/20",
    glowColor: "rgba(245, 158, 11, 0.15)",
    badgeBg: "bg-[#F59E0B]/10 text-[#F59E0B]",
    icon: Clock
  },
  Accepted: {
    color: "text-[#10B981]",
    borderColor: "border-[#10B981]/20",
    glowColor: "rgba(16, 185, 129, 0.15)",
    badgeBg: "bg-[#10B981]/10 text-[#10B981]",
    icon: CheckCircle2
  },
  Rejected: {
    color: "text-[#EF4444]",
    borderColor: "border-[#EF4444]/20",
    glowColor: "rgba(239, 68, 68, 0.15)",
    badgeBg: "bg-[#EF4444]/10 text-[#EF4444]",
    icon: XCircle
  }
}

export default function ApplicationsTracker() {
  const queryClient = useQueryClient()
  const [draggingId, setDraggingId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/applications")
      return res.json()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await fetch(`http://localhost:8000/applications/${id}?status=${encodeURIComponent(status)}`, {
        method: "PUT"
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] })
    }
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-display">Synchronizing applications pipeline...</p>
      </div>
    )
  }

  const applications = data?.applications || []

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    if (draggingId !== null) {
      updateMutation.mutate({ id: draggingId, status })
      setDraggingId(null)
    }
  }

  const handleStatusChangeClick = (id: number, currentStatus: string) => {
    const currentIndex = STATUSES.indexOf(currentStatus)
    const nextIndex = (currentIndex + 1) % STATUSES.length
    updateMutation.mutate({ id, status: STATUSES[nextIndex] })
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight font-display bg-gradient-to-r from-primary via-secondary to-white bg-clip-text text-transparent flex items-center gap-3">
          <ArrowRightLeft className="w-8 h-8 text-primary" />
          APPLICATION PIPELINE
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Drag and drop cards or click to transition application stages instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start overflow-x-auto pb-6">
        {STATUSES.map(status => {
          const columnApps = applications.filter((app: any) => app.status === status)
          const config = STATUS_CONFIGS[status]
          const StatusIcon = config.icon

          return (
            <div 
              key={status}
              className="flex-shrink-0 w-full min-w-[260px] bg-[#0f172a]/40 backdrop-blur-md rounded-2xl border border-[#3b82f6]/10 p-5 space-y-5 transition-all duration-300"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
              style={{
                boxShadow: draggingId !== null ? `0 0 20px ${config.glowColor}` : "none",
                borderColor: draggingId !== null ? `rgba(59,130,246,0.3)` : "rgba(59,130,246,0.1)"
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#3b82f6]/10">
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-5 h-5 ${config.color}`} />
                  <h3 className="font-display font-bold text-white tracking-wide">{status}</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-display ${config.badgeBg} border border-current/20`}>
                  {columnApps.length}
                </span>
              </div>
              
              {/* Cards Container */}
              <div className="space-y-4 min-h-[400px]">
                <AnimatePresence mode="popLayout">
                  {columnApps.map((app: any) => (
                    <motion.div
                      key={app.id}
                      layout
                      draggable
                      onDragStart={(e: any) => handleDragStart(e, app.id)}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      className="cursor-grab active:cursor-grabbing relative group"
                    >
                      <Card className="glass-card hover:border-primary/40 transition-colors shadow-lg overflow-hidden bg-[#0f172a]/80">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${status === 'Applied' ? 'bg-[#38BDF8]' : status === 'Interviewing' ? 'bg-[#F59E0B]' : status === 'Accepted' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                        <CardContent className="p-4 pl-5 space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="font-display font-bold text-white leading-tight group-hover:text-primary transition-colors text-sm line-clamp-2">
                              {app.role}
                            </div>
                          </div>

                          <div className="flex items-center text-xs text-slate-300 gap-1.5">
                            <Building className="w-3.5 h-3.5 text-secondary" />
                            <span className="font-medium truncate">{app.company}</span>
                          </div>

                          {app.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-1 italic bg-[#020617]/50 p-1.5 rounded border border-[#3b82f6]/5">
                              {app.notes}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] pt-2 border-t border-[#3b82f6]/10">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-3 h-3 text-secondary" />
                              <span>{app.applied_at?.split(' ')[0] || "Recent"}</span>
                            </div>
                            
                            <button
                              onClick={() => handleStatusChangeClick(app.id, app.status)}
                              className="text-[9px] bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors px-2 py-0.5 rounded-lg flex items-center gap-1"
                            >
                              <Sparkles className="w-2.5 h-2.5" /> Next Stage
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {columnApps.length === 0 && (
                  <div className="h-32 border-2 border-dashed border-[#3b82f6]/10 rounded-2xl flex flex-col items-center justify-center text-xs text-muted-foreground/60 transition-all hover:border-primary/20">
                    <Sparkles className="w-5 h-5 mb-1.5 text-muted-foreground/30" />
                    <span>Drop application here</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}