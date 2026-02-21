import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import { UserAvatar } from "@/components/Navbar";
import axios from "axios";
import { Trophy, Crown, Medal, Award } from "lucide-react";

const CARD = "bg-white/[0.04] border border-white/[0.07] rounded-2xl";

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

  const getBadgeStyle = (badge) => {
    switch (badge) {
      case "Diamond": return "bg-violet-500/20 text-violet-400 border border-violet-500/30";
      case "Gold": return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
      case "Silver": return "bg-slate-400/20 text-slate-300 border border-slate-400/30";
      default: return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090914] flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading leaderboard...</div>
      </div>
    );
  }

  const topThree = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <div className="min-h-screen bg-[#090914] relative overflow-hidden" data-testid="leaderboard-page">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-amber-400/60 uppercase tracking-widest mb-2">
            <Trophy className="w-3 h-3" strokeWidth={1.5} /> Rankings
          </div>
          <h1 className="text-3xl font-semibold text-white font-[Lexend]">Leaderboard</h1>
          <p className="text-slate-400 text-sm mt-1">Top recruiting leaders ranked by community contribution</p>
        </div>

        {leaders.length === 0 ? (
          <p className="text-slate-500 text-center py-12">No members yet.</p>
        ) : (
          <>
            {/* Podium for top 3 */}
            {topThree.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-8">
                {/* 2nd place */}
                <PodiumCard leader={topThree[1]} rank={2} currentUserId={user?.user_id} getBadgeStyle={getBadgeStyle} />
                {/* 1st place */}
                <PodiumCard leader={topThree[0]} rank={1} currentUserId={user?.user_id} getBadgeStyle={getBadgeStyle} />
                {/* 3rd place */}
                <PodiumCard leader={topThree[2]} rank={3} currentUserId={user?.user_id} getBadgeStyle={getBadgeStyle} />
              </div>
            )}

            {/* Rest of leaderboard */}
            <div className="space-y-2">
              {rest.map((l, i) => {
                const isMe = l.user_id === user?.user_id;
                return (
                  <div
                    key={l.user_id}
                    className={`flex items-center justify-between p-4 ${CARD} ${isMe ? "border-blue-500/30 bg-blue-500/[0.06]" : ""} hover:border-white/[0.12] transition-all duration-300`}
                    style={{ animationDelay: `${i * 0.03}s` }}
                    data-testid={`leaderboard-row-${l.rank}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 text-center text-sm text-slate-500 font-[Lexend] font-medium">#{l.rank}</span>
                      <UserAvatar user={l} size="sm" />
                      <div>
                        <p className={`text-sm font-medium ${isMe ? "text-blue-400" : "text-white"}`}>
                          {l.name} {isMe && <span className="text-xs text-slate-500 ml-1">(you)</span>}
                        </p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getBadgeStyle(l.badge)}`}>{l.badge}</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-blue-400 font-[Lexend]">{l.points} XP</span>
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

function PodiumCard({ leader, rank, currentUserId, getBadgeStyle }) {
  if (!leader) return <div />;

  const isMe = leader.user_id === currentUserId;
  const rankConfig = {
    1: { icon: Crown, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "1st", height: "pt-0" },
    2: { icon: Medal, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", label: "2nd", height: "pt-6" },
    3: { icon: Award, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "3rd", height: "pt-6" },
  };
  const cfg = rankConfig[rank];

  return (
    <div className={cfg.height}>
      <div
        className={`${CARD} ${cfg.bg} border ${cfg.border} p-5 text-center ${isMe ? "ring-2 ring-blue-500/30" : ""} hover:bg-white/[0.06] transition-all duration-300`}
        data-testid={`podium-${rank}`}
      >
        <cfg.icon className={`w-6 h-6 mx-auto mb-2 ${cfg.color}`} strokeWidth={1.5} />
        <div className="flex justify-center mb-2">
          <UserAvatar user={leader} size="md" />
        </div>
        <p className={`text-sm font-semibold truncate ${isMe ? "text-blue-400" : "text-white"}`}>{leader.name?.split(" ")[0]}</p>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getBadgeStyle(leader.badge)}`}>{leader.badge}</span>
        <p className="text-lg font-semibold text-blue-400 font-[Lexend] mt-1">{leader.points} XP</p>
      </div>
    </div>
  );
}
