import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import logger from "@/lib/logger";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsRow from "@/components/dashboard/StatsRow";
import ResumeSession from "@/components/dashboard/ResumeSession";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentChallenges from "@/components/dashboard/RecentChallenges";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { TOOL_NAMES, NEXT_TIER } from "@/components/dashboard/constants";

const buildResumePrompt = (lastAI, lastChallenge) => {
  if (lastAI && lastChallenge) {
    return `Pick up your ${TOOL_NAMES[lastAI.tool_type] || "AI tool"}, or check in on your active challenge.`;
  }
  if (lastAI) return `Would you like to continue with your ${TOOL_NAMES[lastAI.tool_type] || "AI tool"}?`;
  if (lastChallenge) return `Your challenge "${lastChallenge.title?.substring(0, 45)}${lastChallenge.title?.length > 45 ? "..." : ""}" is live in the community.`;
  return "Start by exploring AI tools or posting your first community challenge.";
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/dashboard/stats`, { withCredentials: true });
        setStats(res.data);
      } catch (err) { logger.error(err); }
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
  const firstName = user?.name?.split(" ")[0] || "there";
  const lastAI = stats?.last_ai_tool;
  const lastChallenge = stats?.last_challenge;

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pt-24">

        <DashboardHeader
          firstName={firstName}
          badge={badge}
          resumePrompt={buildResumePrompt(lastAI, lastChallenge)}
        />

        <StatsRow
          points={points}
          next={NEXT_TIER(points)}
          userRank={stats?.user_rank || 0}
          totalMembers={stats?.total_members}
        />

        <ResumeSession lastAI={lastAI} lastChallenge={lastChallenge} />

        {/* ── MAIN GRID: Quick Actions (left) + Activity Feed (right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-float-in stagger-3">
          <div className="lg:col-span-2 space-y-6">
            <QuickActions />
            <RecentChallenges challenges={stats?.recent_challenges} />
          </div>
          <div className="lg:col-span-1">
            <ActivityFeed feed={stats?.activity_feed} />
          </div>
        </div>
      </div>
    </div>
  );
}
