import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import "@/App.css";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import CreateMandate from "@/pages/CreateMandate";
import MandateDetail from "@/pages/MandateDetail";
import CandidateProfile from "@/pages/CandidateProfile";
import Settings from "@/pages/Settings";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="create-mandate" element={<CreateMandate />} />
            <Route path="mandate/:id" element={<MandateDetail />} />
            <Route path="candidate/:id" element={<CandidateProfile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;