import { Zap, Trophy, Users } from "lucide-react";
import { CARD } from "./constants";

export default function StatsRow({ points, next, userRank, totalMembers }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 animate-float-in stagger-1">
      {/* XP with progress */}
      <div className={`${CARD} p-4 md:col-span-2`} data-testid="xp-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
            <p className="text-xs text-slate-500 uppercase tracking-wide">Your XP</p>
          </div>
          <span className="text-xs text-slate-500">→ {next.name !== "Max" ? `${next.target} XP for ${next.name}` : "Max Level"}</span>
        </div>
        <p className="text-3xl font-semibold text-white font-[Lexend] mb-3" data-testid="user-points">{points}</p>
        {next.name !== "Max" && (
          <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${Math.min(next.progress, 100)}%` }}
              data-testid="xp-progress-bar"
            />
          </div>
        )}
      </div>

      <div className={`${CARD} p-4`} data-testid="rank-card">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
          <p className="text-xs text-slate-500 uppercase tracking-wide">Rank</p>
        </div>
        <p className="text-3xl font-semibold text-white font-[Lexend]" data-testid="user-rank">#{userRank || "—"}</p>
      </div>

      <div className={`${CARD} p-4`} data-testid="members-stat">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-cyan-400" strokeWidth={1.5} />
          <p className="text-xs text-slate-500 uppercase tracking-wide">Members</p>
        </div>
        <p className="text-3xl font-semibold text-white font-[Lexend]">{totalMembers || 0}</p>
      </div>
    </div>
  );
}
