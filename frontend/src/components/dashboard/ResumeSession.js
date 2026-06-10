import { Link } from "react-router-dom";
import { Brain, MessageSquare, ArrowRight } from "lucide-react";
import { CARD, CARD_HOVER, TOOL_NAMES, TOOL_ICONS } from "./constants";

function LastAIToolCard({ lastAI }) {
  const ToolIcon = lastAI ? (TOOL_ICONS[lastAI.tool_type] || Brain) : Brain;

  if (!lastAI) {
    return (
      <Link to="/ai-tools" className={`${CARD} ${CARD_HOVER} p-5 flex flex-col cursor-pointer group`} data-testid="start-ai-tool-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-xs text-slate-500">AI Tools</p>
            <p className="text-sm font-semibold text-white">Try your first AI tool</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 flex-1 mb-3">Build job descriptions, search strategies, candidate dossiers and more.</p>
        <div className="flex items-center gap-1.5 text-blue-400 text-xs font-medium group-hover:gap-2.5 transition-all duration-200">
          Explore Tools <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/ai-tools"
      className={`${CARD} ${CARD_HOVER} p-5 flex flex-col cursor-pointer group`}
      data-testid="resume-ai-tool-card"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
          <ToolIcon className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Last AI Tool</p>
          <p className="text-sm font-semibold text-white truncate">{TOOL_NAMES[lastAI.tool_type] || lastAI.tool_type}</p>
        </div>
      </div>
      <p className="text-xs text-slate-500 line-clamp-2 flex-1 mb-3">&quot;{lastAI.prompt}&quot;</p>
      <div className="flex items-center gap-1.5 text-blue-400 text-xs font-medium group-hover:gap-2.5 transition-all duration-200">
        Continue <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
      </div>
    </Link>
  );
}

function LastChallengeCard({ lastChallenge }) {
  if (!lastChallenge) {
    return (
      <Link to="/challenges" className={`${CARD} ${CARD_HOVER} p-5 flex flex-col cursor-pointer group`} data-testid="start-challenge-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-cyan-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Community</p>
            <p className="text-sm font-semibold text-white">Post your first challenge</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 flex-1 mb-3">Ask the community a recruiting question and get expert answers. Earn +5 XP.</p>
        <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-medium group-hover:gap-2.5 transition-all duration-200">
          Browse Challenges <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/challenges/${lastChallenge.challenge_id}`}
      className={`${CARD} ${CARD_HOVER} p-5 flex flex-col cursor-pointer group`}
      data-testid="resume-challenge-card"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-4 h-4 text-cyan-400" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Last Challenge — {lastChallenge.interaction_type}</p>
          <p className="text-sm font-semibold text-white truncate">{lastChallenge.title}</p>
        </div>
      </div>
      <p className="text-xs text-slate-500 flex-1 mb-3">
        {lastChallenge.interaction_type === "answered"
          ? "You answered this challenge. See what others said too."
          : "You posted this challenge. Check for new answers."}
      </p>
      <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-medium group-hover:gap-2.5 transition-all duration-200">
        View Challenge <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
      </div>
    </Link>
  );
}

export default function ResumeSession({ lastAI, lastChallenge }) {
  return (
    <div className="mb-8 animate-float-in stagger-2">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-3">
        {(lastAI || lastChallenge) ? "Resume Last Session" : "Get Started"}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LastAIToolCard lastAI={lastAI} />
        <LastChallengeCard lastChallenge={lastChallenge} />
      </div>
    </div>
  );
}
