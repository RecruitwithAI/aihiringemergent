import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronDown, ChevronUp, CheckCircle, FileEdit, RotateCcw,
  Save, Trash2, History, Loader2,
} from "lucide-react";

const fmtDate = (iso) => new Date(iso).toLocaleString();

function StatusPill({ status }) {
  const styles = {
    active: "bg-green-500/10 border-green-500/30 text-green-400",
    draft: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    old: "bg-slate-500/10 border-slate-500/30 text-slate-400",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium capitalize ${styles[status] || styles.old}`}>
      {status}
    </span>
  );
}

function VersionRow({ doc, onLoad, onActivate, onDelete, busy }) {
  return (
    <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10 text-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-200 font-medium">v{doc.version}</span>
          <StatusPill status={doc.status} />
          <span className="text-xs text-slate-500">{fmtDate(doc.updated_at)} · {doc.updated_by}</span>
        </div>
        <p className="text-xs text-slate-500 truncate mt-1">{doc.system_prompt}</p>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        <Button variant="outline" size="sm" onClick={() => onLoad(doc)} disabled={busy} data-testid={`load-prompt-${doc.prompt_id}`}>
          <FileEdit className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          onClick={() => onActivate(doc.prompt_id)}
          disabled={busy}
          className="bg-green-600 hover:bg-green-700"
          data-testid={`activate-prompt-${doc.prompt_id}`}
        >
          <CheckCircle className="w-3.5 h-3.5 mr-1" />
          {doc.status === "draft" ? "Activate" : "Restore"}
        </Button>
        {doc.status === "draft" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(doc.prompt_id)}
            disabled={busy}
            className="text-red-400 border-red-500/30 hover:bg-red-500/10"
            data-testid={`delete-prompt-${doc.prompt_id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * One AI tool's prompt management card: active prompt editor,
 * Save as Draft / Save & Activate / Reset, drafts and version history.
 */
export default function PromptToolCard({ tool, onSave, onActivate, onDelete, onReset, busy }) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState(tool.active?.system_prompt || tool.default_prompt);
  const [dirty, setDirty] = useState(false);

  // Sync editor when server state changes (after activate/reset/refresh)
  useEffect(() => {
    if (!dirty) {
      setText(tool.active?.system_prompt || tool.default_prompt);
    }
  }, [tool.active?.system_prompt, tool.default_prompt, dirty]);

  const loadIntoEditor = (doc) => {
    setText(doc.system_prompt);
    setDirty(true);
  };

  const handleChange = (e) => {
    setText(e.target.value);
    setDirty(true);
  };

  const afterAction = () => setDirty(false);

  const isDefault = (tool.active?.system_prompt || "") === tool.default_prompt;

  return (
    <Card className="mb-4 bg-[#0f1020]/80 backdrop-blur-xl border border-white/10 overflow-hidden" data-testid={`prompt-card-${tool.tool_id}`}>
      {/* Header (click to expand) */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.03] transition-colors"
        data-testid={`prompt-card-toggle-${tool.tool_id}`}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-semibold text-white">{tool.label}</h3>
            <span className="text-xs text-slate-500 font-mono">{tool.tool_id}</span>
            {tool.active && <StatusPill status="active" />}
            {!isDefault && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">customized</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {tool.active
              ? `v${tool.active.version} · updated ${fmtDate(tool.active.updated_at)} by ${tool.active.updated_by}`
              : "Using hardcoded default"}
            {tool.drafts.length > 0 && ` · ${tool.drafts.length} draft(s)`}
          </p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Editor */}
          <div>
            <textarea
              value={text}
              onChange={handleChange}
              rows={10}
              spellCheck={false}
              className="w-full p-3 rounded-lg bg-[#090914] border border-white/10 text-slate-200 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              data-testid={`prompt-editor-${tool.tool_id}`}
            />
            <p className="text-xs text-slate-600 mt-1">{text.length} characters{dirty ? " · unsaved changes" : ""}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => onSave(tool.tool_id, text, "active", afterAction)}
              disabled={busy || text.trim().length < 10}
              className="bg-blue-500 hover:bg-blue-600"
              data-testid={`save-activate-${tool.tool_id}`}
            >
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Save & Activate
            </Button>
            <Button
              variant="outline"
              onClick={() => onSave(tool.tool_id, text, "draft", afterAction)}
              disabled={busy || text.trim().length < 10}
              data-testid={`save-draft-${tool.tool_id}`}
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              variant="ghost"
              onClick={() => onReset(tool.tool_id, afterAction)}
              disabled={busy || isDefault}
              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
              data-testid={`reset-default-${tool.tool_id}`}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          </div>

          {/* Drafts */}
          {tool.drafts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-amber-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <FileEdit className="w-3.5 h-3.5" /> Drafts
              </p>
              <div className="space-y-2">
                {tool.drafts.map((d) => (
                  <VersionRow key={d.prompt_id} doc={d} onLoad={loadIntoEditor} onActivate={onActivate} onDelete={onDelete} busy={busy} />
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {tool.history.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" /> Previous Versions
              </p>
              <div className="space-y-2">
                {tool.history.map((h) => (
                  <VersionRow key={h.prompt_id} doc={h} onLoad={loadIntoEditor} onActivate={onActivate} onDelete={onDelete} busy={busy} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
