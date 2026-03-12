import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Briefcase, Users, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TalentScoutDashboard() {
  const navigate = useNavigate();
  const [mandates, setMandates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMandates();
  }, []);

  const fetchMandates = async () => {
    try {
      const response = await axios.get(`${API}/mandates`);
      setMandates(response.data);
    } catch (error) {
      toast.error("Failed to load mandates");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white p-8" data-testid="talent-scout-dashboard">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 text-slate-400 hover:text-white"
          onClick={() => navigate("/ai-tools")}
          data-testid="back-to-tools-btn"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to AI Tools
        </Button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-heading font-bold mb-2">Talent Scout</h1>
            <p className="text-slate-400">Manage your candidate searches</p>
          </div>
          <Link to="/talent-scout/create">
            <Button className="bg-blue-600 hover:bg-blue-700" data-testid="create-search-btn">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Search
            </Button>
          </Link>
        </div>

        {mandates.length === 0 && !loading ? (
          <Card className="p-12 text-center bg-slate-900/50 border-slate-800" data-testid="empty-state">
            <Briefcase className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <h2 className="text-2xl font-heading font-semibold mb-2">No searches yet</h2>
            <p className="text-slate-400 mb-6">Create your first candidate search to get started</p>
            <Link to="/talent-scout/create">
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="create-first-search-btn">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Search
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mandates.map((mandate) => (
              <Link key={mandate.id} to={`/talent-scout/mandate/${mandate.id}`}>
                <Card className="p-6 bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70 transition-all cursor-pointer" data-testid={`mandate-card-${mandate.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-heading font-semibold text-lg mb-1">{mandate.role}</h3>
                      <p className="text-sm text-slate-400">{mandate.geography}</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" data-testid={`mandate-status-${mandate.id}`}>{mandate.status}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Briefcase className="h-4 w-4" />
                      <span>{mandate.target_companies.length} companies</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Users className="h-4 w-4" />
                      <span>{mandate.candidate_count || 0} candidates</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}