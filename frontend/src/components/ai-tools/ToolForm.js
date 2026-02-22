import { Sparkles, History, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const CARD = "bg-white/[0.04] border border-white/[0.07] rounded-2xl";

export default function ToolForm({
  tool,
  prompt,
  context,
  generating,
  onPromptChange,
  onContextChange,
  onGenerate,
  onShowHistory,
  hasHistory,
}) {
  return (
    <div className="space-y-6 tool-form-container">
      {/* Prompt Input */}
      <div className={`${CARD} p-6 space-y-4 tool-form-card`}>
        <Label className="text-sm font-medium text-slate-300 tool-form-label">
          {tool.label} Prompt <span className="text-red-400">*</span>
        </Label>
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={tool.prompt}
          className="min-h-[120px] bg-white/[0.02] border-white/[0.08] text-white placeholder:text-slate-500 resize-none focus:border-blue-500/30 tool-form-textarea"
        />
        <p className="text-xs text-slate-500 tool-form-hint">
          Be specific and detailed for best results
        </p>
      </div>

      {/* Additional Context (Optional) */}
      <div className={`${CARD} p-6 space-y-4 tool-form-card`}>
        <Label className="text-sm font-medium text-slate-300 tool-form-label">
          Additional Context (Optional)
        </Label>
        <Textarea
          value={context}
          onChange={(e) => onContextChange(e.target.value)}
          placeholder="Add any specific requirements, preferences, or additional details here..."
          className="min-h-[100px] bg-white/[0.02] border-white/[0.08] text-white placeholder:text-slate-500 resize-none focus:border-blue-500/30 tool-form-textarea"
        />
        <p className="text-xs text-slate-500 tool-form-hint">
          Optional: Add extra context, constraints, or formatting preferences
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGenerate}
          disabled={generating || !prompt.trim()}
          className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-full bg-gradient-to-r ${
            tool.id === "jd-builder"
              ? "from-blue-500 to-cyan-500"
              : tool.id === "search-strategy"
              ? "from-cyan-500 to-blue-500"
              : tool.id === "candidate-research"
              ? "from-violet-500 to-purple-500"
              : tool.id === "dossier"
              ? "from-amber-500 to-orange-500"
              : "from-emerald-500 to-green-500"
          } hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-base transition-all shadow-lg ${
            tool.id === "jd-builder"
              ? "shadow-blue-500/25"
              : tool.id === "search-strategy"
              ? "shadow-cyan-500/25"
              : tool.id === "candidate-research"
              ? "shadow-violet-500/25"
              : tool.id === "dossier"
              ? "shadow-amber-500/25"
              : "shadow-emerald-500/25"
          }`}
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" strokeWidth={1.5} />
              Generate with AI
            </>
          )}
        </button>

        {hasHistory && (
          <button
            onClick={onShowHistory}
            disabled={generating}
            className="flex items-center gap-2 px-6 h-12 rounded-full bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-slate-300 hover:text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <History className="w-5 h-5" strokeWidth={1.5} />
            <span className="hidden sm:inline">History</span>
          </button>
        )}
      </div>
    </div>
  );
}
