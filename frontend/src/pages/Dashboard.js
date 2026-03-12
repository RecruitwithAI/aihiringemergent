import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Briefcase, Users } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
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
    <div className="p-8" data-testid="dashboard">
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Manage your candidate searches</p>
      </div>

      {mandates.length === 0 && !loading ? (
        <Card className="p-12 text-center" data-testid="empty-state">
          <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-heading font-semibold mb-2">No searches yet</h2>
          <p className="text-muted-foreground mb-6">Create your first candidate search to get started</p>
          <Link to="/create-mandate">
            <Button data-testid="create-first-mandate-btn">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Search
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mandates.map((mandate) => (
            <Link key={mandate.id} to={`/mandate/${mandate.id}`}>
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" data-testid={`mandate-card-${mandate.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-1">{mandate.role}</h3>
                    <p className="text-sm text-muted-foreground">{mandate.geography}</p>
                  </div>
                  <Badge variant="secondary" data-testid={`mandate-status-${mandate.id}`}>{mandate.status}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{mandate.target_companies.length} companies</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{mandate.candidate_count || 0} candidates</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}