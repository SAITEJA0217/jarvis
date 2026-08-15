import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Send, Sparkles, Terminal, Activity, Globe, Briefcase, FileText, Volume2, VolumeX, AlertCircle, X, ShieldAlert } from "lucide-react"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"

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
const Chrome = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <line x1="21.17" y1="8" x2="12" y2="8" />
    <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
    <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
  </svg>
)

interface Message {
  id: string
  text: string
  sender: "user" | "jarvis"
  timestamp: string
}

interface ToastMessage {
  id: string
  type: "error" | "info" | "success"
  text: string
}

export default function AIAssistant() {
  const [orbState, setOrbState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle")
  const [inputText, setInputText] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "System initialized. Welcome home, Karka Saiteja Reddy. Ready for your command.",
      sender: "jarvis",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [wakeWordOnline, setWakeWordOnline] = useState(true)
  const [speakResponse, setSpeakResponse] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  
  // Diagnostic parameters
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null)
  const [micPermissionState, setMicPermissionState] = useState<string>("unknown")
  const [lastRecognitionError, setLastRecognitionError] = useState<string>("none")
  const [showDiagnostics, setShowDiagnostics] = useState(true)

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Diagnostics check on mount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setSpeechSupported(!!SpeechRecognition)

    // Check query microphone permission status if API is supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "microphone" as any })
        .then((permissionStatus) => {
          setMicPermissionState(permissionStatus.state)
          permissionStatus.onchange = () => {
            setMicPermissionState(permissionStatus.state)
          }
        })
        .catch(() => {
          setMicPermissionState("query unsupported")
        })
    } else {
      setMicPermissionState("query unsupported")
    }
  }, [])

  // Mock wake word status checks or active listeners
  useEffect(() => {
    const timer = setInterval(() => {
      setWakeWordOnline(prev => !prev ? true : prev)
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  const addToast = (type: "error" | "info" | "success", text: string) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, type, text }])
    setTimeout(() => {
      removeToast(id)
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const speakText = (text: string) => {
    if (!speakResponse) return
    try {
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Select the best available English voice
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(v => v.lang.startsWith("en-") && v.name.includes("Google")) || 
                              voices.find(v => v.lang.startsWith("en-"))
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onstart = () => setOrbState("speaking")
      utterance.onend = () => setOrbState("idle")
      utterance.onerror = (e) => {
        console.error("SpeechSynthesis error:", e)
        setOrbState("idle")
      }
      
      // Delay speak request slightly to let synthesis cancel complete
      setTimeout(() => {
        window.speechSynthesis.speak(utterance)
      }, 60)
    } catch (err) {
      console.error("Speech Synthesis Error:", err)
      setOrbState("idle")
    }
  }

  const handleSendCommand = async (text: string) => {
    if (!text.trim()) return
    
    // Stop speaking if new command entered
    window.speechSynthesis.cancel()

    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, userMsg])
    setInputText("")
    
    setOrbState("thinking")
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/ask?q=${encodeURIComponent(text)}`)
      if (!response.ok) {
        throw new Error("BackendUnreachable")
      }
      const data = await response.json()
      
      const responseText = data.answer || "I did not receive a response."
      
      // Speak the response if toggled
      if (speakResponse) {
        speakText(responseText)
      } else {
        setOrbState("idle")
      }

      const jarvisMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "",
        sender: "jarvis",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      
      setMessages(prev => [...prev, jarvisMsg])
      
      let currentLength = 0
      const interval = setInterval(() => {
        currentLength += 3
        setMessages(prev => 
          prev.map(msg => 
            msg.id === jarvisMsg.id 
              ? { ...msg, text: responseText.slice(0, currentLength) }
              : msg
          )
        )
        if (currentLength >= responseText.length) {
          clearInterval(interval)
        }
      }, 15)

    } catch (error: any) {
      setOrbState("idle")
      addToast("error", "Failed to communicate with local brain. Check if FastAPI backend is running.")
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "System offline. Failed to establish communication with local brain.",
        sender: "jarvis",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    }
  }

  // Set up speech recognition hook
  const {
    isListening,
    transcript,
    startListening,
    stopListening
  } = useSpeechRecognition({
    onEnd: (finalTranscript) => {
      handleSendCommand(finalTranscript)
    },
    onError: (errType) => {
      setOrbState("idle")
      setLastRecognitionError(errType)
      if (errType === "MicrophoneAccessDenied") {
        addToast("error", "Microphone access denied. Please verify browser permissions.")
      } else if (errType === "BrowserSpeechUnsupported") {
        addToast("error", "Web speech recognition is not supported in this browser. Try Chrome.")
      } else {
        addToast("error", `Voice recognition error: ${errType}`)
      }
    }
  })

  // Synchronize Speech Recognition state with AI Orb state
  useEffect(() => {
    if (isListening) {
      setOrbState("listening")
    } else if (orbState === "listening") {
      setOrbState("idle")
    }
  }, [isListening])

  const handleOrbClick = () => {
    if (orbState === "listening") {
      stopListening()
    } else {
      window.speechSynthesis.cancel()
      startListening()
    }
  }

  const quickActions = [
    { label: "Who Am I", icon: Terminal, prompt: "Who am I" },
    { label: "Latest AI News", icon: Sparkles, prompt: "Latest AI news" },
    { label: "Search Internships", icon: Briefcase, prompt: "Find AI internships" },
    { label: "Generate Resume", icon: FileText, prompt: "Generate a markdown resume for AI internships" },
    { label: "Open Chrome", icon: Chrome, prompt: "Open chrome" },
    { label: "Open LinkedIn", icon: Linkedin, prompt: "Open linkedin" },
    { label: "Open GitHub", icon: Github, prompt: "Open github" },
    { label: "Open InternLink", icon: Globe, prompt: "Open internlink" },
  ]

  return (
    <div className="space-y-8 relative">
      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="pointer-events-auto glass-card px-4 py-3 flex items-center gap-3 border-l-4 border-l-danger bg-slate-950/90 shadow-2xl max-w-sm"
            >
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
              <div className="text-xs text-slate-200 flex-1">{toast.text}</div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="text-muted hover:text-white p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Top Header */}
      <div className="flex justify-between items-center glass-card p-6">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-wider bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI COMMAND CENTER
          </h1>
          <p className="text-muted-foreground text-sm">JARVIS OS Core Neural Network v4.0.0</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Speak Response Toggle */}
          <button
            onClick={() => {
              const next = !speakResponse
              setSpeakResponse(next)
              if (!next) window.speechSynthesis.cancel()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-mono transition-all ${
              speakResponse 
                ? "bg-primary/10 border-primary text-primary" 
                : "bg-slate-900/50 border-border text-muted-foreground"
            }`}
          >
            {speakResponse ? (
              <>
                <Volume2 className="w-4 h-4" /> Speak Response: ON
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" /> Speak Response: OFF
              </>
            )}
          </button>
          
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${wakeWordOnline ? "bg-success animate-pulse" : "bg-danger"}`} />
            <span className="text-xs font-mono text-muted-foreground">WAKE WORD: HEY JARVIS</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-slate-900/50 text-xs font-mono">
            <span className="text-muted mr-1">ORB CONTROL:</span>
            <span className="text-primary uppercase font-bold">{orbState}</span>
          </div>
        </div>
      </div>

      {/* Diagnostics Panel (Helps verify API & permissions status) */}
      {showDiagnostics && (
        <div className="glass-card p-4 border border-[#F59E0B]/20 bg-[#F59E0B]/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-warning flex-shrink-0" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-muted block uppercase tracking-wider text-[9px] font-mono">WebSpeech API</span>
                <span className={`font-bold ${speechSupported ? "text-success" : "text-danger"}`}>
                  {speechSupported === null ? "Detecting..." : speechSupported ? "Supported" : "Unsupported (Not Chrome/Edge)"}
                </span>
              </div>
              <div>
                <span className="text-muted block uppercase tracking-wider text-[9px] font-mono">Mic Permission</span>
                <span className={`font-bold ${micPermissionState === "granted" ? "text-success" : micPermissionState === "denied" ? "text-danger" : "text-warning"}`}>
                  {micPermissionState.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-muted block uppercase tracking-wider text-[9px] font-mono">Last Engine Error</span>
                <span className="font-mono text-slate-200 font-bold">{lastRecognitionError}</span>
              </div>
              <div>
                <span className="text-muted block uppercase tracking-wider text-[9px] font-mono">Active Target URL</span>
                <span className="font-mono text-primary font-bold">localhost:5173</span>
              </div>
            </div>
          </div>
          <button onClick={() => setShowDiagnostics(false)} className="text-muted hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Command Center Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Glowing Orb Section */}
        <div className="glass-card p-8 flex flex-col items-center justify-center space-y-6 relative overflow-hidden bg-[#0f172a]/40 min-h-[450px]">
          <span className="text-xs font-mono text-muted uppercase tracking-widest absolute top-6">
            Neural Core
          </span>

          <div className="relative flex items-center justify-center w-48 h-48">
            <motion.div
              animate={{
                scale: orbState === "listening" ? [1, 1.25, 1] : [1, 1.1, 1],
                opacity: orbState === "listening" ? [0.4, 0.8, 0.4] : [0.2, 0.4, 0.2]
              }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className={`absolute inset-0 rounded-full blur-2xl pointer-events-none ${
                orbState === "listening" ? "bg-[#22D3EE]" :
                orbState === "thinking" ? "bg-[#F59E0B]" :
                orbState === "speaking" ? "bg-[#10B981]" :
                "bg-[#38BDF8]"
              }`}
            />

            {/* Glowing Orb Core */}
            <motion.div
              animate={orbState === "listening" ? { rotate: 360 } : {}}
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              onClick={handleOrbClick}
              className={`w-28 h-28 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 glow-cyan-strong ${
                orbState === "listening" ? "bg-gradient-to-tr from-secondary to-cyan-500" :
                orbState === "thinking" ? "bg-gradient-to-tr from-warning to-amber-500" :
                orbState === "speaking" ? "bg-gradient-to-tr from-success to-emerald-500" :
                "bg-gradient-to-tr from-primary to-sky-500"
              }`}
            >
              {orbState === "listening" ? (
                <Mic className="w-10 h-10 text-slate-950 animate-bounce" />
              ) : orbState === "thinking" ? (
                <Sparkles className="w-10 h-10 text-slate-950 animate-spin" />
              ) : orbState === "speaking" ? (
                <Activity className="w-10 h-10 text-slate-950 animate-pulse" />
              ) : (
                <Mic className="w-10 h-10 text-slate-950 hover:scale-110 transition-transform" />
              )}
            </motion.div>

            {/* Waveform Sound Wave Indicators */}
            {orbState === "listening" && (
              <div className="absolute -bottom-8 flex gap-1 h-6 items-end">
                {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: ["20%", "100%", "20%"] }}
                    transition={{ repeat: Infinity, duration: 0.5 + i * 0.05, ease: "easeInOut" }}
                    className="w-1 bg-secondary rounded-full"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Status Label */}
          <div className="text-center space-y-1">
            <p className="text-lg font-display font-medium tracking-wide">
              {orbState === "idle" && "Neural Link Standby"}
              {orbState === "listening" && "Vocal Capture Active..."}
              {orbState === "thinking" && "Processing Command..."}
              {orbState === "speaking" && "Broadcasting Response..."}
            </p>
            <p className="text-xs font-mono text-muted">
              {orbState === "listening" ? "Transcribing speech..." : "Click orb to speak"}
            </p>
          </div>
        </div>

        {/* ChatGPT Style Live Chat Interface */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col h-[450px]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-3 space-y-1 text-sm border ${
                      msg.sender === "user" 
                        ? "bg-primary/10 border-primary/20 text-primary" 
                        : "bg-slate-900/50 border-border text-slate-100"
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    <span className="text-[10px] text-muted block text-right font-mono">{msg.timestamp}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {orbState === "thinking" && (
              <div className="flex justify-start">
                <div className="bg-slate-900/50 border border-border rounded-2xl px-4 py-3 flex gap-1.5 items-center">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-100" />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-200" />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-300" />
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Transcript Panel (if speech captured) */}
          {transcript && (
            <div className="my-2 p-2 rounded-lg border border-border bg-slate-900/20 text-xs font-mono text-secondary">
              SYSTEM CAPTURE: "{transcript}"
            </div>
          )}

          {/* Input Panel */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleOrbClick}
              className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                orbState === "listening" 
                  ? "bg-danger/20 border-danger text-danger animate-pulse" 
                  : "bg-slate-900/50 border-border hover:border-primary text-slate-100"
              }`}
            >
              {orbState === "listening" ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendCommand(inputText)}
              placeholder="Type an OS command or ask a question..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900/50 border border-border focus:border-primary focus:outline-none text-sm transition-colors text-slate-100 placeholder-slate-500"
            />
            
            <button
              onClick={() => handleSendCommand(inputText)}
              className="p-3 rounded-xl bg-primary hover:bg-sky-500 text-slate-950 transition-colors font-medium cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>

      {/* Quick Action Command Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-display font-medium tracking-wide">
          QUICK OVERRIDE ACTIONS
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleSendCommand(action.prompt)}
              className="glass-card p-4 flex flex-col items-center justify-center gap-3 text-center transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            >
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <action.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium tracking-wide text-slate-200">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
