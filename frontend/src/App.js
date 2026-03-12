import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import "@/App.css";
import Dashboard from "@/pages/Dashboard";
import AITools from "@/pages/AITools";
import TalentScoutDashboard from "@/pages/TalentScoutDashboard";
import CreateMandate from "@/pages/CreateMandate";
import MandateDetail from "@/pages/MandateDetail";
import CandidateProfile from "@/pages/CandidateProfile";
import Settings from "@/pages/Settings";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ai-tools" element={<AITools />} />
          <Route path="/talent-scout" element={<TalentScoutDashboard />} />
          <Route path="/talent-scout/create" element={<CreateMandate />} />
          <Route path="/talent-scout/mandate/:id" element={<MandateDetail />} />
          <Route path="/talent-scout/candidate/:id" element={<CandidateProfile />} />
          <Route path="/talent-scout/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;