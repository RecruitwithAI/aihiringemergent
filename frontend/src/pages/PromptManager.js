import { useState, useEffect, useCallback } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Loader2,
  Hash,
  Clock,
  Pencil,
} from "lucide-react";

export default function PromptManager() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTool, setExpandedTool] = useState(null);
  const [editingTool, setEditingTool] = useState(null);
  const [editText, setEditText] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(null);
  const [defaultPrompt, setDefaultPrompt] = useState("");

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/prompts`, { withCredentials: true });
      setPrompts(res.data);
    } catch (err) {
      toast.error("Failed to load prompts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleEdit = (prompt) => {
    setEditingTool(prompt.tool_type);
    setEditText(prompt.system_prompt);
    setEditDescription(prompt.description || "");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/prompts/${editingTool}`,
        { system_prompt: editText, description: editDescription },
        { withCredentials: true }
      );
      toast.success("Prompt updated successfully");
      setEditingTool(null);
      fetchPrompts();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update prompt");
    } finally {
      setSaving(false);
    }
  };

  const handleResetConfirm = async (toolType) => {
    try {
      const res = await axios.get(`${API}/prompts/${toolType}`, { withCredentials: true });
      setDefaultPrompt(res.data.default_prompt || "No default available");
      setConfirmReset(toolType);
    } catch {
      toast.error("Failed to fetch default prompt");
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/prompts/${confirmReset}/reset`, {}, { withCredentials: true });
      toast.success("Prompt reset to default");
      setConfirmReset(null);
      fetchPrompts();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to reset prompt");
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (toolType) => {
    setExpandedTool(expandedTool === toolType ? null : toolType);
  };

  if (user?.role !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-secondary)]">Access denied. SuperAdmin only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4 sm:px-6 lg:px-8" data-testid="prompt-manager-page">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]" data-testid="prompt-manager-title">
                System Prompts
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Manage AI tool system prompts. Changes take effect immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Prompt Cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--text-secondary)]" />
          </div>
        ) : (
          <div className="space-y-3">
            {prompts.map((prompt) => {
              const isExpanded = expandedTool === prompt.tool_type;
              return (
                <Card
                  key={prompt.tool_type}
                  className="border-[var(--border-primary)] bg-[var(--bg-card)]"
                  data-testid={`prompt-card-${prompt.tool_type}`}
                >
                  {/* Collapsed header */}
                  <button
                    onClick={() => toggleExpand(prompt.tool_type)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--bg-hover)] transition-colors rounded-xl"
                    data-testid={`prompt-toggle-${prompt.tool_type}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-semibold text-[var(--text-primary)] truncate">
                        {prompt.tool_name}
                      </span>
                      <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 font-mono">
                        {prompt.tool_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="hidden sm:flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <Hash className="w-3 h-3" /> v{prompt.version}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-[var(--border-primary)]">
                      <p className="text-sm text-[var(--text-secondary)] mt-3 mb-3">
                        {prompt.description}
                      </p>
                      <pre
                        className="text-sm text-[var(--text-primary)] whitespace-pre-wrap bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border-primary)] max-h-64 overflow-y-auto font-mono leading-relaxed"
                        data-testid={`prompt-text-${prompt.tool_type}`}
                      >
                        {prompt.system_prompt}
                      </pre>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                          <Clock className="w-3 h-3" />
                          <span>Updated: {prompt.updated_at ? new Date(prompt.updated_at).toLocaleDateString() : "—"}</span>
                          {prompt.updated_by && prompt.updated_by !== "system" && (
                            <span className="text-amber-400/70">by admin</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetConfirm(prompt.tool_type)}
                            data-testid={`prompt-reset-btn-${prompt.tool_type}`}
                            className="text-xs"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" /> Reset
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEdit(prompt)}
                            data-testid={`prompt-edit-btn-${prompt.tool_type}`}
                            className="text-xs"
                          >
                            <Pencil className="w-3 h-3 mr-1" /> Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTool} onOpenChange={(open) => !open && setEditingTool(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="prompt-edit-dialog-title">
              Edit: {prompts.find((p) => p.tool_type === editingTool)?.tool_name}
            </DialogTitle>
            <DialogDescription>
              Modify the system prompt. Changes take effect on the next AI generation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)] mb-1 block">
                Description
              </label>
              <input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                data-testid="prompt-edit-description"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)] mb-1 block">
                System Prompt
              </label>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={16}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
                data-testid="prompt-edit-textarea"
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {editText.length} characters
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditingTool(null)}
                data-testid="prompt-edit-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !editText.trim()}
                data-testid="prompt-edit-save"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={!!confirmReset} onOpenChange={(open) => !open && setConfirmReset(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="prompt-reset-dialog-title">Reset to Default?</DialogTitle>
            <DialogDescription>
              This will replace the current prompt with the original built-in default. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Default prompt preview:</p>
            <pre className="text-xs text-[var(--text-primary)] whitespace-pre-wrap bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-primary)] max-h-48 overflow-y-auto font-mono">
              {defaultPrompt}
            </pre>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmReset(null)} data-testid="prompt-reset-cancel">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={saving}
              data-testid="prompt-reset-confirm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
              Reset to Default
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
