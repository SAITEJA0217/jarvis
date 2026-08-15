import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Trash2, Plus, Search, Brain, KeyRound, TextQuote, Cpu } from "lucide-react"

export default function MemoryCenter() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["memories"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/memories")
      return res.json()
    },
  })

  const addMutation = useMutation({
    mutationFn: async (memory: { key: string, value: string }) => {
      const res = await fetch("http://localhost:8000/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memory),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] })
      setNewKey("")
      setNewValue("")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      const res = await fetch(`http://localhost:8000/memories/${encodeURIComponent(key)}`, {
        method: "DELETE",
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] })
    },
  })

  const memories = data?.memories || []
  const filteredMemories = memories.filter((m: any) => 
    m.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKey.trim() || !newValue.trim()) return
    addMutation.mutate({ key: newKey, value: newValue })
  }

  return (
    <div className="space-y-8">
      {/* Overview Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 md:col-span-2 flex items-center justify-between bg-[#0f172a]/60 border border-[#3b82f6]/10">
          <div className="space-y-1">
            <h2 className="text-2xl font-display font-extrabold tracking-wider bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ACTIVE MEMORY MATRIX
            </h2>
            <p className="text-xs text-slate-300">
              Personalized knowledge associations mapping user preferences and context keys directly into local LLM contexts.
            </p>
          </div>
          <Brain className="w-12 h-12 text-primary animate-pulse opacity-85" />
        </div>
        <div className="glass-card p-6 flex flex-col justify-between bg-[#0f172a]/60 border border-[#3b82f6]/10 relative group hover:border-primary/45 transition-colors">
          <span className="text-[10px] font-mono text-muted uppercase tracking-widest flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-secondary" /> Committed Memory Keys
          </span>
          <span className="text-4xl font-display font-black text-white mt-4">{memories.length}</span>
        </div>
      </div>

      {/* Add New Memory Form Card */}
      <div className="glass-card p-6 bg-[#0f172a]/60 border border-[#3b82f6]/10">
        <h3 className="text-md font-display font-bold text-white mb-5 tracking-wide flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> STORE NEW MEMORY LAYER
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 uppercase">Key Name</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-primary absolute left-3.5 top-3.5" />
              <input 
                value={newKey} 
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#020617]/50 border border-[#3b82f6]/20 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans"
                placeholder="e.g. Favorite editor"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 uppercase">Assigned Value</label>
            <div className="relative">
              <TextQuote className="w-4 h-4 text-secondary absolute left-3.5 top-3.5" />
              <input 
                value={newValue} 
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#020617]/50 border border-[#3b82f6]/20 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all font-sans"
                placeholder="e.g. Antigravity"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={addMutation.isPending}
            className="w-full py-3.5 px-4 rounded-xl bg-primary text-background hover:opacity-90 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 h-[46px] shadow-[0_0_15px_rgba(56,189,248,0.25)]"
          >
            {addMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Commit Memory
          </button>
        </form>
      </div>

      {/* Memory Table List Card */}
      <div className="glass-card p-6 bg-[#0f172a]/60 border border-[#3b82f6]/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#3b82f6]/10">
          <h3 className="text-sm font-display font-extrabold text-white tracking-widest">
            ASSOCIATION INDEX INDEX
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-primary absolute left-3.5 top-3" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search key or reference values..."
              className="w-full pl-10 pr-4 py-2 bg-[#020617]/50 border border-[#3b82f6]/20 rounded-xl text-xs text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-16"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
        ) : filteredMemories.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[#3b82f6]/10 rounded-2xl bg-[#020617]/20">
            <Brain className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2 animate-bounce" />
            <p className="text-sm font-semibold text-slate-300">No matching memory clusters located.</p>
            <p className="text-xs text-slate-500 mt-1">Try store controls above or refine search filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#3b82f6]/10 text-slate-300 font-mono text-xs uppercase tracking-wider">
                  <th className="pb-3 pl-4">Memory Key</th>
                  <th className="pb-3">Reference Content</th>
                  <th className="pb-3 text-right pr-4">Matrix Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3b82f6]/5">
                <AnimatePresence>
                  {filteredMemories.map((m: any) => (
                    <motion.tr 
                      key={m.key} 
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0 }}
                      className="hover:bg-primary/5 transition-all"
                    >
                      <td className="py-4 pl-4 font-mono text-xs text-primary font-semibold">{m.key}</td>
                      <td className="py-4 text-slate-200 text-xs">{m.value}</td>
                      <td className="py-4 text-right pr-4">
                        <button
                          onClick={() => deleteMutation.mutate(m.key)}
                          className="p-2.5 rounded-lg bg-danger/10 hover:bg-danger/25 text-danger border border-danger/20 transition-colors cursor-pointer"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}