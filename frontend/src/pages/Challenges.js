import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { UserAvatar } from "@/components/Navbar";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, ChevronUp, MessageSquare, Clock, Sparkles, Search, X, Filter } from "lucide-react";

const CARD = "bg-white/[0.04] border border-white/[0.07] rounded-2xl";

export default function Challenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [allTags, setAllTags] = useState([]); // All unique tags from challenges
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", tags: "" });
  const [submitting, setSubmitting] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  const fetchChallenges = async () => {
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedTags.length > 0) params.tags = selectedTags.join(",");
      
      const res = await axios.get(`${API}/challenges`, { params, withCredentials: true });
      setChallenges(res.data);
      
      // Extract all unique tags for filter suggestions
      const tags = new Set();
      res.data.forEach(c => c.tags?.forEach(t => tags.add(t)));
      setAllTags(Array.from(tags).sort());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChallenges(); }, [searchQuery, selectedTags]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
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
    return (
      <div className="min-h-screen bg-[#090914] flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090914] relative overflow-hidden pt-16" data-testid="challenges-page">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400/60 uppercase tracking-widest mb-2">
              <MessageSquare className="w-3 h-3" strokeWidth={1.5} /> Community
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white font-[Lexend]">Community Challenges</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">Ask questions, share knowledge, earn XP</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button
                className="flex items-center gap-2 px-5 h-10 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-cyan-500/20"
                data-testid="post-challenge-btn"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} /> Post Challenge
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-[#12121a] border-white/[0.08]">
              <DialogHeader>
                <DialogTitle className="font-[Lexend] text-white">Post a Challenge</DialogTitle>
                <DialogDescription className="text-slate-500">Share a recruiting challenge with the community to get expert answers.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-1.5 block">Title</label>
                  <Input
                    data-testid="challenge-title-input"
                    placeholder="What's your challenge?"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="bg-white/[0.05] border-white/[0.10] text-white placeholder:text-slate-600 focus-visible:border-cyan-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-1.5 block">Description</label>
                  <Textarea
                    data-testid="challenge-desc-input"
                    placeholder="Provide details and context..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="min-h-[100px] resize-none bg-white/[0.05] border-white/[0.10] text-white placeholder:text-slate-600 focus-visible:border-cyan-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-1.5 block">Tags <span className="text-slate-600">(comma-separated)</span></label>
                  <Input
                    data-testid="challenge-tags-input"
                    placeholder="e.g. culture-fit, remote-hiring"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="bg-white/[0.05] border-white/[0.10] text-white placeholder:text-slate-600 focus-visible:border-cyan-500/50"
                  />
                </div>
                <button
                  data-testid="submit-challenge-btn"
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 rounded-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-medium transition-all duration-200 shadow-lg shadow-cyan-500/20"
                >
                  {submitting ? "Posting..." : "Post Challenge (+5 XP)"}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search & Filter Bar */}
        <div className={`${CARD} p-4 mb-6`} data-testid="search-filter-bar">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" strokeWidth={1.5} />
              <Input
                data-testid="search-challenges-input"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/[0.05] border-white/[0.10] text-white placeholder:text-slate-600 focus-visible:border-cyan-500/50 h-10"
              />
            </div>
            
            {/* Clear Filters Button */}
            {(searchQuery || selectedTags.length > 0) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/[0.15] text-sm transition-all"
                data-testid="clear-filters-btn"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.5} /> Clear
              </button>
            )}
          </div>

          {/* Tag Pills */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-1">
                <Filter className="w-3 h-3" strokeWidth={1.5} /> Filter by tag:
              </div>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40 font-medium"
                      : "bg-white/[0.04] text-slate-400 border-white/[0.08] hover:border-white/[0.15] hover:text-slate-300"
                  }`}
                  data-testid={`tag-filter-${tag}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          
          {/* Active Filter Count */}
          {selectedTags.length > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              {challenges.length} challenge{challenges.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {challenges.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500">
              {searchQuery || selectedTags.length > 0 
                ? "No challenges match your filters. Try adjusting your search."
                : "No challenges yet. Be the first to post!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((c, i) => (
              <Link
                key={c.challenge_id}
                to={`/challenges/${c.challenge_id}`}
                className={`block ${CARD} p-5 hover:border-cyan-500/20 hover:bg-white/[0.06] transition-all duration-300 group`}
                style={{ animationDelay: `${i * 0.05}s` }}
                data-testid={`challenge-card-${c.challenge_id}`}
              >
                <div className="flex gap-4">
                  {/* Upvote */}
                  <button
                    onClick={(e) => handleUpvote(c.challenge_id, e)}
                    className={`flex flex-col items-center gap-1 pt-1 ${c.upvoted_by?.includes(user?.user_id) ? "text-cyan-400" : "text-slate-600 hover:text-cyan-400"} transition-colors duration-200`}
                    data-testid={`upvote-challenge-${c.challenge_id}`}
                  >
                    <ChevronUp className="w-5 h-5" strokeWidth={1.5} />
                    <span className="text-sm font-semibold">{c.upvotes || 0}</span>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors duration-200 font-[Lexend]">{c.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{c.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <UserAvatar user={c.author} size="sm" />
                        <span className="text-xs text-slate-400 font-medium">{c.author?.name}</span>
                        {c.author?.badge && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            c.author.badge === "Diamond" ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" :
                            c.author.badge === "Gold" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                            c.author.badge === "Silver" ? "bg-slate-400/20 text-slate-300 border border-slate-400/30" :
                            "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          }`}>
                            {c.author.badge}
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-xs text-slate-600"><MessageSquare className="w-3 h-3" strokeWidth={1.5} /> {c.answers_count || 0}</span>
                      <span className="flex items-center gap-1 text-xs text-slate-600"><Clock className="w-3 h-3" strokeWidth={1.5} /> {timeAgo(c.created_at)}</span>
                    </div>
                    {c.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {c.tags.map((t) => (
                          <span key={t} className="text-[10px] bg-white/[0.06] text-slate-400 px-2 py-0.5 rounded-full border border-white/[0.08]">{t}</span>
                        ))}
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
