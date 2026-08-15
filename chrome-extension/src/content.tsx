import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function JarvisWidget() {
  const [loading, setLoading] = useState(false)

  const handleAutofill = async () => {
    setLoading(true)
    try {
      // 1. Scan DOM for inputs
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'))
        .filter((el): el is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement => {
          // Ignore hidden inputs or non-typable inputs
          if (el instanceof HTMLInputElement && (el.type === 'hidden' || el.type === 'submit')) return false
          return true
        })

      const fieldsData = inputs.map((el, index) => {
        // Ensure element has an ID for mapping
        if (!el.id) el.id = `jarvis-field-${index}`
        
        let labelText = ''
        if (el.labels && el.labels.length > 0) {
          labelText = el.labels[0].innerText
        } else {
          // Fallback to searching nearby text or aria-label
          labelText = el.getAttribute('aria-label') || el.name || (el instanceof HTMLSelectElement ? '' : el.placeholder) || ''
        }

        return {
          id: el.id,
          type: el.type,
          label: labelText.trim(),
          name: el.name
        }
      })

      if (fieldsData.length === 0) {
        alert("JARVIS: No input fields detected on this page.")
        setLoading(false)
        return
      }

      // 2. Send to Backend for Ollama Mapping
      const res = await fetch("http://localhost:8000/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: fieldsData })
      })
      
      const data = await res.json()
      
      if (!data.success) {
        alert("JARVIS Error: " + data.error)
        setLoading(false)
        return
      }

      // 3. Fill the form
      const mapped = data.mapped || []
      let filledCount = 0

      mapped.forEach((item: any) => {
        const el = document.getElementById(item.id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        if (el && item.value && item.value !== "UNKNOWN") {
          el.value = item.value
          // Dispatch events so React/Vue sites register the change
          el.dispatchEvent(new Event('input', { bubbles: true }))
          el.dispatchEvent(new Event('change', { bubbles: true }))
          el.style.backgroundColor = 'rgba(16, 185, 129, 0.1)' // Highlight filled fields green
          el.style.border = '1px solid #10b981'
          filledCount++
        }
      })

      alert(`JARVIS: Autofill complete! Filled ${filledCount} fields.`)

    } catch (e) {
      console.error(e)
      alert("JARVIS: Autofill failed. Ensure FastAPI backend is running.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[2147483647] flex flex-col items-end gap-2 font-sans">
      <div className="bg-card text-card-foreground border border-border shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-xl p-4 w-64 backdrop-blur-xl bg-opacity-90">
        <h3 className="font-bold text-primary mb-3 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          JARVIS Copilot
        </h3>
        <button 
          onClick={handleAutofill}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? "Analyzing DOM..." : "Autofill with JARVIS"}
        </button>
        
        <button 
          onClick={async () => {
            const company = prompt("Company Name:") || "Unknown"
            const role = prompt("Role:") || "Unknown Role"
            try {
              await fetch("http://localhost:8000/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ company, role, source: window.location.hostname, resume_id: -1, status: "Applied" })
              })
              alert("JARVIS: Application tracked successfully!")
            } catch (e) {
              alert("JARVIS: Failed to track application.")
            }
          }}
          className="w-full mt-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          Track Application
        </button>
      </div>
    </div>
  )
}

// Inject into DOM securely
const injectWidget = () => {
  const container = document.createElement('div')
  container.id = 'jarvis-os-copilot-root'
  document.body.appendChild(container)
  
  const root = createRoot(container)
  root.render(<JarvisWidget />)
}

injectWidget()
