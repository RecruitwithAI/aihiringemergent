import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp } from "lucide-react";
import { UserAvatar } from "@/components/Navbar";
import { CARD, CARD_HOVER } from "./constants";

export default function RecentChallenges({ challenges }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Recent Challenges</p>
        <Link to="/challenges" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors" data-testid="view-all-challenges-link">
          View all <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
        </Link>
      </div>
      <div className="space-y-2" data-testid="recent-challenges-list">
        {(challenges || []).length > 0 ? (
          challenges.slice(0, 4).map((c) => (
            <Link
              key={c.challenge_id}
              to={`/challenges/${c.challenge_id}`}
              className={`${CARD} ${CARD_HOVER} px-4 py-3 flex items-center gap-3 group`}
              data-testid={`challenge-item-${c.challenge_id}`}
            >
              <UserAvatar user={c.author} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">{c.title}</p>
                <p className="text-xs text-slate-600">by {c.author?.name || "Unknown"}</p>
              </div>
              <TrendingUp className="w-4 h-4 text-slate-700 group-hover:text-blue-400 transition-colors flex-shrink-0" strokeWidth={1.5} />
            </Link>
          ))
        ) : (
          <div className={`${CARD} px-4 py-6 text-center`}>
            <p className="text-sm text-slate-600">No challenges yet. Be the first to post!</p>
          </div>
        )}
      </div>
    </div>
  );
}
