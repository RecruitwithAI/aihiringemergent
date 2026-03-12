import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, MapPin, Briefcase, TrendingUp } from "lucide-react";
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
    return <div className="p-8">Loading...</div>;
  }

  if (!mandate) {
    return <div className="p-8">Mandate not found</div>;
  }

  return (
    <div className="p-8" data-testid="mandate-detail-page">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/")}
        data-testid="back-btn"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-heading font-bold mb-2" data-testid="mandate-title">{mandate.role}</h1>
            <p className="text-muted-foreground">{mandate.geography}</p>
          </div>
          <Button onClick={startSearch} disabled={searching} data-testid="start-search-btn">
            <Play className="mr-2 h-4 w-4" />
            {searching ? "Searching..." : "Start Search"}
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Target Companies</div>
            <div className="text-2xl font-heading font-bold">{mandate.target_companies.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Candidates Found</div>
            <div className="text-2xl font-heading font-bold" data-testid="candidate-count">{candidates.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Status</div>
            <Badge variant="secondary" className="mt-1">{mandate.status}</Badge>
          </Card>
        </div>

        <Card className="p-6 mb-8">
          <h2 className="font-heading font-semibold text-lg mb-4">Search Criteria</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-1">Ideal Backgrounds</div>
              <p className="text-sm text-muted-foreground">{mandate.ideal_backgrounds || "Not specified"}</p>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Compensation Band</div>
              <p className="text-sm text-muted-foreground">{mandate.compensation_band || "Not specified"}</p>
            </div>
            {mandate.must_haves && (
              <div>
                <div className="text-sm font-medium mb-1">Must-Haves</div>
                <p className="text-sm text-muted-foreground">{mandate.must_haves}</p>
              </div>
            )}
            {mandate.no_go_constraints && (
              <div>
                <div className="text-sm font-medium mb-1">No-Go Constraints</div>
                <p className="text-sm text-muted-foreground">{mandate.no_go_constraints}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-heading font-bold mb-4">Candidates</h2>
        {candidates.length === 0 ? (
          <Card className="p-12 text-center" data-testid="no-candidates">
            <p className="text-muted-foreground">No candidates found yet. Click "Start Search" to begin.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {candidates.map((candidate) => (
              <Link key={candidate.id} to={`/candidate/${candidate.id}`}>
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" data-testid={`candidate-card-${candidate.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-lg mb-1">{candidate.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {candidate.current_title} at {candidate.current_employer}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {candidate.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{candidate.location}</span>
                          </div>
                        )}
                        {candidate.previous_employers.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span>Previous: {candidate.previous_employers[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-6 text-right">
                      <div className="text-sm text-muted-foreground mb-1">Fit Score</div>
                      <div className="flex items-center gap-2">
                        <Progress value={candidate.fit_score} className="w-24" />
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
  );
}