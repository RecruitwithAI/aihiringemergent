import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, MapPin, Briefcase } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MandateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mandate, setMandate] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [mandateRes, candidatesRes] = await Promise.all([
        axios.get(`${API}/mandates/${id}`),
        axios.get(`${API}/mandates/${id}/candidates`),
      ]);
      setMandate(mandateRes.data);
      setCandidates(candidatesRes.data);
    } catch (error) {
      toast.error("Failed to load mandate details");
    } finally {
      setLoading(false);
    }
  };

  const startSearch = async () => {
    setSearching(true);
    try {
      const response = await axios.post(`${API}/search/orchestrate`, {
        mandate_id: id,
      });
      toast.success(response.data.message);
      setTimeout(() => fetchData(), 2000);
    } catch (error) {
      toast.error("Search failed: " + (error.response?.data?.detail || "Unknown error"));
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0A0E27] text-white p-8">Loading...</div>;
  }

  if (!mandate) {
    return <div className="min-h-screen bg-[#0A0E27] text-white p-8">Mandate not found</div>;
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white p-8" data-testid="mandate-detail-page">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 text-slate-400 hover:text-white"
          onClick={() => navigate("/talent-scout")}
          data-testid="back-btn"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Talent Scout
        </Button>

        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-heading font-bold mb-2" data-testid="mandate-title">{mandate.role}</h1>
              <p className="text-slate-400">{mandate.geography}</p>
            </div>
            <Button onClick={startSearch} disabled={searching} className="bg-blue-600 hover:bg-blue-700" data-testid="start-search-btn">
              <Play className="mr-2 h-4 w-4" />
              {searching ? "Searching..." : "Start Search"}
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-slate-900/50 border-slate-800">
              <div className="text-sm text-slate-400 mb-1">Target Companies</div>
              <div className="text-2xl font-heading font-bold">{mandate.target_companies.length}</div>
            </Card>
            <Card className="p-4 bg-slate-900/50 border-slate-800">
              <div className="text-sm text-slate-400 mb-1">Candidates Found</div>
              <div className="text-2xl font-heading font-bold" data-testid="candidate-count">{candidates.length}</div>
            </Card>
            <Card className="p-4 bg-slate-900/50 border-slate-800">
              <div className="text-sm text-slate-400 mb-1">Status</div>
              <Badge className="mt-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{mandate.status}</Badge>
            </Card>
          </div>

          <Card className="p-6 mb-8 bg-slate-900/50 border-slate-800">
            <h2 className="font-heading font-semibold text-lg mb-4">Search Criteria</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-1">Ideal Backgrounds</div>
                <p className="text-sm text-slate-400">{mandate.ideal_backgrounds || "Not specified"}</p>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Compensation Band</div>
                <p className="text-sm text-slate-400">{mandate.compensation_band || "Not specified"}</p>
              </div>
              {mandate.must_haves && (
                <div>
                  <div className="text-sm font-medium mb-1">Must-Haves</div>
                  <p className="text-sm text-slate-400">{mandate.must_haves}</p>
                </div>
              )}
              {mandate.no_go_constraints && (
                <div>
                  <div className="text-sm font-medium mb-1">No-Go Constraints</div>
                  <p className="text-sm text-slate-400">{mandate.no_go_constraints}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-heading font-bold mb-4">Candidates</h2>
          {candidates.length === 0 ? (
            <Card className="p-12 text-center bg-slate-900/50 border-slate-800" data-testid="no-candidates">
              <p className="text-slate-400">No candidates found yet. Click "Start Search" to begin.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {candidates.map((candidate) => (
                <Link key={candidate.id} to={`/talent-scout/candidate/${candidate.id}`}>
                  <Card className="p-6 bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70 transition-all cursor-pointer" data-testid={`candidate-card-${candidate.id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-heading font-semibold text-lg mb-1">{candidate.name}</h3>
                        <p className="text-sm text-slate-400 mb-3">
                          {candidate.current_title} at {candidate.current_employer}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          {candidate.location && (
                            <div className="flex items-center gap-1 text-slate-400">
                              <MapPin className="h-4 w-4" />
                              <span>{candidate.location}</span>
                            </div>
                          )}
                          {candidate.previous_employers.length > 0 && (
                            <div className="flex items-center gap-1 text-slate-400">
                              <Briefcase className="h-4 w-4" />
                              <span>Previous: {candidate.previous_employers[0]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-6 text-right">
                        <div className="text-sm text-slate-400 mb-1">Fit Score</div>
                        <div className="flex items-center gap-2">
                          <Progress value={candidate.fit_score} className="w-24 bg-slate-800" />
                          <span className="text-lg font-heading font-bold" data-testid={`fit-score-${candidate.id}`}>{Math.round(candidate.fit_score)}%</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
