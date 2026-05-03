export default function OutputTypeSelector({ outputType, onChangeType }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4">
      <label className="text-sm font-medium text-slate-300 mb-3 block">Output Type</label>
      <div className="flex gap-3">
        <button
          onClick={() => onChangeType("strategy")}
          data-testid="output-type-strategy"
          className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
            outputType === "strategy"
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
              : "bg-white/[0.02] border-white/[0.08] text-slate-400 hover:bg-white/[0.04] hover:text-white"
          }`}
        >
          <div className="text-left">
            <div className="font-medium mb-1">Search Strategy</div>
            <div className="text-xs opacity-75">Concise, actionable search plan</div>
          </div>
        </button>
        <button
          onClick={() => onChangeType("target-list")}
          data-testid="output-type-target-list"
          className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
            outputType === "target-list"
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
              : "bg-white/[0.02] border-white/[0.08] text-slate-400 hover:bg-white/[0.04] hover:text-white"
          }`}
        >
          <div className="text-left">
            <div className="font-medium mb-1">Target Company List</div>
            <div className="text-xs opacity-75">Tabular list with 15-20 companies</div>
          </div>
        </button>
      </div>
    </div>
  );
}
