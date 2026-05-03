import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { UserAvatar } from "@/components/Navbar";
import RichTextEditor from "@/components/RichTextEditor";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, ChevronUp, Clock, MessageSquare, Pin } from "lucide-react";
import DOMPurify from 'dompurify';

const CARD = "bg-white/[0.04] border border-white/[0.07] rounded-2xl";

export default function ChallengeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchChallenge = async () => {
    try {
      const res = await axios.get(`${API}/challenges/${id}`, { withCredentials: true });
      setChallenge(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChallenge(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) { toast.error("Answer cannot be empty"); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API}/challenges/${id}/answers`, { content: answerText }, { withCredentials: true });
      toast.success("Answer posted! +10 XP earned");
      setAnswerText("");
      fetchChallenge();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to post answer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvoteChallenge = async () => {
    try {
      const res = await axios.post(`${API}/challenges/${id}/upvote`, {}, { withCredentials: true });
      setChallenge((prev) => ({
        ...prev,
        upvotes: res.data.upvoted ? prev.upvotes + 1 : prev.upvotes - 1,
        upvoted_by: res.data.upvoted
          ? [...(prev.upvoted_by || []), user.user_id]
          : (prev.upvoted_by || []).filter((uid) => uid !== user.user_id),
      }));
    } catch { toast.error("Upvote failed"); }
  };

  const handleUpvoteAnswer = async (answerId) => {
    try {
      const res = await axios.post(`${API}/answers/${answerId}/upvote`, {}, { withCredentials: true });
      setChallenge((prev) => ({
        ...prev,
        answers: prev.answers.map((a) => {
          if (a.answer_id !== answerId) return a;
          return {
            ...a,
            upvotes: res.data.upvoted ? a.upvotes + 1 : a.upvotes - 1,
            upvoted_by: res.data.upvoted
              ? [...(a.upvoted_by || []), user.user_id]
              : (a.upvoted_by || []).filter((uid) => uid !== user.user_id),
          };
        }),
      }));
    } catch { toast.error("Upvote failed"); }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

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
        <div className="animate-pulse text-slate-500">Loading challenge...</div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-[#090914] flex items-center justify-center">
        <p className="text-slate-500">Challenge not found</p>
      </div>
    );
  }

  const isUpvoted = challenge.upvoted_by?.includes(user?.user_id);

  return (
    <div className="min-h-screen bg-[#090914] relative overflow-hidden" data-testid="challenge-detail-page">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/challenges"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors duration-200 mb-6"
          data-testid="back-to-challenges"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Back to Challenges
        </Link>

        {/* Challenge */}
        <div className={`${CARD} p-6 md:p-8`} data-testid="challenge-content">
          <div className="flex gap-4">
            <button
              onClick={handleUpvoteChallenge}
              className={`flex flex-col items-center gap-1 pt-1 ${isUpvoted ? "text-cyan-400" : "text-slate-600 hover:text-cyan-400"} transition-colors duration-200`}
              data-testid="upvote-challenge-btn"
            >
              <ChevronUp className="w-6 h-6" strokeWidth={1.5} />
              <span className="text-sm font-semibold">{challenge.upvotes || 0}</span>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-white font-[Lexend]">{challenge.title}</h1>
              <div className="flex items-center gap-3 mt-3">
                <UserAvatar user={challenge.author} size="sm" />
                <span className="text-sm text-slate-300 font-medium">{challenge.author?.name}</span>
                {challenge.author?.badge && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getBadgeStyle(challenge.author.badge)}`}>
                    {challenge.author.badge}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-slate-600"><Clock className="w-3 h-3" strokeWidth={1.5} /> {timeAgo(challenge.created_at)}</span>
              </div>
              <p className="text-slate-400 mt-4 leading-relaxed whitespace-pre-wrap">{challenge.description}</p>
              {challenge.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {challenge.tags.map((t) => (
                    <span key={t} className="text-xs bg-white/[0.06] text-slate-400 px-2.5 py-0.5 rounded-full border border-white/[0.08]">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Answer form */}
        <div className={`${CARD} p-6 mt-4`} data-testid="answer-form">
          <h3 className="font-semibold text-white font-[Lexend] mb-3">Your Answer</h3>
          <form onSubmit={handleAnswer} className="space-y-3">
            <RichTextEditor
              content={answerText}
              onChange={setAnswerText}
              placeholder="Share your expertise..."
            />
            <button
              data-testid="submit-answer-btn"
              type="submit"
              disabled={submitting || !answerText.trim()}
              className="px-6 h-10 rounded-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-cyan-500/20"
            >
              {submitting ? "Posting..." : "Post Answer (+10 XP)"}
            </button>
          </form>
        </div>

        {/* Answers */}
        <div className="mt-6">
          <h3 className="font-semibold text-white font-[Lexend] mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
            {challenge.answers?.length || 0} Answers
          </h3>
          {challenge.answers?.length > 0 ? (
            <div className="space-y-4">
              {challenge.answers.map((a, i) => {
                const ansUpvoted = a.upvoted_by?.includes(user?.user_id);
                return (
                  <div
                    key={a.answer_id}
                    className={`${CARD} p-6`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                    data-testid={`answer-${a.answer_id}`}
                  >
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleUpvoteAnswer(a.answer_id)}
                        className={`flex flex-col items-center gap-1 pt-1 ${ansUpvoted ? "text-cyan-400" : "text-slate-600 hover:text-cyan-400"} transition-colors duration-200`}
                        data-testid={`upvote-answer-${a.answer_id}`}
                      >
                        <ChevronUp className="w-5 h-5" strokeWidth={1.5} />
                        <span className="text-sm font-semibold">{a.upvotes || 0}</span>
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <UserAvatar user={a.author} size="sm" />
                          <span className="text-sm text-slate-300 font-medium">{a.author?.name}</span>
                          {a.author?.badge && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getBadgeStyle(a.author.badge)}`}>
                              {a.author.badge}
                            </span>
                          )}
                          <span className="text-xs text-slate-600">{timeAgo(a.created_at)}</span>
                        </div>
                        <div
                          className="text-slate-400 leading-relaxed prose prose-invert prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(a.content) }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-600 text-center py-8">No answers yet. Be the first to help!</p>
          )}
        </div>
      </div>
    </div>
  );
}
