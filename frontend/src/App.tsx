import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import DashboardLayout from "./layouts/DashboardLayout"
import AIAssistant from "./pages/AIAssistant"
import Dashboard from "./pages/Dashboard"
import Profile from "./pages/Profile"
import MemoryCenter from "./pages/MemoryCenter"
import InternshipCenter from "./pages/InternshipCenter"
import ResumeCenter from "./pages/ResumeCenter"
import ApplicationsTracker from "./pages/ApplicationsTracker"
import VoiceLogs from "./pages/VoiceLogs"
import SystemStatus from "./pages/SystemStatus"
import Settings from "./pages/Settings"
import WebSearchCenter from "./pages/WebSearchCenter"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<AIAssistant />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="memories" element={<MemoryCenter />} />
          <Route path="internships" element={<InternshipCenter />} />
          <Route path="resumes" element={<ResumeCenter />} />
          <Route path="applications" element={<ApplicationsTracker />} />
          <Route path="voice-logs" element={<VoiceLogs />} />
          <Route path="status" element={<SystemStatus />} />
          <Route path="search" element={<WebSearchCenter />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
