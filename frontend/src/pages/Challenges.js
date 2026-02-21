import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { UserAvatar } from "@/components/Navbar";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, ChevronUp, MessageSquare, Clock } from "lucide-react";

export default function Challenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", tags: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchChallenges = async () => {
    try {
      const res = await axios.get(`${API}/challenges`, { withCredentials: true });
      setChallenges(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChallenges(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) { toast.error("Title and description are required"); return; }
    setSubmitting(true);
    try {
      const tags = form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
      await axios.post(`${API}/challenges`, { title: form.title, description: form.description, tags }, { withCredentials: true });
      toast.success("Challenge posted! +5 XP earned");
      setForm({ title: "", description: "", tags: "" });
      setDialogOpen(false);
      fetchChallenges();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (challengeId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await axios.post(`${API}/challenges/${challengeId}/upvote`, {}, { withCredentials: true });
      setChallenges((prev) => prev.map((c) => {
        if (c.challenge_id !== challengeId) return c;
        return { ...c, upvotes: res.data.upvoted ? c.upvotes + 1 : c.upvotes - 1, upvoted_by: res.data.upvoted ? [...(c.upvoted_by || []), user.user_id] : (c.upvoted_by || []).filter((id) => id !== user.user_id) };
      }));
    } catch (err) {
      toast.error("Upvote failed");
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-stone-400">Loading challenges...</div></div>;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]" data-testid="challenges-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8 animate-float-in">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900 font-[Lexend]">Community Challenges</h1>
            <p className="text-base text-stone-500 mt-1">Ask questions, share knowledge, earn XP</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full px-6 bg-primary hover:bg-primary/90 text-white" data-testid="post-challenge-btn">
                <Plus className="w-4 h-4 mr-1.5" strokeWidth={1.5} /> Post Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-[Lexend]">Post a Challenge</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1.5 block">Title</label>
                  <Input data-testid="challenge-title-input" placeholder="What's your challenge?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1.5 block">Description</label>
                  <Textarea data-testid="challenge-desc-input" placeholder="Provide details and context..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[100px] resize-none" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1.5 block">Tags <span className="text-stone-400">(comma-separated)</span></label>
                  <Input data-testid="challenge-tags-input" placeholder="e.g. culture-fit, remote-hiring" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                </div>
                <Button data-testid="submit-challenge-btn" type="submit" disabled={submitting} className="w-full rounded-full bg-primary hover:bg-primary/90 text-white">
                  {submitting ? "Posting..." : "Post Challenge (+5 XP)"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {challenges.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-stone-400">No challenges yet. Be the first to post!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((c, i) => (
              <Link
                key={c.challenge_id}
                to={`/challenges/${c.challenge_id}`}
                className={`block bg-white rounded-xl border border-stone-200 shadow-sm p-6 card-hover group animate-float-in stagger-${Math.min(i + 1, 5)}`}
                data-testid={`challenge-card-${c.challenge_id}`}
              >
                <div className="flex gap-4">
                  {/* Upvote */}
                  <button
                    onClick={(e) => handleUpvote(c.challenge_id, e)}
                    className={`flex flex-col items-center gap-1 pt-1 ${c.upvoted_by?.includes(user?.user_id) ? "text-primary" : "text-stone-400 hover:text-primary"} transition-colors duration-200`}
                    data-testid={`upvote-challenge-${c.challenge_id}`}
                  >
                    <ChevronUp className="w-5 h-5" strokeWidth={1.5} />
                    <span className="text-sm font-semibold">{c.upvotes || 0}</span>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-stone-900 group-hover:text-primary transition-colors duration-200 font-[Lexend]">{c.title}</h3>
                    <p className="text-sm text-stone-500 mt-1 line-clamp-2">{c.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <UserAvatar user={c.author} size="sm" />
                        <span className="text-xs text-stone-600 font-medium">{c.author?.name}</span>
                        {c.author?.badge && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full badge-${c.author.badge.toLowerCase()}`}>{c.author.badge}</span>}
                      </div>
                      <span className="flex items-center gap-1 text-xs text-stone-400"><MessageSquare className="w-3 h-3" strokeWidth={1.5} /> {c.answers_count || 0}</span>
                      <span className="flex items-center gap-1 text-xs text-stone-400"><Clock className="w-3 h-3" strokeWidth={1.5} /> {timeAgo(c.created_at)}</span>
                    </div>
                    {c.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {c.tags.map((t) => <span key={t} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{t}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
