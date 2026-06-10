import { Link } from "react-router-dom";
import { MessageSquare, MessageCircleMore } from "lucide-react";
import { UserAvatar } from "@/components/Navbar";
import { CARD, timeAgo } from "./constants";

const XP_GUIDE = [
  { action: "Post a Challenge", pts: "+5 XP" },
  { action: "Answer a Challenge", pts: "+10 XP" },
  { action: "Receive an Upvote", pts: "+3 XP" },
  { action: "Use an AI Tool", pts: "+2 XP" },
];

function FeedItem({ item, index }) {
  return (
    <Link
      to={`/challenges/${item.challenge_id}`}
      className="flex items-start gap-3 group"
      data-testid={`feed-item-${index}`}
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
  );
}

export default function ActivityFeed({ feed }) {
  return (
    <div className={`${CARD} p-5 h-full`} data-testid="activity-feed">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Community Activity</p>
      </div>

      {(feed || []).length > 0 ? (
        <div className="space-y-4 overflow-y-auto max-h-[420px] pr-1 scrollbar-thin">
          {feed.map((item, i) => (
            <FeedItem key={`${item.type}-${item.challenge_id}-${item.created_at}`} item={item} index={i} />
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
          {XP_GUIDE.map((item) => (
            <div key={item.action} className="flex items-center justify-between">
              <span className="text-xs text-slate-600">{item.action}</span>
              <span className="text-xs font-semibold text-blue-400/70">{item.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
