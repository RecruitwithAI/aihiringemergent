import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Settings as SettingsIcon, ArrowLeft } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({ ai_model: "gpt-5.2" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(response.data);
    } catch (error) {
      toast.error("Failed to load settings");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/settings`, settings);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white p-8" data-testid="settings-page">
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-4xl font-heading font-bold mb-2 flex items-center gap-3">
            <SettingsIcon className="h-10 w-10" />
            Settings
          </h1>
          <p className="text-slate-400">Configure your AI search preferences</p>
        </div>

        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ai-model" className="text-white">AI Model</Label>
              <Select
                value={settings.ai_model}
                onValueChange={(value) => setSettings({ ...settings, ai_model: value })}
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white" data-testid="model-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="gpt-5.2">OpenAI GPT-5.2</SelectItem>
                  <SelectItem value="gemini-3-flash-preview">Gemini 3 Flash</SelectItem>
                  <SelectItem value="gemini-3-pro-preview">Gemini 3 Pro</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-400">
                Select the AI model for candidate research and analysis
              </p>
            </div>

            <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700" data-testid="save-settings-btn">
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
