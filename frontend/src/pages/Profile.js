import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import { UserAvatar } from "@/components/Navbar";
import axios from "axios";
import { MessageSquare, Brain, Award, TrendingUp, User } from "lucide-react";

const CARD = "bg-white/[0.04] border border-white/[0.07] rounded-2xl";

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/profile/stats`, { withCredentials: true });
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getBadgeStyle = (badge) => {
    switch (badge) {
      case "Diamond": return "bg-violet-500/20 text-violet-400 border border-violet-500/30";
      case "Gold": return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
      case "Silver": return "bg-slate-400/20 text-slate-300 border border-slate-400/30";
      default: return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    }
  };

  const getNextTier = (pts) => {
    if (pts < 100) return { name: "Silver", target: 100, progress: (pts / 100) * 100 };
    if (pts < 200) return { name: "Gold", target: 200, progress: ((pts - 100) / 100) * 100 };
    if (pts < 500) return { name: "Diamond", target: 500, progress: ((pts - 200) / 300) * 100 };
    return { name: "Max", target: 500, progress: 100 };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090914] flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading profile...</div>
      </div>
    );
  }

  const points = stats?.points || 0;
  const badge = stats?.badge || "Bronze";
  const next = getNextTier(points);

  const statCards = [
    { icon: MessageSquare, label: "Challenges Posted", value: stats?.challenges_posted || 0, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    { icon: Award, label: "Answers Given", value: stats?.answers_given || 0, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    { icon: Brain, label: "AI Tools Used", value: stats?.ai_tools_used || 0, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  ];

  return (
    <div className="min-h-screen bg-[#090914] relative overflow-hidden" data-testid="profile-page">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-blue-400/60 uppercase tracking-widest mb-2">
            <User className="w-3 h-3" strokeWidth={1.5} /> Profile
          </div>
        </div>

        {/* Header */}
        <div className={`${CARD} p-8`} data-testid="profile-header">
          <div className="flex items-center gap-5">
            <UserAvatar user={user} size="lg" />
            <div>
              <h1 className="text-2xl font-semibold text-white font-[Lexend]">{user?.name}</h1>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getBadgeStyle(badge)}`} data-testid="profile-badge">{badge}</span>
                <span className="text-sm font-semibold text-blue-400" data-testid="profile-points">{points} XP</span>
              </div>
            </div>
          </div>

          {/* XP Progress */}
          {next.name !== "Max" && (
            <div className="mt-6">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>{points} XP</span>
                <span>{next.target} XP to {next.name}</span>
              </div>
              <div className="w-full bg-white/[0.06] rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(next.progress, 100)}%` }}
                  data-testid="profile-xp-bar"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
          {statCards.map((s, i) => (
            <div
              key={s.label}
              className={`${CARD} p-4 sm:p-6 text-center hover:border-white/[0.12] transition-all duration-300`}
              style={{ animationDelay: `${i * 0.05}s` }}
              data-testid={`profile-stat-${i}`}
            >
              <div className={`w-10 h-10 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mx-auto mb-2 sm:mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} strokeWidth={1.5} />
              </div>
              <p className="text-xl sm:text-2xl font-semibold text-white font-[Lexend]">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Points breakdown */}
        <div className={`${CARD} p-6 mt-4`} data-testid="profile-points-breakdown">
          <h3 className="font-semibold text-white font-[Lexend] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-500" strokeWidth={1.5} /> Points Breakdown
          </h3>
          <div className="space-y-3">
            <Row label="From Challenges" value={`${(stats?.challenges_posted || 0) * 5} XP`} sub={`${stats?.challenges_posted || 0} x 5 XP`} />
            <Row label="From Answers" value={`${(stats?.answers_given || 0) * 10} XP`} sub={`${stats?.answers_given || 0} x 10 XP`} />
            <Row label="From AI Tools" value={`${(stats?.ai_tools_used || 0) * 2} XP`} sub={`${stats?.ai_tools_used || 0} x 2 XP`} />
            <div className="border-t border-white/[0.08] pt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Total (incl. upvotes)</span>
              <span className="text-sm font-semibold text-blue-400">{points} XP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, sub }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div>
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-600 text-xs ml-2">({sub})</span>
      </div>
      <span className="font-medium text-slate-200">{value}</span>
    </div>
  );
}
