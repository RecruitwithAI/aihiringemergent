import {
  FileText, Search, UserSearch, BookUser, Building2,
} from "lucide-react";

export const TOOL_NAMES = {
  "jd-builder": "Job Description Builder",
  "search-strategy": "Search Strategy Maker",
  "candidate-research": "Candidate Researcher",
  "dossier": "Candidate Dossier",
  "client-research": "Client Researcher",
};

export const TOOL_ICONS = {
  "jd-builder": FileText,
  "search-strategy": Search,
  "candidate-research": UserSearch,
  "dossier": BookUser,
  "client-research": Building2,
};

export const BADGE_STYLES = {
  Diamond: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  Gold: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  Silver: "text-slate-300 border-slate-400/30 bg-slate-400/10",
  Bronze: "text-orange-400 border-orange-400/30 bg-orange-400/10",
};

export const NEXT_TIER = (pts) => {
  if (pts < 100) return { name: "Silver", target: 100, progress: (pts / 100) * 100 };
  if (pts < 200) return { name: "Gold", target: 200, progress: ((pts - 100) / 100) * 100 };
  if (pts < 500) return { name: "Diamond", target: 500, progress: ((pts - 200) / 300) * 100 };
  return { name: "Max", target: 500, progress: 100 };
};

export const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export const CARD = "bg-white/[0.04] border border-white/[0.07] rounded-2xl";
export const CARD_HOVER = "hover:border-blue-500/30 hover:bg-white/[0.06] transition-all duration-300";
