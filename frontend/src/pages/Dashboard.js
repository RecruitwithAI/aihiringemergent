import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Brain, MessageSquare, Trophy, Users, ArrowRight, Zap, TrendingUp, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/dashboard/stats`, { withCredentials: true });
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getBadgeColor = (badge) => {
    const colors = { Bronze: "badge-bronze", Silver: "badge-silver", Gold: "badge-gold", Diamond: "badge-diamond" };
    return colors[badge] || "badge-bronze";
  };

  const getNextTier = (points) => {
    if (points < 100) return { name: "Silver", needed: 100, progress: (points / 100) * 100 };
    if (points < 200) return { name: "Gold", needed: 200, progress: ((points - 100) / 100) * 100 };
    if (points < 500) return { name: "Diamond", needed: 500, progress: ((points - 200) / 300) * 100 };
    return { name: "Max", needed: 500, progress: 100 };
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-stone-400">Loading dashboard...</div></div>;
  }

  const points = stats?.user_points || 0;
  const badge = stats?.user_badge || "Bronze";
  const nextTier = getNextTier(points);

  const quickActions = [
    { icon: Brain, label: "AI Tools", desc: "Generate JDs, strategies & more", href: "/ai-tools", color: "bg-violet-50 text-violet-600 border-violet-100" },
    { icon: MessageSquare, label: "Challenges", desc: "Ask or answer community questions", href: "/challenges", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { icon: Trophy, label: "Leaderboard", desc: "See community rankings", href: "/leaderboard", color: "bg-amber-50 text-amber-600 border-amber-100" },
    { icon: Star, label: "Training", desc: "Access learning resources", href: "/training", color: "bg-rose-50 text-rose-600 border-rose-100" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9]" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8 animate-float-in">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 font-[Outfit]">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-base text-stone-500 mt-1">Here's what's happening in the Bestpl.ai community</p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(140px,auto)]">
          {/* XP Card - Spans 2 cols */}
          <div className="md:col-span-2 bg-white rounded-xl border border-stone-200 p-6 card-hover animate-float-in" data-testid="xp-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-stone-500 uppercase tracking-wide">Your Progress</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-3xl font-bold text-stone-900 font-[Outfit]">{points}</span>
                  <span className="text-sm text-stone-500">XP</span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getBadgeColor(badge)}`} data-testid="user-badge">{badge}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-400">Rank</p>
                <p className="text-2xl font-bold text-primary font-[Outfit]" data-testid="user-rank">#{stats?.user_rank || "-"}</p>
              </div>
            </div>
            {nextTier.name !== "Max" && (
              <div>
                <div className="flex justify-between text-xs text-stone-400 mb-1.5">
                  <span>{points} XP</span>
                  <span>{nextTier.needed} XP to {nextTier.name}</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2.5">
                  <div className="xp-bar h-2.5" style={{ width: `${Math.min(nextTier.progress, 100)}%` }} data-testid="xp-progress-bar" />
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 card-hover animate-float-in stagger-1" data-testid="members-stat">
            <Users className="w-5 h-5 text-primary mb-3" />
            <p className="text-2xl font-bold text-stone-900 font-[Outfit]">{stats?.total_members || 0}</p>
            <p className="text-sm text-stone-500">Community Members</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-6 card-hover animate-float-in stagger-2" data-testid="challenges-stat">
            <MessageSquare className="w-5 h-5 text-emerald-500 mb-3" />
            <p className="text-2xl font-bold text-stone-900 font-[Outfit]">{stats?.total_challenges || 0}</p>
            <p className="text-sm text-stone-500">Active Challenges</p>
          </div>

          {/* Quick Actions */}
          {quickActions.map((action, i) => (
            <Link
              key={action.label}
              to={action.href}
              className={`bg-white rounded-xl border border-stone-200 p-6 card-hover group animate-float-in stagger-${i + 1}`}
              data-testid={`quick-action-${action.label.toLowerCase().replace(" ", "-")}`}
            >
              <div className={`w-10 h-10 rounded-lg ${action.color} border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5" />
              </div>
              <p className="font-semibold text-stone-900 text-sm">{action.label}</p>
              <p className="text-xs text-stone-400 mt-0.5">{action.desc}</p>
              <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-primary mt-2 transition-colors" />
            </Link>
          ))}

          {/* Recent Challenges */}
          <div className="md:col-span-2 lg:col-span-2 bg-white rounded-xl border border-stone-200 p-6 animate-float-in stagger-3" data-testid="recent-challenges">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-900 font-[Outfit]">Recent Challenges</h3>
              <Link to="/challenges" className="text-xs text-primary hover:underline font-medium">View all</Link>
            </div>
            {stats?.recent_challenges?.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_challenges.slice(0, 4).map((c) => (
                  <Link key={c.challenge_id} to={`/challenges/${c.challenge_id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-900 truncate group-hover:text-primary transition-colors">{c.title}</p>
                      <p className="text-xs text-stone-400">by {c.author?.name || "Unknown"}</p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-stone-300 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400 text-center py-6">No challenges yet. Be the first to post!</p>
            )}
          </div>

          {/* Points Guide */}
          <div className="md:col-span-1 lg:col-span-2 bg-gradient-to-br from-primary/5 to-fuchsia-50 rounded-xl border border-primary/10 p-6 animate-float-in stagger-4" data-testid="points-guide">
            <h3 className="font-semibold text-stone-900 font-[Outfit] mb-3">How to Earn XP</h3>
            <div className="space-y-2.5">
              {[
                { action: "Post a Challenge", pts: "+5 XP", icon: "?" },
                { action: "Answer a Challenge", pts: "+10 XP", icon: "A" },
                { action: "Receive an Upvote", pts: "+3 XP", icon: "^" },
                { action: "Use an AI Tool", pts: "+2 XP", icon: "*" },
              ].map((item) => (
                <div key={item.action} className="flex items-center justify-between text-sm">
                  <span className="text-stone-600">{item.action}</span>
                  <span className="font-semibold text-primary">{item.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
