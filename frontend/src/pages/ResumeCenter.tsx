import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, FileText, Download, Eye, PlusCircle, Sparkles } from "lucide-react"

export default function ResumeCenter() {
  const queryClient = useQueryClient()
  const [targetRole, setTargetRole] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/resumes")
      return res.json()
    },
  })

  const generateMutation = useMutation({
    mutationFn: async (role: string) => {
      const res = await fetch("http://localhost:8000/resumes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] })
      setTargetRole("")
      alert("Resume generated successfully!")
    }
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-display">Interrogating resume archive databases...</p>
      </div>
    )
  }

  const resumes = data?.resumes || []

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight font-display bg-gradient-to-r from-primary via-secondary to-white bg-clip-text text-transparent flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            RESUME GENERATION HUB
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Generate and deploy role-specific, ATS-optimized resume files built with cognitive profile alignment.
          </p>
        </div>
      </div>

      {/* Manual Generation Control */}
      <div className="glass-card p-6 bg-[#0f172a]/60 space-y-4">
        <h3 className="text-md font-display font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-secondary animate-pulse" /> Direct Document Synthesis
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Target role (e.g. Software Engineer, Machine Learning Architect)..."
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="flex-1 bg-[#020617]/50 border border-[#3b82f6]/20 rounded-xl px-4 py-3 text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <button
            onClick={() => {
              if (targetRole.trim()) {
                generateMutation.mutate(targetRole)
              }
            }}
            disabled={generateMutation.isPending || !targetRole.trim()}
            className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-background hover:opacity-90 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(56,189,248,0.25)]"
          >
            {generateMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <PlusCircle className="w-5 h-5" /> Generate Resume
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resumes Grid */}
      {resumes.length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center text-center text-muted-foreground">
          <FileText className="w-16 h-16 mb-4 text-[#38BDF8] opacity-50" />
          <p className="text-xl font-bold text-white font-display">Archive Empty</p>
          <p className="text-sm mt-1 max-w-sm">
            Configure a target role above or trigger voice compilation by commanding JARVIS.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume: any, idx: number) => (
            <motion.div
              key={resume.id || idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.05 } }}
              whileHover={{ y: -3 }}
              className="glass-card flex flex-col justify-between overflow-hidden bg-[#0f172a]/70 relative group"
            >
              <CardHeader className="pb-3 border-b border-[#3b82f6]/5">
                <CardTitle className="font-display font-bold text-lg text-white group-hover:text-primary transition-colors flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {resume.role}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex-1 text-xs space-y-3">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-muted-foreground">Target Role:</span>
                  <span className="font-semibold text-white">{resume.role}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-muted-foreground">Compiled:</span>
                  <span>{resume.created_at || "Recent"}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-3 gap-3 border-t border-[#3b82f6]/10 bg-[#0f172a]/30">
                <button 
                  onClick={() => alert(`Path: ${resume.pdf_path}`)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/20 border border-[#22D3EE]/30 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button 
                  onClick={() => alert(`Downloading document at path: ${resume.pdf_path}`)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-background hover:opacity-90 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-[0_0_10px_rgba(56,189,248,0.15)]"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </CardFooter>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}