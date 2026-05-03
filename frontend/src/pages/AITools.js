import { FileText, Search, UserSearch, BookUser, Building2, Users } from "lucide-react";
import ToolSelector from "@/components/ai-tools/ToolSelector";
import ToolWorkspace from "@/components/ai-tools/ToolWorkspace";
import useAITools from "@/hooks/useAITools";

const TOOLS = [
  { id: "jd-builder",        icon: FileText,   label: "JD Builder",       color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20",  prompt: "Role title, seniority, key responsibilities..." },
  { id: "search-strategy",   icon: Search,     label: "Search Strategy",  color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20",  prompt: "Target role, industry, location, key skills..." },
  { id: "talent-scout",      icon: Users,      label: "Talent Scout",     color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", prompt: "Research high-potential candidates with iterative feedback" },
  { id: "candidate-research",icon: UserSearch, label: "Candidate Research",color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20",prompt: "Candidate name, LinkedIn URL, or background..." },
  { id: "dossier",           icon: BookUser,   label: "Candidate Dossier",color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20", prompt: "Candidate name, role, company, experience notes..." },
  { id: "client-research",   icon: Building2,  label: "Client Research",  color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20",prompt: "Company name, industry, HQ location..." },
];

export default function AITools() {
  const state = useAITools();

  if (!state.selectedTool) {
    return <ToolSelector tools={TOOLS} onSelectTool={state.selectTool} />;
  }

  return <ToolWorkspace state={state} />;
}
