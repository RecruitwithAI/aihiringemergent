import { History, Clock, Loader2, X } from "lucide-react";

const CARD = "bg-white/[0.04] border border-white/[0.07] rounded-2xl";

export default function HistoryPanel({
  isOpen,
  onClose,
  history,
  loading,
  onLoadItem,
  toolLabel,
}) {
  if (!isOpen) return null;

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`${CARD} w-full max-w-3xl max-h-[80vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <History className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white font-[Lexend]">
                {toolLabel} History
              </h3>
              <p className="text-sm text-slate-400">
                {history.length} {history.length === 1 ? 'generation' : 'generations'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" strokeWidth={1.5} />
              <p className="text-sm text-slate-400">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-slate-600 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-slate-400">No history yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Your generations will appear here
              </p>
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.history_id}
                onClick={() => onLoadItem(item)}
                className="w-full text-left p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-blue-500/30 hover:bg-white/[0.04] transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm text-white font-medium line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {item.prompt}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                    <Clock className="w-3 h-3" strokeWidth={1.5} />
                    {timeAgo(item.created_at)}
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {item.response?.substring(0, 150)}...
                </p>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-white/[0.07] bg-white/[0.02]">
            <p className="text-xs text-slate-500 text-center">
              Click any item to load it into the editor
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
