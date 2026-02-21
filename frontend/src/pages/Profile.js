import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import { UserAvatar } from "@/components/Navbar";
import axios from "axios";
import { MessageSquare, Brain, Award, TrendingUp } from "lucide-react";

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

  const getBadgeClass = (badge) => {
    const m = { Bronze: "badge-bronze", Silver: "badge-silver", Gold: "badge-gold", Diamond: "badge-diamond" };
    return m[badge] || "badge-bronze";
  };

  const getNextTier = (pts) => {
    if (pts < 100) return { name: "Silver", target: 100, progress: (pts / 100) * 100 };
    if (pts < 200) return { name: "Gold", target: 200, progress: ((pts - 100) / 100) * 100 };
    if (pts < 500) return { name: "Diamond", target: 500, progress: ((pts - 200) / 300) * 100 };
    return { name: "Max", target: 500, progress: 100 };
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-stone-400">Loading profile...</div></div>;
  }

  const points = stats?.points || 0;
  const badge = stats?.badge || "Bronze";
  const next = getNextTier(points);

  const statCards = [
    { icon: MessageSquare, label: "Challenges Posted", value: stats?.challenges_posted || 0, color: "text-emerald-500" },
    { icon: Award, label: "Answers Given", value: stats?.answers_given || 0, color: "text-violet-500" },
    { icon: Brain, label: "AI Tools Used", value: stats?.ai_tools_used || 0, color: "text-amber-500" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9]" data-testid="profile-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-8 animate-float-in" data-testid="profile-header">
          <div className="flex items-center gap-5">
            <UserAvatar user={user} size="lg" />
            <div>
              <h1 className="text-2xl font-semibold text-stone-900 font-[Lexend]">{user?.name}</h1>
              <p className="text-sm text-stone-500">{user?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getBadgeClass(badge)}`} data-testid="profile-badge">{badge}</span>
                <span className="text-sm font-semibold text-primary" data-testid="profile-points">{points} XP</span>
              </div>
            </div>
          </div>

          {/* XP Progress */}
          {next.name !== "Max" && (
            <div className="mt-6">
              <div className="flex justify-between text-xs text-stone-400 mb-1.5">
                <span>{points} XP</span>
                <span>{next.target} XP to {next.name}</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2.5">
                <div className="xp-bar h-2.5" style={{ width: `${Math.min(next.progress, 100)}%` }} data-testid="profile-xp-bar" />
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {statCards.map((s, i) => (
            <div key={s.label} className={`bg-white rounded-xl border border-stone-200 shadow-sm p-6 text-center card-hover animate-float-in stagger-${i + 1}`} data-testid={`profile-stat-${i}`}>
              <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} strokeWidth={1.5} />
              <p className="text-2xl font-semibold text-stone-900 font-[Lexend]">{s.value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Points breakdown */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 mt-4 animate-float-in stagger-4" data-testid="profile-points-breakdown">
          <h3 className="font-semibold text-stone-900 font-[Lexend] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-stone-400" strokeWidth={1.5} /> Points Breakdown
          </h3>
          <div className="space-y-3">
            <Row label="From Challenges" value={`${(stats?.challenges_posted || 0) * 5} XP`} sub={`${stats?.challenges_posted || 0} x 5 XP`} />
            <Row label="From Answers" value={`${(stats?.answers_given || 0) * 10} XP`} sub={`${stats?.answers_given || 0} x 10 XP`} />
            <Row label="From AI Tools" value={`${(stats?.ai_tools_used || 0) * 2} XP`} sub={`${stats?.ai_tools_used || 0} x 2 XP`} />
            <div className="border-t border-stone-100 pt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-900">Total (incl. upvotes)</span>
              <span className="text-sm font-semibold text-primary">{points} XP</span>
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
        <span className="text-stone-700">{label}</span>
        <span className="text-stone-400 text-xs ml-2">({sub})</span>
      </div>
      <span className="font-medium text-stone-900">{value}</span>
    </div>
  );
}
