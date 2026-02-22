import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import { UserAvatar } from "@/components/Navbar";
import RichTextEditor from "@/components/RichTextEditor";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, ChevronUp, MessageSquare, Clock, Sparkles, Search, X, Filter, Pin, PinOff } from "lucide-react";

const CARD = "bg-white/[0.04] border border-white/[0.07] rounded-2xl";

// Challenge categories
const CATEGORIES = [
  "Building AI tool",
  "Interview Techniques",
  "Candidate Research",
  "Candidate Engagement",
  "Stakeholder Management"
];

// Category colors and icons
const CATEGORY_CONFIG = {
  "Building AI tool": { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  "Interview Techniques": { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  "Candidate Research": { color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  "Candidate Engagement": { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  "Stakeholder Management": { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

export default function Challenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", tags: "", category: "" });
  const [submitting, setSubmitting] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const fetchChallenges = async () => {
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedTags.length > 0) params.tags = selectedTags.join(",");
      if (selectedCategory) params.category = selectedCategory;
      
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

  useEffect(() => { fetchChallenges(); }, [searchQuery, selectedTags, selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) { 
      toast.error("Title and description are required"); 
      return; 
    }
    if (!form.category) {
      toast.error("Please select a category");
      return;
    }
    setSubmitting(true);
    try {
      const tags = form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
      await axios.post(
        `${API}/challenges`, 
        { title: form.title, description: form.description, tags, category: form.category }, 
        { withCredentials: true }
      );
      toast.success("Challenge posted! +5 XP earned");
      setForm({ title: "", description: "", tags: "", category: "" });
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
        return { 
          ...c, 
          upvotes: res.data.upvoted ? c.upvotes + 1 : c.upvotes - 1, 
          upvoted_by: res.data.upvoted 
            ? [...(c.upvoted_by || []), user.user_id] 
            : (c.upvoted_by || []).filter((id) => id !== user.user_id) 
        };
      }));
    } catch (err) {
      toast.error("Upvote failed");
    }
  };

  const handlePin = async (challengeId, currentlyPinned, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAdmin) {
      toast.error("Admin access required");
      return;
    }

    try {
      await axios.post(
        `${API}/challenges/${challengeId}/pin`,
        { pinned: !currentlyPinned, pin_order: 0 },
        { withCredentials: true }
      );
      toast.success(currentlyPinned ? "Challenge unpinned" : "Challenge pinned");
      fetchChallenges();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Pin action failed");
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
    setSelectedCategory("");
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

  const getCategoryStyle = (category) => {
    return CATEGORY_CONFIG[category] || CATEGORY_CONFIG["Building AI tool"];
  };

  return (
    <div className="min-h-screen bg-[#090914] px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white font-[Lexend] mb-2">
              Community Challenges
            </h1>
            <p className="text-slate-400 text-base sm:text-lg">
              Share recruiting challenges & learn from the community
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-5 h-11 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 text-white font-medium text-sm shadow-lg shadow-blue-500/25 transition-all">
                <Plus className="w-4 h-4" strokeWidth={2} />
                New Challenge
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#12121a] border-white/[0.08] max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-white font-[Lexend]">Post a Challenge</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Share a recruiting challenge or question with the community
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Title</label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., How to assess culture fit in remote interviews?"
                    className="bg-white/[0.04] border-white/[0.08] text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Category</label>
                  <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                    <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#12121a] border-white/[0.08]">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-slate-300 hover:text-white hover:bg-white/[0.06]">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the challenge in detail..."
                    rows={5}
                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/30"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Tags (comma-separated)</label>
                  <Input
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="remote, video-interview, assessment"
                    className="bg-white/[0.04] border-white/[0.08] text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setDialogOpen(false)}
                    className="px-5 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.10] text-slate-300 hover:text-white text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 h-10 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                  >
                    {submitting ? "Posting..." : "Post Challenge"}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search & Filters */}
        <div className={`${CARD} p-4 space-y-4`}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" strokeWidth={1.5} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search challenges..."
                className="pl-10 bg-white/[0.04] border-white/[0.08] text-white"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px] bg-white/[0.04] border-white/[0.08] text-white">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-[#12121a] border-white/[0.08]">
                <SelectItem value="" className="text-slate-300 hover:text-white hover:bg-white/[0.06]">
                  All Categories
                </SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-slate-300 hover:text-white hover:bg-white/[0.06]">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tag filters */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Filter className="w-3 h-3" strokeWidth={1.5} />
                Tags:
              </span>
              {allTags.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-300 border border-white/[0.05]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {(searchQuery || selectedTags.length > 0 || selectedCategory) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" strokeWidth={1.5} />
              Clear filters
            </button>
          )}
        </div>

        {/* Challenges List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" strokeWidth={1.5} />
          </div>
        ) : challenges.length === 0 ? (
          <div className={`${CARD} p-12 text-center`}>
            <p className="text-slate-400">No challenges found. Be the first to post!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((c) => {
              const categoryStyle = getCategoryStyle(c.category);
              const isPinned = c.pinned;
              
              return (
                <Link key={c.challenge_id} to={`/challenges/${c.challenge_id}`}>
                  <div className={`${CARD} p-6 hover:border-blue-500/30 transition-all group relative ${isPinned ? 'ring-2 ring-yellow-500/20 bg-yellow-500/[0.02]' : ''}`}>
                    {/* Pinned indicator */}
                    {isPinned && (
                      <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                        <Pin className="w-3 h-3 text-yellow-400" strokeWidth={2} />
                        <span className="text-xs text-yellow-400 font-medium">Pinned</span>
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      {/* Upvote */}
                      <button
                        onClick={(e) => handleUpvote(c.challenge_id, e)}
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                          c.upvoted_by?.includes(user?.user_id)
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"
                        }`}
                      >
                        <ChevronUp className="w-5 h-5" strokeWidth={2} />
                        <span className="text-sm font-medium">{c.upvotes}</span>
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors mb-2 font-[Lexend]">
                              {c.title}
                            </h3>
                            <p className="text-slate-400 text-sm line-clamp-2 mb-3">{c.description}</p>
                          </div>
                        </div>

                        {/* Category & Tags */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {c.category && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.color} border ${categoryStyle.border}`}>
                              {c.category}
                            </span>
                          )}
                          {c.tags?.slice(0, 3).map((tag) => (
                            <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.04] text-slate-400 border border-white/[0.05]">
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <UserAvatar user={c.author} size="xs" />
                            <span>{c.author?.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              c.author?.badge === "Gold" ? "bg-amber-500/10 text-amber-400" :
                              c.author?.badge === "Silver" ? "bg-slate-400/10 text-slate-400" :
                              "bg-orange-500/10 text-orange-400"
                            }`}>
                              {c.author?.badge}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" strokeWidth={1.5} />
                            {timeAgo(c.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" strokeWidth={1.5} />
                            {c.answers_count} {c.answers_count === 1 ? "answer" : "answers"}
                          </div>

                          {/* Admin pin button */}
                          {isAdmin && (
                            <button
                              onClick={(e) => handlePin(c.challenge_id, isPinned, e)}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ml-auto ${
                                isPinned
                                  ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                                  : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"
                              }`}
                            >
                              {isPinned ? (
                                <>
                                  <PinOff className="w-3 h-3" strokeWidth={2} />
                                  Unpin
                                </>
                              ) : (
                                <>
                                  <Pin className="w-3 h-3" strokeWidth={2} />
                                  Pin
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
