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
      navigate(`/talent-scout/mandate/${response.data.id}`);
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
    <div className="min-h-screen bg-[#0A0E27] text-white p-8" data-testid="create-mandate-page">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 text-slate-400 hover:text-white"
          onClick={() => navigate("/talent-scout")}
          data-testid="back-to-dashboard-btn"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Talent Scout
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold mb-2">Create New Search</h1>
          <p className="text-slate-400">Define your candidate search parameters</p>
        </div>

        <Card className="p-8 bg-slate-900/50 border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-white">Role / Position *</Label>
              <Input
                id="role"
                name="role"
                placeholder="e.g., VP of Engineering"
                value={formData.role}
                onChange={handleChange}
                required
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="role-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_companies" className="text-white">Target Companies (comma-separated) *</Label>
              <Textarea
                id="target_companies"
                name="target_companies"
                placeholder="e.g., Google, Microsoft, Amazon"
                value={formData.target_companies}
                onChange={handleChange}
                required
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="companies-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="geography" className="text-white">Geography *</Label>
              <Input
                id="geography"
                name="geography"
                placeholder="e.g., San Francisco Bay Area"
                value={formData.geography}
                onChange={handleChange}
                required
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="geography-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ideal_backgrounds" className="text-white">Ideal Backgrounds / Skills *</Label>
              <Textarea
                id="ideal_backgrounds"
                name="ideal_backgrounds"
                placeholder="e.g., SaaS, enterprise software, team scaling"
                value={formData.ideal_backgrounds}
                onChange={handleChange}
                required
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="backgrounds-input"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="compensation_band" className="text-white">Compensation Band</Label>
                <Input
                  id="compensation_band"
                  name="compensation_band"
                  placeholder="e.g., $200k-$300k"
                  value={formData.compensation_band}
                  onChange={handleChange}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  data-testid="compensation-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reporting_line" className="text-white">Reporting Line</Label>
                <Input
                  id="reporting_line"
                  name="reporting_line"
                  placeholder="e.g., Reports to CTO"
                  value={formData.reporting_line}
                  onChange={handleChange}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  data-testid="reporting-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="must_haves" className="text-white">Must-Haves</Label>
              <Textarea
                id="must_haves"
                name="must_haves"
                placeholder="Required qualifications and experience"
                value={formData.must_haves}
                onChange={handleChange}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="must-haves-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="no_go_constraints" className="text-white">No-Go Constraints</Label>
              <Textarea
                id="no_go_constraints"
                name="no_go_constraints"
                placeholder="Deal-breakers or constraints"
                value={formData.no_go_constraints}
                onChange={handleChange}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="no-go-input"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700" data-testid="submit-mandate-btn">
              {loading ? "Creating..." : "Create Search Mandate"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}