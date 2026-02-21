import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { UserAvatar } from "@/components/Navbar";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, ChevronUp, Clock, MessageSquare } from "lucide-react";

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

  useEffect(() => { fetchChallenge(); }, [id]);

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-stone-400">Loading challenge...</div></div>;
  }

  if (!challenge) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-stone-400">Challenge not found</p></div>;
  }

  const isUpvoted = challenge.upvoted_by?.includes(user?.user_id);

  return (
    <div className="min-h-screen bg-[#FAFAF9]" data-testid="challenge-detail-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/challenges" className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors duration-200 mb-6" data-testid="back-to-challenges">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Back to Challenges
        </Link>

        {/* Challenge */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 md:p-8 animate-float-in" data-testid="challenge-content">
          <div className="flex gap-4">
            <button
              onClick={handleUpvoteChallenge}
              className={`flex flex-col items-center gap-1 pt-1 ${isUpvoted ? "text-primary" : "text-stone-400 hover:text-primary"} transition-colors duration-200`}
              data-testid="upvote-challenge-btn"
            >
              <ChevronUp className="w-6 h-6" strokeWidth={1.5} />
              <span className="text-sm font-semibold">{challenge.upvotes || 0}</span>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-stone-900 font-[Lexend]">{challenge.title}</h1>
              <div className="flex items-center gap-3 mt-3">
                <UserAvatar user={challenge.author} size="sm" />
                <span className="text-sm text-stone-700 font-medium">{challenge.author?.name}</span>
                {challenge.author?.badge && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full badge-${challenge.author.badge.toLowerCase()}`}>{challenge.author.badge}</span>}
                <span className="flex items-center gap-1 text-xs text-stone-400"><Clock className="w-3 h-3" strokeWidth={1.5} /> {timeAgo(challenge.created_at)}</span>
              </div>
              <p className="text-stone-600 mt-4 leading-relaxed whitespace-pre-wrap">{challenge.description}</p>
              {challenge.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {challenge.tags.map((t) => <span key={t} className="text-xs bg-stone-100 text-stone-500 px-2.5 py-0.5 rounded-full">{t}</span>)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Answer form */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 mt-4 animate-float-in stagger-1" data-testid="answer-form">
          <h3 className="font-semibold text-stone-900 font-[Lexend] mb-3">Your Answer</h3>
          <form onSubmit={handleAnswer} className="space-y-3">
            <Textarea data-testid="answer-input" placeholder="Share your expertise..." value={answerText} onChange={(e) => setAnswerText(e.target.value)} className="min-h-[100px] resize-none" required />
            <Button data-testid="submit-answer-btn" type="submit" disabled={submitting} className="rounded-full px-6 bg-primary hover:bg-primary/90 text-white">
              {submitting ? "Posting..." : "Post Answer (+10 XP)"}
            </Button>
          </form>
        </div>

        {/* Answers */}
        <div className="mt-6">
          <h3 className="font-semibold text-stone-900 font-[Lexend] mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
            {challenge.answers?.length || 0} Answers
          </h3>
          {challenge.answers?.length > 0 ? (
            <div className="space-y-4">
              {challenge.answers.map((a, i) => {
                const ansUpvoted = a.upvoted_by?.includes(user?.user_id);
                return (
                  <div key={a.answer_id} className={`bg-white rounded-xl border border-stone-200 shadow-sm p-6 animate-float-in stagger-${Math.min(i + 1, 5)}`} data-testid={`answer-${a.answer_id}`}>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleUpvoteAnswer(a.answer_id)}
                        className={`flex flex-col items-center gap-1 pt-1 ${ansUpvoted ? "text-primary" : "text-stone-400 hover:text-primary"} transition-colors duration-200`}
                        data-testid={`upvote-answer-${a.answer_id}`}
                      >
                        <ChevronUp className="w-5 h-5" strokeWidth={1.5} />
                        <span className="text-sm font-semibold">{a.upvotes || 0}</span>
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <UserAvatar user={a.author} size="sm" />
                          <span className="text-sm text-stone-700 font-medium">{a.author?.name}</span>
                          {a.author?.badge && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full badge-${a.author.badge.toLowerCase()}`}>{a.author.badge}</span>}
                          <span className="text-xs text-stone-400">{timeAgo(a.created_at)}</span>
                        </div>
                        <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-stone-400 text-center py-8">No answers yet. Be the first to help!</p>
          )}
        </div>
      </div>
    </div>
  );
}
