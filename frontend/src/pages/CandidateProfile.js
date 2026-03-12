import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Briefcase, GraduationCap, Award, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CandidateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const fetchCandidate = async () => {
    try {
      const response = await axios.get(`${API}/candidates/${id}`);
      setCandidate(response.data);
    } catch (error) {
      toast.error("Failed to load candidate");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!candidate) {
    return <div className="p-8">Candidate not found</div>;
  }

  return (
    <div className="p-8" data-testid="candidate-profile-page">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(-1)}
        data-testid="back-btn"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="max-w-5xl">
        <div className="flex items-start gap-6 mb-8">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-3xl font-heading font-bold">
            {candidate.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-heading font-bold mb-2" data-testid="candidate-name">{candidate.name}</h1>
            <p className="text-lg text-muted-foreground mb-4">
              {candidate.current_title} at {candidate.current_employer}
            </p>
            <div className="flex items-center gap-6">
              {candidate.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{candidate.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{candidate.company_name}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-2">Fit Score</div>
            <div className="flex items-center gap-3">
              <Progress value={candidate.fit_score} className="w-32" />
              <span className="text-3xl font-heading font-bold" data-testid="fit-score">{Math.round(candidate.fit_score)}%</span>
            </div>
            <Badge variant="secondary" className="mt-2">
              {Math.round(candidate.confidence_score * 100)}% Confidence
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 col-span-2">
            <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
              <Award className="h-5 w-5" />
              Professional Background
            </h2>
            
            {candidate.scope && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Current Scope</h3>
                <p className="text-sm text-muted-foreground">{candidate.scope}</p>
              </div>
            )}

            {candidate.achievements && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Key Achievements</h3>
                <p className="text-sm text-muted-foreground">{candidate.achievements}</p>
              </div>
            )}

            {candidate.previous_employers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Previous Employers</h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.previous_employers.map((employer, idx) => (
                    <Badge key={idx} variant="outline">{employer}</Badge>
                  ))}
                </div>
              </div>
            )}

            {candidate.education && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Education
                </h3>
                <p className="text-sm text-muted-foreground">{candidate.education}</p>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Validation Needed
            </h2>
            <p className="text-sm text-muted-foreground">{candidate.gaps}</p>
          </Card>
        </div>

        {candidate.evidence && candidate.evidence.length > 0 && (
          <Card className="p-6">
            <h2 className="font-heading font-semibold text-lg mb-4">Evidence & Sources</h2>
            <div className="space-y-4">
              {candidate.evidence.map((evidence, idx) => (
                <div key={idx} className="border-l-2 border-accent pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm font-medium">{evidence.field_name}</div>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(evidence.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{evidence.snippet}</p>
                  {evidence.source_url !== "AI Generated" && (
                    <a
                      href={evidence.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent-foreground hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Source
                    </a>
                  )}
                  {idx < candidate.evidence.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}