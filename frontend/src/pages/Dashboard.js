import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { UserAvatar } from "@/components/Navbar";
import axios from "axios";
import { Brain, MessageSquare, Trophy, Users, ArrowRight, Zap, Star, TrendingUp, Sparkles } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/dashboard/stats`, { withCredentials: true });
        setStats(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
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
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-stone-400">Loading dashboard...</div></div>;
  }

  const points = stats?.user_points || 0;
  const badge = stats?.user_badge || "Bronze";
  const next = getNextTier(points);

  const quickActions = [
    { icon: Brain, label: "AI Tools", desc: "Generate JDs, strategies & more", href: "/ai-tools", color: "bg-violet-50 text-violet-600 border-violet-100", anim: "icon-hover-wiggle", glow: "hover:shadow-violet-100" },
    { icon: MessageSquare, label: "Challenges", desc: "Ask or answer community questions", href: "/challenges", color: "bg-emerald-50 text-emerald-600 border-emerald-100", anim: "icon-hover-bounce", glow: "hover:shadow-emerald-100" },
    { icon: Trophy, label: "Leaderboard", desc: "See community rankings", href: "/leaderboard", color: "bg-amber-50 text-amber-600 border-amber-100", anim: "icon-hover-spin", glow: "hover:shadow-amber-100" },
    { icon: Star, label: "Training", desc: "Access learning resources", href: "/training", color: "bg-rose-50 text-rose-600 border-rose-100", anim: "icon-hover-scale", glow: "hover:shadow-rose-100" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9]" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8 animate-float-in">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900 font-[Lexend]">
            Welcome back, <span className="gradient-text">{user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-base text-stone-500 mt-1">Here's what's happening in the Bestpl.ai community</p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(140px,auto)]">
          {/* XP Card — featured */}
          <div className="md:col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm p-6 card-glow animate-float-in" data-testid="xp-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} /> Your Progress
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-4xl font-semibold text-stone-900 font-[Lexend] animate-pop-in">{points}</span>
                  <span className="text-sm text-stone-500">XP</span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getBadgeClass(badge)}`} data-testid="user-badge">{badge}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-400">Rank</p>
                <p className="text-3xl font-semibold gradient-text font-[Lexend] animate-pop-in" style={{ animationDelay: "0.2s" }} data-testid="user-rank">#{stats?.user_rank || "-"}</p>
              </div>
            </div>
            {next.name !== "Max" && (
              <div>
                <div className="flex justify-between text-xs text-stone-400 mb-1.5">
                  <span>{points} XP</span>
                  <span>{next.target} XP to <span className="font-semibold text-stone-600">{next.name}</span></span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                  <div className="xp-bar h-3" style={{ width: `${Math.min(next.progress, 100)}%` }} data-testid="xp-progress-bar" />
                </div>
              </div>
            )}
          </div>

          {/* Stat cards */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 card-hover icon-hover-scale animate-float-in stagger-1" data-testid="members-stat">
            <Users className="w-5 h-5 text-primary mb-3 icon-target" strokeWidth={1.5} />
            <p className="text-2xl font-semibold text-stone-900 font-[Lexend] animate-pop-in" style={{ animationDelay: "0.1s" }}>{stats?.total_members || 0}</p>
            <p className="text-sm text-stone-500">Community Members</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 card-hover icon-hover-bounce animate-float-in stagger-2" data-testid="challenges-stat">
            <MessageSquare className="w-5 h-5 text-emerald-500 mb-3 icon-target" strokeWidth={1.5} />
            <p className="text-2xl font-semibold text-stone-900 font-[Lexend] animate-pop-in" style={{ animationDelay: "0.2s" }}>{stats?.total_challenges || 0}</p>
            <p className="text-sm text-stone-500">Active Challenges</p>
          </div>

          {/* Quick Actions */}
          {quickActions.map((a, i) => (
            <Link key={a.label} to={a.href} className={`${a.anim} bg-white rounded-xl border border-stone-200 shadow-sm p-6 card-glow group animate-float-in stagger-${i + 1}`} data-testid={`quick-action-${a.label.toLowerCase().replace(" ", "-")}`}>
              <div className={`w-10 h-10 rounded-lg ${a.color} border flex items-center justify-center mb-3 transition-all duration-300 group-hover:shadow-lg ${a.glow}`}>
                <a.icon className="w-5 h-5 icon-target" strokeWidth={1.5} />
              </div>
              <p className="font-semibold text-stone-900 text-sm">{a.label}</p>
              <p className="text-xs text-stone-400 mt-0.5">{a.desc}</p>
              <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-primary group-hover:translate-x-1 mt-2 transition-all duration-300" strokeWidth={1.5} />
            </Link>
          ))}

          {/* Recent Challenges */}
          <div className="md:col-span-2 lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm p-6 animate-float-in stagger-3" data-testid="recent-challenges">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-900 font-[Lexend]">Recent Challenges</h3>
              <Link to="/challenges" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">View all <ArrowRight className="w-3 h-3" strokeWidth={1.5} /></Link>
            </div>
            {stats?.recent_challenges?.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_challenges.slice(0, 4).map((c) => (
                  <Link key={c.challenge_id} to={`/challenges/${c.challenge_id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-all duration-200 group">
                    <UserAvatar user={c.author} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-900 truncate group-hover:text-primary transition-colors duration-200">{c.title}</p>
                      <p className="text-xs text-stone-400">by {c.author?.name || "Unknown"}</p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-stone-300 group-hover:text-primary transition-colors flex-shrink-0" strokeWidth={1.5} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400 text-center py-6">No challenges yet. Be the first to post!</p>
            )}
          </div>

          {/* Points Guide — with gradient border */}
          <div className="md:col-span-1 lg:col-span-2 bg-white rounded-xl border border-primary/15 shadow-sm p-6 animate-float-in stagger-4 card-glow" data-testid="points-guide">
            <h3 className="font-semibold text-stone-900 font-[Lexend] mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" strokeWidth={1.5} /> How to Earn XP
            </h3>
            <div className="space-y-3">
              {[
                { action: "Post a Challenge", pts: "+5 XP", icon: "?" },
                { action: "Answer a Challenge", pts: "+10 XP", icon: "A" },
                { action: "Receive an Upvote", pts: "+3 XP", icon: "^" },
                { action: "Use an AI Tool", pts: "+2 XP", icon: "*" },
              ].map((item) => (
                <div key={item.action} className="flex items-center justify-between text-sm group">
                  <span className="text-stone-600 group-hover:text-stone-900 transition-colors">{item.action}</span>
                  <span className="font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded-full text-xs">{item.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
