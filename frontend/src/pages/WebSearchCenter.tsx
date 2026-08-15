import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, Globe, Newspaper, Briefcase, Sparkles, Clock, ExternalLink } from "lucide-react";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export default function WebSearchCenter() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [news, setNews] = useState<SearchResult[]>([]);
  const [internships, setInternships] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<string[]>(["OpenAI models", "FastAPI setup guide", "React 19 release date"]);
  const [activeTab, setActiveTab] = useState<"search" | "news" | "internships">("search");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setAnswer("");
    setResults([]);
    setNews([]);
    setInternships([]);
    
    if (!history.includes(query)) {
      setHistory(prev => [query, ...prev].slice(0, 8));
    }

    try {
      if (activeTab === "search") {
        const res = await fetch(`http://localhost:8000/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setAnswer(data.answer || "");
      } else if (activeTab === "news") {
        const res = await fetch(`http://localhost:8000/news?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setNews(data.results || []);
      } else if (activeTab === "internships") {
        const res = await fetch(`http://localhost:8000/internships/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setInternships(data.results || []);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (q: string) => {
    setQuery(q);
    // Auto trigger search with the clicked term
    setTimeout(() => {
      const form = document.getElementById("search-form") as HTMLFormElement;
      if (form) {
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    }, 50);
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight font-display bg-gradient-to-r from-primary via-secondary to-white bg-clip-text text-transparent flex items-center gap-3">
          <Globe className="w-8 h-8 text-primary animate-spin-slow" />
          WEB SEARCH GATEWAY
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Access real-time global knowledge, news matrices, and career listings with RAG summarization.
        </p>
      </div>

      {/* Main Search Panel */}
      <div className="glass-card p-6 space-y-6 bg-[#0f172a]/60">
        <div className="flex border-b border-[#3b82f6]/10 pb-4 gap-2 overflow-x-auto">
          {(["search", "news", "internships"] as const).map(tab => {
            const isActive = activeTab === tab;
            const Icon = tab === "search" ? Globe : tab === "news" ? Newspaper : Briefcase;
            const label = tab === "search" ? "Web Search" : tab === "news" ? "News Matrix" : "Job Openings";
            
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setQuery("");
                  setResults([]);
                  setNews([]);
                  setInternships([]);
                  setAnswer("");
                }}
                className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 font-display ${
                  isActive 
                    ? "bg-gradient-to-r from-primary to-secondary text-background shadow-[0_0_15px_rgba(56,189,248,0.25)]" 
                    : "text-muted-foreground hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            );
          })}
        </div>

        <form id="search-form" onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === "search" 
                  ? "Ask JARVIS to find any topic, docs, or technology..." 
                  : activeTab === "news" 
                  ? "Explore current trends and technology headlines..." 
                  : "Search internships, roles, and open job profiles..."
              }
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#3b82f6]/20 bg-[#020617]/50 text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3.5 bg-primary text-background hover:opacity-90 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(56,189,248,0.25)]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Query Matrix"}
          </button>
        </form>
      </div>

      {/* Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Area */}
        <div className="lg:col-span-3 space-y-6">
          {loading && (
            <div className="glass-card flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-display animate-pulse">JARVIS is crawling online sources...</p>
            </div>
          )}

          {/* RAG Answer Section */}
          {!loading && answer && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/5 border border-primary/20 p-6 rounded-2xl space-y-3 relative overflow-hidden"
            >
              <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
                <Sparkles className="w-24 h-24 text-primary" />
              </div>
              <h3 className="text-md font-display font-bold text-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-pulse" /> JARVIS COGNITIVE ANSWER
              </h3>
              <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">{answer}</p>
            </motion.div>
          )}

          {/* Web Search Cards */}
          {!loading && activeTab === "search" && results.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-secondary" /> Sources Found
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {results.map((r, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 glass-card space-y-2 relative group hover:border-secondary/40"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-md font-display font-bold text-primary hover:text-secondary hover:underline transition-colors flex items-center gap-1.5">
                        {r.title}
                        <ExternalLink className="w-3.5 h-3.5 inline-block opacity-70" />
                      </a>
                    </div>
                    <p className="text-[11px] text-muted-foreground break-all">{r.url}</p>
                    <p className="text-sm text-slate-300">{r.snippet}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* News Cards */}
          {!loading && activeTab === "news" && news.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-secondary" /> Latest Headlines
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {news.map((n, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 glass-card flex flex-col justify-between hover:border-[#22D3EE]/40"
                  >
                    <div className="space-y-2">
                      <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-sm font-display font-bold text-white hover:text-primary transition-colors line-clamp-2">
                        {n.title}
                      </a>
                      <p className="text-xs text-muted-foreground line-clamp-3">{n.snippet}</p>
                    </div>
                    <div className="pt-4 mt-auto border-t border-[#3b82f6]/5 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate max-w-[150px]">{n.url.split('/')[2] || "News source"}</span>
                      <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        Read <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Internship Search Cards */}
          {!loading && activeTab === "internships" && internships.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-secondary" /> Extracted Openings
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {internships.map((job, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 glass-card space-y-2 hover:border-primary/40"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-md font-display font-bold text-primary hover:text-secondary hover:underline transition-colors flex items-center gap-1">
                        {job.title}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-xs text-slate-300">{job.snippet}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* History Area */}
        <div className="space-y-6">
          <div className="glass-card p-4 space-y-4 bg-[#0f172a]/60">
            <h4 className="font-display font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-[#3b82f6]/10">
              <Clock className="w-4 h-4 text-primary" /> History Matrix
            </h4>
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground">No query records.</p>
            ) : (
              <div className="space-y-1">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => handleHistoryClick(h)}
                    className="w-full text-left text-xs px-3 py-2 rounded-xl hover:bg-primary/10 text-slate-300 hover:text-primary transition-all truncate block"
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
