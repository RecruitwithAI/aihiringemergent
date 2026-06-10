import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import logger from "@/lib/logger";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BrainCog, Loader2, Lock } from "lucide-react";
import PromptToolCard from "@/components/admin/prompts/PromptToolCard";

export default function PromptManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/prompts`, { withCredentials: true });
      setTools(res.data.tools);
    } catch (err) {
      logger.error("Failed to fetch prompts:", err);
      toast.error("Failed to load prompts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "superadmin") {
      navigate("/dashboard");
      return;
    }
    fetchPrompts();
  }, [user, navigate, fetchPrompts]);

  const run = async (fn, successMsg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(successMsg);
      await fetchPrompts();
      return true;
    } catch (err) {
      logger.error(err);
      toast.error(err.response?.data?.detail || "Operation failed");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (toolId, text, status, afterAction) => {
    const ok = await run(
      () => axios.post(`${API}/admin/prompts/${toolId}`, { system_prompt: text, status }, { withCredentials: true }),
      status === "active" ? "Prompt saved & activated — live immediately" : "Draft saved"
    );
    if (ok && afterAction) afterAction();
  };

  const handleActivate = (promptId) =>
    run(
      () => axios.post(`${API}/admin/prompts/${promptId}/activate`, {}, { withCredentials: true }),
      "Prompt activated — live immediately"
    );

  const handleDelete = (promptId) =>
    run(
      () => axios.delete(`${API}/admin/prompts/${promptId}`, { withCredentials: true }),
      "Draft deleted"
    );

  const handleReset = async (toolId, afterAction) => {
    const ok = await run(
      () => axios.post(`${API}/admin/prompts/${toolId}/reset`, {}, { withCredentials: true }),
      "Reset to original default prompt"
    );
    if (ok && afterAction) afterAction();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#090914] via-[#0a0a1a] to-[#090914] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090914] via-[#0a0a1a] to-[#090914]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="mb-4 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Panel
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <BrainCog className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white" data-testid="prompt-manager-heading">System Prompt Manager</h1>
          </div>
          <p className="text-slate-400">
            Edit the system prompts powering each AI tool. The <span className="text-green-400">active</span> version
            is used by the LLM immediately — no restart needed. Previous versions are kept and can be restored.
          </p>
          <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <p className="text-sm text-purple-400 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <strong>SuperAdmin only.</strong> Changes affect AI output for all users instantly.
            </p>
          </div>
        </div>

        {/* Tool cards */}
        <div data-testid="prompt-tool-list">
          {tools.map((tool) => (
            <PromptToolCard
              key={tool.tool_id}
              tool={tool}
              onSave={handleSave}
              onActivate={handleActivate}
              onDelete={handleDelete}
              onReset={handleReset}
              busy={busy}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
