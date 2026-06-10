import { Sparkles, Award } from "lucide-react";
import { BADGE_STYLES, greeting } from "./constants";

export default function DashboardHeader({ firstName, badge, resumePrompt }) {
  return (
    <div className="mb-10 animate-float-in">
      <div className="flex items-center gap-2 text-xs font-medium text-blue-400/60 uppercase tracking-widest mb-3">
        <Sparkles className="w-3 h-3" strokeWidth={1.5} />
        {greeting()}, {firstName}
      </div>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold font-[Lexend] text-white leading-tight" data-testid="welcome-heading">
            Welcome back,{" "}
            <span className="text-blue-400">{firstName}</span>
          </h1>
          <p className="text-slate-400 mt-2 max-w-xl text-xs sm:text-sm md:text-base">{resumePrompt}</p>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${BADGE_STYLES[badge] || BADGE_STYLES.Bronze}`} data-testid="user-badge-pill">
          <Award className="w-3.5 h-3.5" strokeWidth={1.5} /> {badge}
        </div>
      </div>
    </div>
  );
}
