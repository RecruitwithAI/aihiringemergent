import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { UserAvatar } from "@/components/Navbar";
import axios from "axios";
import {
  Brain, MessageSquare, Trophy, Users, ArrowRight, Zap,
  Sparkles, Award, GraduationCap, MessageCircleMore, FileText,
  Search, UserSearch, BookUser, Building2, TrendingUp
} from "lucide-react";

const TOOL_NAMES = {
  "jd-builder": "Job Description Builder",
  "search-strategy": "Search Strategy Maker",
  "candidate-research": "Candidate Researcher",
  "dossier": "Candidate Dossier",
  "client-research": "Client Researcher",
};

const TOOL_ICONS = {
  "jd-builder": FileText,
  "search-strategy": Search,
  "candidate-research": UserSearch,
  "dossier": BookUser,
  "client-research": Building2,
};

const BADGE_STYLES = {
  Diamond: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  Gold: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  Silver: "text-slate-300 border-slate-400/30 bg-slate-400/10",
  Bronze: "text-orange-400 border-orange-400/30 bg-orange-400/10",
};

const NEXT_TIER = (pts) => {
  if (pts < 100) return { name: "Silver", target: 100, progress: (pts / 100) * 100 };
  if (pts < 200) return { name: "Gold", target: 200, progress: ((pts - 100) / 100) * 100 };
  if (pts < 500) return { name: "Diamond", target: 500, progress: ((pts - 200) / 300) * 100 };
  return { name: "Max", target: 500, progress: 100 };
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const CARD = "bg-white/[0.04] border border-white/[0.07] rounded-2xl";
const CARD_HOVER = "hover:border-blue-500/30 hover:bg-white/[0.06] transition-all duration-300";

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090914] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const points = stats?.user_points || 0;
  const badge = stats?.user_badge || "Bronze";
  const userRank = stats?.user_rank || 0;
  const firstName = user?.name?.split(" ")[0] || "there";
  const next = NEXT_TIER(points);
  const lastAI = stats?.last_ai_tool;
  const lastChallenge = stats?.last_challenge;
  const ToolIcon = lastAI ? (TOOL_ICONS[lastAI.tool_type] || Brain) : Brain;

  const getResumePrompt = () => {
    if (lastAI && lastChallenge) {
      return `Pick up your ${TOOL_NAMES[lastAI.tool_type] || "AI tool"}, or check in on your active challenge.`;
    }
    if (lastAI) return `Would you like to continue with your ${TOOL_NAMES[lastAI.tool_type] || "AI tool"}?`;
    if (lastChallenge) return `Your challenge "${lastChallenge.title?.substring(0, 45)}${lastChallenge.title?.length > 45 ? "..." : ""}" is live in the community.`;
    return "Start by exploring AI tools or posting your first community challenge.";
  };

  const quickActions = [
    { icon: Brain, label: "AI Tools", desc: "Build JDs, dossiers & strategies", href: "/ai-tools", iconColor: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20 hover:border-blue-500/50" },
    { icon: MessageSquare, label: "Challenges", desc: "Ask & answer community questions", href: "/challenges", iconColor: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20 hover:border-cyan-500/50" },
    { icon: Trophy, label: "Leaderboard", desc: "See community rankings", href: "/leaderboard", iconColor: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20 hover:border-amber-500/50" },
    { icon: GraduationCap, label: "Training", desc: "Access learning resources", href: "/training", iconColor: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20 hover:border-violet-500/50" },
  ];

  return (
    <div className="min-h-screen bg-[#090914]" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* ── HEADER ── */}
        <div className="mb-10 animate-float-in">
          <div className="flex items-center gap-2 text-xs font-medium text-blue-400/60 uppercase tracking-widest mb-3">
            <Sparkles className="w-3 h-3" strokeWidth={1.5} />
            {greeting()}, {firstName}
          </div>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold font-[Lexend] text-white leading-tight" data-testid="welcome-heading">
                Welcome back,{" "}
                <span className="text-blue-400">{firstName}</span>
              </h1>
              <p className="text-slate-400 mt-2 max-w-xl text-sm md:text-base">{getResumePrompt()}</p>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${BADGE_STYLES[badge] || BADGE_STYLES.Bronze}`} data-testid="user-badge-pill">
              <Award className="w-3.5 h-3.5" strokeWidth={1.5} /> {badge}
            </div>
          </div>
        </div>

        {/* ── STATS ROW ── */}
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
            <p className="text-3xl font-semibold text-white font-[Lexend]">{stats?.total_members || 0}</p>
          </div>
        </div>

        {/* ── RESUME LAST SESSION ── */}
        <div className="mb-8 animate-float-in stagger-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-3">
            {(lastAI || lastChallenge) ? "Resume Last Session" : "Get Started"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI Tool Card */}
            {lastAI ? (
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
                <p className="text-xs text-slate-500 line-clamp-2 flex-1 mb-3">"{lastAI.prompt}"</p>
                <div className="flex items-center gap-1.5 text-blue-400 text-xs font-medium group-hover:gap-2.5 transition-all duration-200">
                  Continue <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                </div>
              </Link>
            ) : (
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
            )}

            {/* Challenge Card */}
            {lastChallenge ? (
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
            ) : (
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
            )}
          </div>
        </div>

        {/* ── MAIN GRID: Quick Actions (left) + Activity Feed (right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-float-in stagger-3">

          {/* LEFT: Quick Actions + Recent Challenges */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-3">What would you like to do today?</p>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, i) => (
                  <Link
                    key={action.label}
                    to={action.href}
                    className={`${CARD} border ${action.border} p-5 flex flex-col group transition-all duration-300 stagger-${i + 1}`}
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

            {/* Recent Community Challenges */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Recent Challenges</p>
                <Link to="/challenges" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors" data-testid="view-all-challenges-link">
                  View all <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                </Link>
              </div>
              <div className="space-y-2" data-testid="recent-challenges-list">
                {(stats?.recent_challenges || []).length > 0 ? (
                  stats.recent_challenges.slice(0, 4).map((c) => (
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
          </div>

          {/* RIGHT: Community Activity Feed */}
          <div className="lg:col-span-1">
            <div className={`${CARD} p-5 h-full`} data-testid="activity-feed">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Community Activity</p>
              </div>

              {(stats?.activity_feed || []).length > 0 ? (
                <div className="space-y-4 overflow-y-auto max-h-[420px] pr-1 scrollbar-thin">
                  {stats.activity_feed.map((item, i) => (
                    <Link
                      key={i}
                      to={`/challenges/${item.challenge_id}`}
                      className="flex items-start gap-3 group"
                      data-testid={`feed-item-${i}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <UserAvatar user={item.author} size="sm" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                            {item.author?.name?.split(" ")[0] || "Someone"}
                          </span>
                          {item.type === "challenge" ? (
                            <span className="text-xs text-slate-500">posted a challenge</span>
                          ) : (
                            <span className="text-xs text-slate-500">answered</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate group-hover:text-slate-400 transition-colors">
                          {item.type === "challenge" ? item.title : item.challenge_title}
                        </p>
                        <p className="text-xs text-slate-700 mt-0.5">{timeAgo(item.created_at)}</p>
                      </div>
                      <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5 ${item.type === "challenge" ? "bg-cyan-500/10" : "bg-blue-500/10"}`}>
                        {item.type === "challenge"
                          ? <MessageSquare className="w-3 h-3 text-cyan-400" strokeWidth={1.5} />
                          : <MessageCircleMore className="w-3 h-3 text-blue-400" strokeWidth={1.5} />
                        }
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-xs text-slate-600">No activity yet.</p>
                  <p className="text-xs text-slate-700 mt-1">Be the first to post a challenge!</p>
                </div>
              )}

              {/* XP Guide at bottom */}
              <div className="border-t border-white/[0.06] mt-5 pt-4">
                <p className="text-xs text-slate-600 mb-2.5 uppercase tracking-widest">Earn XP</p>
                <div className="space-y-1.5">
                  {[
                    { action: "Post a Challenge", pts: "+5 XP" },
                    { action: "Answer a Challenge", pts: "+10 XP" },
                    { action: "Receive an Upvote", pts: "+3 XP" },
                    { action: "Use an AI Tool", pts: "+2 XP" },
                  ].map((item) => (
                    <div key={item.action} className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">{item.action}</span>
                      <span className="text-xs font-semibold text-blue-400/70">{item.pts}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
