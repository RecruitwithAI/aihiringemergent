import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import { UserAvatar } from "@/components/Navbar";
import axios from "axios";
import { Trophy, Crown, Medal, Award } from "lucide-react";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/leaderboard`, { withCredentials: true });
        setLeaders(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const getBadgeClass = (badge) => {
    const m = { Bronze: "badge-bronze", Silver: "badge-silver", Gold: "badge-gold", Diamond: "badge-diamond" };
    return m[badge] || "badge-bronze";
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-stone-400">Loading leaderboard...</div></div>;
  }

  const topThree = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <div className="min-h-screen bg-[#FAFAF9]" data-testid="leaderboard-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-float-in">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900 font-[Lexend]">
            <span className="gradient-text">Leaderboard</span>
          </h1>
          <p className="text-base text-stone-500 mt-1">Top recruiting leaders ranked by community contribution</p>
        </div>

        {leaders.length === 0 ? (
          <p className="text-stone-400 text-center py-12">No members yet.</p>
        ) : (
          <>
            {/* Podium for top 3 */}
            {topThree.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-8">
                {/* 2nd place */}
                <PodiumCard user={topThree[1]} rank={2} currentUserId={user?.user_id} getBadgeClass={getBadgeClass} />
                {/* 1st place */}
                <PodiumCard user={topThree[0]} rank={1} currentUserId={user?.user_id} getBadgeClass={getBadgeClass} />
                {/* 3rd place */}
                <PodiumCard user={topThree[2]} rank={3} currentUserId={user?.user_id} getBadgeClass={getBadgeClass} />
              </div>
            )}

            {/* Rest of leaderboard */}
            <div className="space-y-2">
              {rest.map((l, i) => {
                const isMe = l.user_id === user?.user_id;
                return (
                  <div
                    key={l.user_id}
                    className={`flex items-center justify-between p-4 bg-white rounded-xl border shadow-sm card-hover animate-float-in stagger-${Math.min(i + 1, 5)} ${isMe ? "leaderboard-self" : "border-stone-200"}`}
                    data-testid={`leaderboard-row-${l.rank}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 text-center text-sm text-stone-400 font-[Lexend] font-medium">#{l.rank}</span>
                      <UserAvatar user={l} size="sm" />
                      <div>
                        <p className={`text-sm font-medium ${isMe ? "text-primary" : "text-stone-900"}`}>
                          {l.name} {isMe && <span className="text-xs text-stone-400 ml-1">(you)</span>}
                        </p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getBadgeClass(l.badge)}`}>{l.badge}</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary font-[Lexend]">{l.points} XP</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PodiumCard({ user: leader, rank, currentUserId, getBadgeClass }) {
  if (!leader) return <div />;

  const isMe = leader.user_id === currentUserId;
  const rankConfig = {
    1: { icon: Crown, color: "text-amber-500", glow: "rank-gold", bg: "bg-amber-50 border-amber-200", label: "1st", height: "pt-4" },
    2: { icon: Medal, color: "text-stone-400", glow: "rank-silver", bg: "bg-stone-50 border-stone-200", label: "2nd", height: "pt-8" },
    3: { icon: Award, color: "text-amber-700", glow: "rank-bronze", bg: "bg-orange-50 border-orange-200", label: "3rd", height: "pt-8" },
  };
  const cfg = rankConfig[rank];

  return (
    <div className={`${cfg.height} animate-float-in ${rank === 1 ? "" : rank === 2 ? "stagger-1" : "stagger-2"}`}>
      <div className={`${cfg.bg} rounded-xl border p-5 text-center card-glow ${isMe ? "ring-2 ring-primary/20" : ""}`} data-testid={`podium-${rank}`}>
        <cfg.icon className={`w-6 h-6 mx-auto mb-2 ${cfg.color} ${cfg.glow}`} strokeWidth={1.5} />
        <div className="flex justify-center mb-2">
          <UserAvatar user={leader} size="md" />
        </div>
        <p className={`text-sm font-semibold truncate ${isMe ? "text-primary" : "text-stone-900"}`}>{leader.name?.split(" ")[0]}</p>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getBadgeClass(leader.badge)}`}>{leader.badge}</span>
        <p className="text-lg font-semibold gradient-text font-[Lexend] mt-1">{leader.points} XP</p>
      </div>
    </div>
  );
}
