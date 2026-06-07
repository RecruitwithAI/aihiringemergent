import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Key, Eye, EyeOff, Check, X, AlertCircle, RefreshCw } from "lucide-react";

const CARD = "bg-white/[0.04] border border-white/[0.07] rounded-2xl";

export default function APIKeySettings() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [usageStats, setUsageStats] = useState(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      const res = await axios.get(`${API}/ai/usage`, { withCredentials: true });
      setUsageStats(res.data);
      setHasKey(res.data.has_own_api_key);
    } catch (err) {
      console.error("Failed to fetch usage stats:", err);
    }
  };

  const handleSave = async () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      toast.error("Please enter an API key");
      return;
    }
    if (trimmedKey.length < 10) {
      toast.error("API key looks invalid (too short)");
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        `${API}/ai/save-api-key`,
        { api_key: trimmedKey },
        { withCredentials: true }
      );
      toast.success(hasKey ? "API key updated successfully!" : "API key saved successfully!");
      setHasKey(true);
      setApiKey("");
      setShowKey(false);
      setShowUpdateForm(false);
      fetchUsageStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save API key");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/ai/delete-api-key`, { withCredentials: true });
      toast.success("API key removed");
      setHasKey(false);
      setApiKey("");
      setShowUpdateForm(false);
      setShowRemoveDialog(false);
      fetchUsageStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to remove API key");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16" data-testid="api-key-settings-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white font-[Lexend]">API Key Settings</h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            Manage your OpenAI API key for unlimited AI tool usage
          </p>
        </div>

        {/* Usage Stats - shown when no key configured */}
        {usageStats && !hasKey && (
          <div className={`${CARD} p-6 mb-6`} data-testid="free-tier-usage-card">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white mb-1">Free Tier Usage</h3>
                <p className="text-sm text-slate-400 mb-3">
                  You have {usageStats.daily_usage.remaining} of {usageStats.daily_usage.limit} free AI generations remaining today
                </p>
                <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${(usageStats.daily_usage.used / usageStats.daily_usage.limit) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">Resets daily at midnight UTC</p>
              </div>
            </div>
          </div>
        )}

        {/* API Key Card */}
        <div className={`${CARD} p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">OpenAI API Key</h2>
              <p className="text-sm text-slate-500">
                {hasKey ? "You have an API key configured" : "Add your own key for unlimited usage"}
              </p>
            </div>
          </div>

          {hasKey && !showUpdateForm ? (
            <div className="space-y-4" data-testid="api-key-active-state">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
                <Check className="w-5 h-5 text-green-400" strokeWidth={2} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-400">API Key Active</p>
                  <p className="text-xs text-slate-400 mt-0.5">You have unlimited AI generations</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowUpdateForm(true)}
                  data-testid="update-api-key-btn"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-sm font-medium transition-all"
                >
                  <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                  Update Key
                </button>
                <button
                  onClick={() => setShowRemoveDialog(true)}
                  data-testid="remove-api-key-btn"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-all"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                  Remove API Key
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4" data-testid="api-key-input-state">
              {showUpdateForm && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center gap-2 text-xs text-blue-300">
                  <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                  Saving a new key will replace your existing one.
                </div>
              )}
              <div>
                <Label className="text-sm text-slate-400 mb-2 block">Your OpenAI API Key</Label>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-12"
                    data-testid="api-key-input"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    type="button"
                    data-testid="toggle-show-key-btn"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Your API key is stored securely and never shared. Get your key from{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    OpenAI Platform
                  </a>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !apiKey.trim()}
                  data-testid="save-api-key-btn"
                  className="flex items-center gap-2 px-6 h-10 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" strokeWidth={2} />
                      {showUpdateForm ? "Update Key" : "Save API Key"}
                    </>
                  )}
                </button>

                {showUpdateForm && (
                  <button
                    onClick={() => {
                      setShowUpdateForm(false);
                      setApiKey("");
                      setShowKey(false);
                    }}
                    data-testid="cancel-update-key-btn"
                    className="flex items-center gap-2 px-4 h-10 rounded-full bg-white/[0.04] border border-white/[0.07] text-slate-300 hover:bg-white/[0.08] text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className={`${CARD} p-5 mt-6`}>
          <h3 className="text-sm font-semibold text-white mb-3">Why add your own API key?</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span><strong className="text-slate-300">Unlimited usage:</strong> No daily limits on AI generations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span><strong className="text-slate-300">Full control:</strong> You control your own OpenAI spending</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span><strong className="text-slate-300">Secure:</strong> Keys are encrypted and never exposed</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Remove Confirmation Dialog (replaces native window.confirm) */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent data-testid="remove-api-key-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove your OpenAI API key?</AlertDialogTitle>
            <AlertDialogDescription>
              Your stored key will be permanently removed. You&apos;ll be limited to 3 free AI generations per day
              (using the platform&apos;s default key) until you add a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="remove-api-key-cancel-btn" disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              data-testid="remove-api-key-confirm-btn"
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting ? "Removing..." : "Yes, Remove Key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
