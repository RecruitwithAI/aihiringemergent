import { Brain } from "lucide-react";

const CARD = "bg-white/[0.04] border border-white/[0.07] rounded-2xl";

export default function ToolSelector({ tools, onSelectTool }) {
  return (
    <div className="min-h-screen bg-[#090914] px-4 sm:px-6 lg:px-8 py-8 ai-tools-selector">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center tool-icon-wrapper">
              <Brain className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white font-[Lexend] mb-2 page-title">
            AI-Powered Tools
          </h1>
          <p className="text-slate-400 text-base sm:text-lg page-subtitle">
            Professional recruiting content in seconds with GPT-5.2
          </p>
        </div>

        {/* Tool Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => onSelectTool(tool)}
                className={`${CARD} p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:border-${tool.color.replace('text-', '')}/30 hover:bg-white/[0.06] group tool-card`}
                data-testid={`tool-${tool.id}`}
              >
                <div className={`w-12 h-12 rounded-xl ${tool.bg} border ${tool.border} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 tool-card-icon`}>
                  <Icon className={`w-6 h-6 ${tool.color}`} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 font-[Lexend] tool-card-title">
                  {tool.label}
                </h3>
                <p className="text-sm text-slate-400 tool-card-description">
                  {tool.id === "jd-builder" && "Generate detailed job descriptions with key requirements"}
                  {tool.id === "search-strategy" && "Create targeted search plans and Boolean strings"}
                  {tool.id === "candidate-research" && "Deep dive into candidate backgrounds and fit"}
                  {tool.id === "dossier" && "Compile comprehensive candidate profiles"}
                  {tool.id === "client-research" && "Research companies and decision makers"}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
