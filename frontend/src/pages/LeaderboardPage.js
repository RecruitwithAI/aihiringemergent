import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import { UserAvatar } from "@/components/Navbar";
import axios from "axios";
import { Trophy } from "lucide-react";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/leaderboard`, { withCredentials: true });
        setLeaders(res.data);
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

  const getRankStyle = (rank) => {
    if (rank === 1) return "text-amber-500 font-semibold";
    if (rank === 2) return "text-stone-400 font-semibold";
    if (rank === 3) return "text-amber-700 font-semibold";
    return "text-stone-400";
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-stone-400">Loading leaderboard...</div></div>;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]" data-testid="leaderboard-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-float-in">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900 font-[Lexend]">Leaderboard</h1>
          <p className="text-base text-stone-500 mt-1">Top recruiting leaders ranked by community contribution</p>
        </div>

        {leaders.length === 0 ? (
          <p className="text-stone-400 text-center py-12">No members yet.</p>
        ) : (
          <div className="space-y-3">
            {leaders.map((l, i) => {
              const isMe = l.user_id === user?.user_id;
              return (
                <div
                  key={l.user_id}
                  className={`flex items-center justify-between p-4 bg-white rounded-xl border shadow-sm card-hover animate-float-in stagger-${Math.min(i + 1, 5)} ${isMe ? "border-primary/30" : "border-stone-200"}`}
                  data-testid={`leaderboard-row-${l.rank}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <span className={`w-8 text-center text-lg font-[Lexend] ${getRankStyle(l.rank)}`}>
                      {l.rank <= 3 ? <Trophy className={`w-5 h-5 mx-auto ${l.rank === 1 ? "text-amber-500" : l.rank === 2 ? "text-stone-400" : "text-amber-700"}`} strokeWidth={1.5} /> : `#${l.rank}`}
                    </span>
                    {/* Avatar + name */}
                    <UserAvatar user={l} size="sm" />
                    <div>
                      <p className={`text-sm font-medium ${isMe ? "text-primary" : "text-stone-900"}`}>
                        {l.name} {isMe && <span className="text-xs text-stone-400">(you)</span>}
                      </p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getBadgeClass(l.badge)}`}>{l.badge}</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-primary font-[Lexend]">{l.points} XP</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
