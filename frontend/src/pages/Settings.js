import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Settings as SettingsIcon } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Settings() {
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
    <div className="p-8" data-testid="settings-page">
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold mb-2 flex items-center gap-3">
          <SettingsIcon className="h-10 w-10" />
          Settings
        </h1>
        <p className="text-muted-foreground">Configure your AI search preferences</p>
      </div>

      <Card className="p-6 max-w-2xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="ai-model">AI Model</Label>
            <Select
              value={settings.ai_model}
              onValueChange={(value) => setSettings({ ...settings, ai_model: value })}
            >
              <SelectTrigger data-testid="model-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-5.2">OpenAI GPT-5.2</SelectItem>
                <SelectItem value="gemini-3-flash-preview">Gemini 3 Flash</SelectItem>
                <SelectItem value="gemini-3-pro-preview">Gemini 3 Pro</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Select the AI model for candidate research and analysis
            </p>
          </div>

          <Button onClick={handleSave} disabled={loading} data-testid="save-settings-btn">
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </Card>
    </div>
  );
}