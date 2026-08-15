import { useState } from "react"
import { Settings as SettingsIcon, Sliders, Shield, Volume2, HardDrive } from "lucide-react"

export default function Settings() {
  const [wakeWordSensitivity, setWakeWordSensitivity] = useState(70)
  const [selectedModel, setSelectedModel] = useState("llama3-jarvis-core")
  const [voiceVolume, setVoiceVolume] = useState(85)
  const [streamReplies, setStreamReplies] = useState(true)

  const handleSave = () => {
    alert("JARVIS OS Configuration Synced successfully.")
  }

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight font-display bg-gradient-to-r from-primary via-secondary to-white bg-clip-text text-transparent flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary animate-spin-slow" />
          SYSTEM CONFIGURATION
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Modify core threshold metrics, system intelligence models, and audio outputs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Settings Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cognitive Model Config */}
          <div className="glass-card p-6 bg-[#0f172a]/60 space-y-4">
            <h3 className="text-md font-display font-bold text-white flex items-center gap-2 pb-2 border-b border-[#3b82f6]/10">
              <HardDrive className="w-5 h-5 text-primary" /> Intelligence & Model Layers
            </h3>

            <div className="space-y-3">
              <label className="text-xs text-muted-foreground uppercase tracking-wider block">Active Ollama Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-[#020617] border border-[#3b82f6]/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="llama3-jarvis-core">Llama 3 (JARVIS Fine-tuned Custom)</option>
                <option value="mistral-7b-instruct">Mistral 7B Instruct</option>
                <option value="phi3-medium">Phi 3 Medium (Fast response)</option>
                <option value="qwen2-7b">Qwen 2 7B</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-sm font-semibold text-white block">Stream Responses</span>
                <span className="text-xs text-muted-foreground">Output tokens incrementally as they render</span>
              </div>
              <input
                type="checkbox"
                checked={streamReplies}
                onChange={(e) => setStreamReplies(e.target.checked)}
                className="w-5 h-5 accent-primary bg-[#020617] border-border rounded"
              />
            </div>
          </div>

          {/* Voice & Acoustic Settings */}
          <div className="glass-card p-6 bg-[#0f172a]/60 space-y-4">
            <h3 className="text-md font-display font-bold text-white flex items-center gap-2 pb-2 border-b border-[#3b82f6]/10">
              <Volume2 className="w-5 h-5 text-secondary" /> Vocal & Acoustic Calibrations
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-xs uppercase tracking-wider">
                <span className="text-muted-foreground">Wake Word Sensitivity</span>
                <span className="text-primary font-bold">{wakeWordSensitivity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={wakeWordSensitivity}
                onChange={(e) => setWakeWordSensitivity(Number(e.target.value))}
                className="w-full h-1.5 bg-[#020617] rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs uppercase tracking-wider">
                <span className="text-muted-foreground">TTS Volume Threshold</span>
                <span className="text-secondary font-bold">{voiceVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={voiceVolume}
                onChange={(e) => setVoiceVolume(Number(e.target.value))}
                className="w-full h-1.5 bg-[#020617] rounded-lg appearance-none cursor-pointer accent-secondary"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-background hover:opacity-90 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(56,189,248,0.25)]"
          >
            Save Calibrations
          </button>
        </div>

        {/* Security & System Info */}
        <div className="space-y-6">
          <div className="glass-card p-5 space-y-4 bg-[#0f172a]/60">
            <h4 className="font-display font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-[#3b82f6]/10">
              <Shield className="w-4 h-4 text-primary" /> Security Matrix
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Firewall Status:</span>
                <span className="text-success font-bold uppercase">NOMINAL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Memory Encryption:</span>
                <span className="text-success font-bold uppercase">AES-256</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Local Port Bound:</span>
                <span className="font-mono text-primary font-bold">8000</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 space-y-4 bg-[#0f172a]/60">
            <h4 className="font-display font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-[#3b82f6]/10">
              <Sliders className="w-4 h-4 text-secondary" /> Diagnostics
            </h4>
            <button 
              onClick={() => alert("Purging cached local context...")}
              className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-[#EF4444] border border-[#EF4444]/30 rounded-xl text-xs font-bold transition-all"
            >
              Purge Cache & Context
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}