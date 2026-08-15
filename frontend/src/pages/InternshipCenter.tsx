import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, ExternalLink, Briefcase, MapPin, Building, CheckCircle2, SlidersHorizontal, Sparkles } from "lucide-react"

export default function InternshipCenter() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSource, setSelectedSource] = useState<string>("All")
  const [selectedLocation, setSelectedLocation] = useState<string>("All")
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["internships"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/internships")
      return res.json()
    },
  })

  const applyMutation = useMutation({
    mutationFn: async (internship: any) => {
      const payload = {
        company: internship.company,
        role: internship.title,
        source: internship.source,
        resume_id: -1,
        status: "Applied",
        notes: `Link: ${internship.url}`
      }
      const res = await fetch("http://localhost:8000/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] })
      alert("Application marked as Applied!")
    }
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-display">Accessing internship registry...</p>
      </div>
    )
  }

  const internships = data?.internships || []

  // Extract unique sources and locations for filter dropdowns
  const sources = ["All", ...Array.from(new Set(internships.map((i: any) => i.source)))] as string[]
  const locations = ["All", ...Array.from(new Set(internships.map((i: any) => i.location)))] as string[]

  const filtered = internships.filter((i: any) => {
    const matchesSearch = 
      i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSource = selectedSource === "All" || i.source === selectedSource
    const matchesLocation = selectedLocation === "All" || i.location === selectedLocation

    return matchesSearch && matchesSource && matchesLocation
  })

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight font-display bg-gradient-to-r from-primary via-secondary to-white bg-clip-text text-transparent flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary animate-pulse" />
            INTERNSHIP PORTAL
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Futuristic lead aggregation & AI matching interface.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-primary" />
          <input
            type="search"
            placeholder="Search roles, companies, keywords..."
            className="w-full bg-[#0f172a]/40 border border-[#3b82f6]/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-muted-foreground backdrop-blur-md transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filters Row */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-primary font-medium mr-2">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        {/* Source Filter */}
        <div className="flex flex-col gap-1">
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="bg-[#020617] border border-[#3b82f6]/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All">All Sources</option>
            {sources.filter(s => s !== "All").map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div className="flex flex-col gap-1">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-[#020617] border border-[#3b82f6]/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All">All Locations</option>
            {locations.filter(l => l !== "All").map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-xs text-muted-foreground">
          Showing <span className="text-secondary font-semibold">{filtered.length}</span> of {internships.length} leads
        </div>
      </div>

      {/* Grid Layout */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card p-16 flex flex-col items-center justify-center text-center text-muted-foreground border-dashed border-[#3b82f6]/30"
          >
            <Briefcase className="w-16 h-16 mb-4 text-[#38BDF8] opacity-60 animate-bounce" />
            <p className="text-xl font-semibold text-white font-display">No Matches Found</p>
            <p className="text-sm mt-1 max-w-md">
              Try refining your search terms, reset the filters, or trigger a web search request.
            </p>
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((internship: any, idx: number) => (
              <motion.div
                key={internship.id || idx}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.03 } }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -5 }}
                className="glass-card flex flex-col justify-between overflow-hidden relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <CardHeader className="pb-3 relative z-10">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5">
                      <CardTitle className="font-display text-lg text-white font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {internship.title}
                      </CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground gap-1.5">
                        <Building className="w-4 h-4 text-secondary" />
                        <span className="font-medium text-slate-200">{internship.company}</span>
                      </div>
                    </div>
                    <Badge className="bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 font-display">
                      {internship.source}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4 text-sm relative z-10">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-[#22D3EE]" />
                    <span>{internship.location || "Remote / Unspecified"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-[#3b82f6]/10">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Found: {internship.date_found || "Recent"}</span>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 gap-3 border-t border-[#3b82f6]/10 bg-[#0f172a]/30 relative z-10">
                  <a 
                    href={internship.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/20 border border-[#22D3EE]/30 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  >
                    View Role <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button 
                    onClick={() => applyMutation.mutate(internship)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-background hover:opacity-90 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(56,189,248,0.25)]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Track Lead
                  </button>
                </CardFooter>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}