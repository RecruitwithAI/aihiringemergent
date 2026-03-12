import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CreateMandate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: "",
    target_companies: "",
    geography: "",
    must_haves: "",
    no_go_constraints: "",
    compensation_band: "",
    reporting_line: "",
    ideal_backgrounds: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const companies = formData.target_companies
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c);

      const payload = {
        ...formData,
        target_companies: companies,
      };

      const response = await axios.post(`${API}/mandates`, payload);
      toast.success("Search mandate created successfully!");
      navigate(`/mandate/${response.data.id}`);
    } catch (error) {
      toast.error("Failed to create mandate");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-8" data-testid="create-mandate-page">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/")}
        data-testid="back-to-dashboard-btn"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="max-w-3xl">
        <h1 className="text-4xl font-heading font-bold mb-2">Create New Search</h1>
        <p className="text-muted-foreground mb-8">Define your candidate search parameters</p>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="role">Role / Position *</Label>
              <Input
                id="role"
                name="role"
                placeholder="e.g., VP of Engineering"
                value={formData.role}
                onChange={handleChange}
                required
                data-testid="role-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_companies">Target Companies (comma-separated) *</Label>
              <Textarea
                id="target_companies"
                name="target_companies"
                placeholder="e.g., Google, Microsoft, Amazon"
                value={formData.target_companies}
                onChange={handleChange}
                required
                data-testid="companies-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="geography">Geography *</Label>
              <Input
                id="geography"
                name="geography"
                placeholder="e.g., San Francisco Bay Area"
                value={formData.geography}
                onChange={handleChange}
                required
                data-testid="geography-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ideal_backgrounds">Ideal Backgrounds / Skills *</Label>
              <Textarea
                id="ideal_backgrounds"
                name="ideal_backgrounds"
                placeholder="e.g., SaaS, enterprise software, team scaling"
                value={formData.ideal_backgrounds}
                onChange={handleChange}
                required
                data-testid="backgrounds-input"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="compensation_band">Compensation Band</Label>
                <Input
                  id="compensation_band"
                  name="compensation_band"
                  placeholder="e.g., $200k-$300k"
                  value={formData.compensation_band}
                  onChange={handleChange}
                  data-testid="compensation-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reporting_line">Reporting Line</Label>
                <Input
                  id="reporting_line"
                  name="reporting_line"
                  placeholder="e.g., Reports to CTO"
                  value={formData.reporting_line}
                  onChange={handleChange}
                  data-testid="reporting-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="must_haves">Must-Haves</Label>
              <Textarea
                id="must_haves"
                name="must_haves"
                placeholder="Required qualifications and experience"
                value={formData.must_haves}
                onChange={handleChange}
                data-testid="must-haves-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="no_go_constraints">No-Go Constraints</Label>
              <Textarea
                id="no_go_constraints"
                name="no_go_constraints"
                placeholder="Deal-breakers or constraints"
                value={formData.no_go_constraints}
                onChange={handleChange}
                data-testid="no-go-input"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full" data-testid="submit-mandate-btn">
              {loading ? "Creating..." : "Create Search Mandate"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}