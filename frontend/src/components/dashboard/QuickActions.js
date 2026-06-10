import { Link } from "react-router-dom";
import { Brain, MessageSquare, Trophy, GraduationCap, ArrowRight } from "lucide-react";
import { CARD } from "./constants";

const QUICK_ACTIONS = [
  { icon: Brain, label: "AI Tools", desc: "Build JDs, dossiers & strategies", href: "/ai-tools", iconColor: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20 hover:border-blue-500/50" },
  { icon: MessageSquare, label: "Challenges", desc: "Ask & answer community questions", href: "/challenges", iconColor: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20 hover:border-cyan-500/50" },
  { icon: Trophy, label: "Leaderboard", desc: "See community rankings", href: "/leaderboard", iconColor: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20 hover:border-amber-500/50" },
  { icon: GraduationCap, label: "Training", desc: "Access learning resources", href: "/training", iconColor: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20 hover:border-violet-500/50" },
];

export default function QuickActions() {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-3">What would you like to do today?</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {QUICK_ACTIONS.map((action, i) => (
          <Link
            key={action.label}
            to={action.href}
            className={`${CARD} border ${action.border} p-4 sm:p-5 flex flex-col group transition-all duration-300 stagger-${i + 1}`}
            data-testid={`quick-action-${action.label.toLowerCase().replace(" ", "-")}`}
          >
            <div className={`w-9 h-9 rounded-lg ${action.bg} flex items-center justify-center mb-3`}>
              <action.icon className={`w-4 h-4 ${action.iconColor}`} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-white mb-0.5">{action.label}</p>
            <p className="text-xs text-slate-500 flex-1">{action.desc}</p>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 mt-3 transition-all duration-200" strokeWidth={1.5} />
          </Link>
        ))}
      </div>
    </div>
  );
}
