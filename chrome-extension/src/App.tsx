import { useState, useEffect } from 'react'
import { Activity, Brain, Server } from 'lucide-react'

function App() {
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    fetch('http://localhost:8000/status')
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(e => console.error(e))
  }, [])

  return (
    <div className="w-80 h-96 p-4 bg-background text-foreground flex flex-col gap-4 font-sans">
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        <h1 className="text-lg font-bold tracking-tight text-primary uppercase">JARVIS OS Copilot</h1>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto">
        <div className="bg-card border border-border rounded-lg p-3 space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" />
            Backend Connection
          </h2>
          <div className="flex items-center justify-between text-sm font-medium">
            <span>FastAPI</span>
            <span className={status?.fastapi_online ? "text-green-500" : "text-red-500"}>
              {status?.fastapi_online ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-3 space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" />
            Ollama Intelligence
          </h2>
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Status</span>
            <span className={status?.ollama_connected ? "text-green-500" : "text-red-500"}>
              {status?.ollama_connected ? "Ready" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-border mt-auto">
        <button 
          onClick={() => window.open('http://localhost:5173')}
          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Activity className="w-4 h-4" />
          Open Full Dashboard
        </button>
      </div>
    </div>
  )
}

export default App
