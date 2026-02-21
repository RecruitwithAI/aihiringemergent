import { GraduationCap, ExternalLink, PlayCircle, BookOpen, Users, BarChart3 } from "lucide-react";

const TRAINING_MODULES = [
  { id: 1, title: "Hybrid Intelligence Fundamentals", desc: "Learn the core principles of combining AI tools with human judgement in executive search.", icon: BookOpen, duration: "45 min", lessons: 6, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: 2, title: "AI-Powered JD Writing Masterclass", desc: "Craft compelling job descriptions that attract top leadership talent using AI assistance.", icon: PlayCircle, duration: "30 min", lessons: 4, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { id: 3, title: "Advanced Boolean Search Strategies", desc: "Master boolean search strings for LinkedIn, databases, and beyond.", icon: BarChart3, duration: "60 min", lessons: 8, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { id: 4, title: "Candidate Dossier Best Practices", desc: "Build client-ready candidate presentations that close deals faster.", icon: Users, duration: "40 min", lessons: 5, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: 5, title: "Client Research & Business Development", desc: "How to research potential clients and craft winning pitch strategies.", icon: BarChart3, duration: "35 min", lessons: 5, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: 6, title: "Building Your Recruiting Brand", desc: "Establish thought leadership and attract both candidates and clients.", icon: GraduationCap, duration: "50 min", lessons: 7, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
];

const CARD = "bg-white/[0.04] border border-white/[0.07] rounded-2xl";

export default function Training() {
  const handleGoToTraining = (moduleId) => {
    // Placeholder TagMango URL
    window.open("https://tagmango.com/bestplai", "_blank");
  };

  return (
    <div className="min-h-screen bg-[#090914] relative overflow-hidden" data-testid="training-page">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-500/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-violet-400/60 uppercase tracking-widest mb-2">
            <GraduationCap className="w-3 h-3" strokeWidth={1.5} /> Learning
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white font-[Lexend]">Training</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Access curated learning modules to sharpen your recruiting skills</p>
        </div>

        {/* Info banner */}
        <div className={`${CARD} p-5 mb-8 flex items-center gap-4`}>
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-violet-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Training recordings are hosted on TagMango</p>
            <p className="text-xs text-slate-500 mt-0.5">Click any module below to access the full training on our learning platform.</p>
          </div>
        </div>

        {/* Training grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {TRAINING_MODULES.map((m, i) => (
            <div
              key={m.id}
              className={`${CARD} p-5 sm:p-6 hover:border-violet-500/20 hover:bg-white/[0.06] transition-all duration-300 group`}
              style={{ animationDelay: `${i * 0.05}s` }}
              data-testid={`training-module-${m.id}`}
            >
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${m.bg} border ${m.border} flex items-center justify-center mb-3 sm:mb-4`}>
                <m.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${m.color}`} strokeWidth={1.5} />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-white font-[Lexend] mb-1 group-hover:text-violet-400 transition-colors duration-200">{m.title}</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-3 sm:mb-4">{m.desc}</p>
              <div className="flex items-center gap-3 text-xs text-slate-600 mb-3 sm:mb-4">
                <span>{m.duration}</span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span>{m.lessons} lessons</span>
              </div>
              <button
                onClick={() => handleGoToTraining(m.id)}
                className="w-full h-10 rounded-full bg-white/[0.05] border border-white/[0.10] text-slate-300 hover:bg-white/[0.10] hover:border-white/[0.15] text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
                data-testid={`training-go-btn-${m.id}`}
              >
                Go to Training <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
