import { useState, useEffect, useRef } from "react"

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string) => void
  onEnd?: (finalTranscript: string) => void
  onError?: (error: string) => void
}

export function useSpeechRecognition({
  onResult,
  onEnd,
  onError
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  
  const recognitionRef = useRef<any>(null)
  const finalTranscriptRef = useRef("")

  const callbacksRef = useRef({ onResult, onEnd, onError })
  useEffect(() => {
    callbacksRef.current = { onResult, onEnd, onError }
  }, [onResult, onEnd, onError])

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError("BrowserSpeechUnsupported")
      return
    }

    const rec = new SpeechRecognition()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = "en-US"

    rec.onstart = () => {
      setIsListening(true)
      setError(null)
      setTranscript("")
      finalTranscriptRef.current = ""
    }

    rec.onresult = (event: any) => {
      let interimTranscript = ""
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscriptRef.current = text
        } else {
          interimTranscript = text
        }
      }
      const current = finalTranscriptRef.current || interimTranscript
      setTranscript(current)
      if (callbacksRef.current.onResult) {
        callbacksRef.current.onResult(current)
      }
    }

    rec.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error)
      let readableError = event.error
      if (event.error === "not-allowed") {
        readableError = "MicrophoneAccessDenied"
      }
      setError(readableError)
      setIsListening(false)
      if (callbacksRef.current.onError) {
        callbacksRef.current.onError(readableError)
      }
    }

    rec.onend = () => {
      setIsListening(false)
      const finalVal = finalTranscriptRef.current.trim()
      if (callbacksRef.current.onEnd && finalVal) {
        callbacksRef.current.onEnd(finalVal)
      }
    }

    recognitionRef.current = rec

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (e) {
          // ignore
        }
      }
    }
  }, [])

  const startListening = async () => {
    if (!recognitionRef.current) {
      if (error === "BrowserSpeechUnsupported") {
        if (callbacksRef.current.onError) callbacksRef.current.onError("BrowserSpeechUnsupported")
      } else {
        if (callbacksRef.current.onError) callbacksRef.current.onError("MicrophoneInitializationFailed")
      }
      return
    }
    
    try {
      // Force native browser microphone permission query dialog
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Release microphone tracks immediately so speech recognition can bind it
      stream.getTracks().forEach(track => track.stop())
      
      // Initialize speech recognition
      recognitionRef.current.start()
    } catch (e: any) {
      console.error("Microphone pre-flight permission error:", e)
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError" || e.message?.includes("denied")) {
        if (callbacksRef.current.onError) {
          callbacksRef.current.onError("MicrophoneAccessDenied")
        }
      } else {
        if (callbacksRef.current.onError) {
          callbacksRef.current.onError(e.message || "InitializationFailed")
        }
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e: any) {
        console.error("Speech stop error:", e)
      }
    }
    setIsListening(false)
  }

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    setTranscript
  }
}
