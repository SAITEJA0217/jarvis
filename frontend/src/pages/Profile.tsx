import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Save, User, GraduationCap, Code2, FolderGit, Briefcase, Mail, Phone, Info, Globe, Sparkles } from "lucide-react"

const Github = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
)
const Linkedin = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

export default function Profile() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<any>({})

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/profile")
      return res.json()
    },
  })

  useEffect(() => {
    if (profile) setFormData(profile)
  }, [profile])

  const mutation = useMutation({
    mutationFn: async (updatedProfile: any) => {
      const res = await fetch("http://localhost:8000/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      alert("Identity matrix committed successfully.")
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-display">Accessing identity registry records...</p>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === "skills" || name === "projects") {
      setFormData({ ...formData, [name]: value.split(",").map((s: string) => s.trim()) })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSave = () => {
    mutation.mutate(formData)
  }

  const skillsString = Array.isArray(formData?.skills) ? formData.skills.join(", ") : formData?.skills || ""
  const projectsString = Array.isArray(formData?.projects) ? formData.projects.join(", ") : formData?.projects || ""

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight font-display bg-gradient-to-r from-primary via-secondary to-white bg-clip-text text-transparent flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            IDENTITY DOSSIER
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Modify core personal parameters and credentials mapped to automated generation routines.
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={mutation.isPending}
          className="bg-gradient-to-r from-primary to-secondary text-background hover:opacity-90 font-bold px-6 py-3.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(56,189,248,0.25)] h-[48px]"
        >
          {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Commit Matrix
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column Forms */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Personal details card */}
          <div className="glass-card p-6 bg-[#0f172a]/60 border border-[#3b82f6]/10 space-y-6">
            <h3 className="text-sm font-display font-extrabold uppercase tracking-widest text-primary flex items-center gap-2 pb-2 border-b border-[#3b82f6]/10">
              <Info className="w-4 h-4 text-primary animate-pulse" /> Personal Parameters
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300 uppercase">Full Name</label>
                <input 
                  name="full_name" 
                  value={formData?.full_name || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#020617]/50 border border-[#3b82f6]/20 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300 uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-primary absolute left-3.5 top-3.5" />
                  <input 
                    name="email" 
                    value={formData?.email || ""} 
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#020617]/50 border border-[#3b82f6]/20 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300 uppercase">Phone Contact</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#22D3EE] absolute left-3.5 top-3.5" />
                  <input 
                    name="phone" 
                    value={formData?.phone || ""} 
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#020617]/50 border border-[#3b82f6]/20 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all font-sans"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300 uppercase">Startup Initials</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-[#22D3EE] absolute left-3.5 top-3.5" />
                  <input 
                    name="startup" 
                    value={formData?.startup || ""} 
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#020617]/50 border border-[#3b82f6]/20 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all font-sans"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Technical and academic profile details */}
          <div className="glass-card p-6 bg-[#0f172a]/60 border border-[#3b82f6]/10 space-y-6">
            <h3 className="text-sm font-display font-extrabold uppercase tracking-widest text-primary flex items-center gap-2 pb-2 border-b border-[#3b82f6]/10">
              <GraduationCap className="w-4 h-4 text-primary" /> Technical & Academic Profile
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300 uppercase">University</label>
                <input 
                  name="university" 
                  value={formData?.university || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#020617]/50 border border-[#3b82f6]/20 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300 uppercase">Degree & Specialization</label>
                <input 
                  name="degree" 
                  value={formData?.degree || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#020617]/50 border border-[#3b82f6]/20 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5 uppercase">
                <Code2 className="w-4 h-4 text-secondary" /> Skill Index (Comma Separated)
              </label>
              <textarea 
                name="skills" 
                value={skillsString} 
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#020617]/50 border border-[#3b82f6]/20 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans min-h-[75px] resize-y"
                placeholder="Python, React.js, FastAPI..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5 uppercase">
                <FolderGit className="w-4 h-4 text-secondary" /> Featured Projects (Comma Separated)
              </label>
              <textarea 
                name="projects" 
                value={projectsString} 
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#020617]/50 border border-[#3b82f6]/20 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans min-h-[75px] resize-y"
                placeholder="JARVIS OS, InternLink, FormPilot..."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Social Registry & Visual Profile Summary */}
        <div className="space-y-8">
          {/* Social connections */}
          <div className="glass-card p-6 bg-[#0f172a]/60 border border-[#3b82f6]/10 space-y-6">
            <h3 className="text-sm font-display font-extrabold uppercase tracking-widest text-secondary flex items-center gap-2 pb-2 border-b border-[#3b82f6]/10">
              <Globe className="w-4 h-4 text-secondary" /> Registry Accounts
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300 uppercase">GitHub Profile URL</label>
                <div className="relative">
                  <Github className="w-4 h-4 text-primary absolute left-3.5 top-3.5" />
                  <input 
                    name="github" 
                    value={formData?.github || ""} 
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#020617]/50 border border-[#3b82f6]/20 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans"
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300 uppercase">LinkedIn Profile URL</label>
                <div className="relative">
                  <Linkedin className="w-4 h-4 text-secondary absolute left-3.5 top-3.5" />
                  <input 
                    name="linkedin" 
                    value={formData?.linkedin || ""} 
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#020617]/50 border border-[#3b82f6]/20 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all font-sans"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active summary preview dossier */}
          <div className="glass-card p-6 bg-[#0f172a]/60 border border-[#3b82f6]/10 space-y-4">
            <h4 className="font-display font-bold text-xs text-white flex items-center gap-2 pb-2 border-b border-[#3b82f6]/10 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Dossier Summary
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-[#3b82f6]/5">
                <span className="text-muted-foreground font-mono">Committed Name:</span>
                <span className="font-bold text-white font-display text-right">{formData?.full_name || "Unconfigured"}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#3b82f6]/5">
                <span className="text-muted-foreground font-mono">Registered Email:</span>
                <span className="font-semibold text-slate-300 font-mono text-right">{formData?.email || "Unconfigured"}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#3b82f6]/5">
                <span className="text-muted-foreground font-mono">Affiliation:</span>
                <span className="font-bold text-secondary font-display text-right">{formData?.university || "Unconfigured"}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-muted-foreground font-mono">Total Skills Loaded:</span>
                <span className="font-bold text-success font-mono text-right">
                  {Array.isArray(formData?.skills) ? formData.skills.length : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}