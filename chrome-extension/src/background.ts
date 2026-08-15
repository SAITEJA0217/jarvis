// JARVIS Background Service Worker
console.log("JARVIS Background Service Worker Loaded")

// Periodic check to ensure FastAPI is online
setInterval(async () => {
  try {
    const res = await fetch("http://localhost:8000/status")
    if (res.ok) {
      chrome.action.setBadgeText({ text: "ON" })
      chrome.action.setBadgeBackgroundColor({ color: "#10b981" }) // green
    } else {
      chrome.action.setBadgeText({ text: "OFF" })
      chrome.action.setBadgeBackgroundColor({ color: "#ef4444" }) // red
    }
  } catch (e) {
    chrome.action.setBadgeText({ text: "OFF" })
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" })
  }
}, 5000)
