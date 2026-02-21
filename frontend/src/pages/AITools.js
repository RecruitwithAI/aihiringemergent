import { useState } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileText, Search, UserCheck, FolderOpen, Building2, ArrowLeft, Loader2, Copy, Download } from "lucide-react";

const TOOLS = [
  { id: "jd-builder", icon: FileText, title: "JD Builder", desc: "Generate professional job descriptions", placeholder: "Describe the role: e.g., 'VP of Engineering for a Series B fintech startup, 200 employees, remote-first...'", color: "bg-violet-50 text-violet-600 border-violet-100" },
  { id: "search-strategy", icon: Search, title: "Search Strategy", desc: "Create comprehensive candidate search strategies", placeholder: "Describe who you're looking for: e.g., 'We need a Chief Marketing Officer for a D2C healthcare brand expanding to Europe...'", color: "bg-blue-50 text-blue-600 border-blue-100" },
  { id: "candidate-research", icon: UserCheck, title: "Candidate Research", desc: "Deep research on candidate profiles", placeholder: "Describe the candidate or profile: e.g., 'Research a candidate who is currently VP of Sales at a SaaS unicorn, 15 years experience...'", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { id: "dossier", icon: FolderOpen, title: "Candidate Dossier", desc: "Create presentation-ready candidate dossiers", placeholder: "Provide candidate details: e.g., 'Create a dossier for John Smith, currently CTO at TechCorp, 20 years in enterprise software...'", color: "bg-amber-50 text-amber-600 border-amber-100" },
  { id: "client-research", icon: Building2, title: "Client Research", desc: "Research potential client companies", placeholder: "Describe the company: e.g., 'Research Acme Corp, a mid-market cybersecurity firm recently funded Series C at $200M...'", color: "bg-rose-50 text-rose-600 border-rose-100" },
];

export default function AITools() {
  const [selectedTool, setSelectedTool] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Please provide input"); return; }
    setGenerating(true);
    setResult("");
    try {
      const res = await axios.post(`${API}/ai/generate`, {
        tool_type: selectedTool.id,
        prompt: prompt,
        context: context,
      }, { withCredentials: true });
      setResult(res.data.response);
      toast.success("Generated successfully! +2 XP earned");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard");
  };

  const downloadAsText = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTool?.id}-output.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Format AI output - convert markdown-like text to HTML
  const formatOutput = (text) => {
    if (!text) return "";
    return text
      .replace(/###\s(.+)/g, '<h3>$1</h3>')
      .replace(/##\s(.+)/g, '<h2>$1</h2>')
      .replace(/#\s(.+)/g, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n- /g, '\n<li>')
      .replace(/\n\d+\.\s/g, '\n<li>')
      .replace(/\n/g, '<br/>');
  };

  if (!selectedTool) {
    return (
      <div className="min-h-screen bg-[#FAFAF9]" data-testid="ai-tools-page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 animate-float-in">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 font-[Outfit]">AI Tools Hub</h1>
            <p className="text-base text-stone-500 mt-1">Powered by GPT-5.2 - Your recruiting intelligence arsenal</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOOLS.map((tool, i) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool)}
                className={`text-left bg-white rounded-xl border border-stone-200 p-6 card-hover tool-card-gradient group animate-float-in stagger-${i + 1}`}
                data-testid={`tool-card-${tool.id}`}
              >
                <div className={`w-12 h-12 rounded-xl ${tool.color} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <tool.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-stone-900 font-[Outfit] mb-1">{tool.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{tool.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Use tool <span className="ml-0.5">&#8594;</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]" data-testid="ai-tool-workspace">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => { setSelectedTool(null); setResult(""); setPrompt(""); setContext(""); }} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors mb-6" data-testid="back-to-tools">
          <ArrowLeft className="w-4 h-4" /> Back to AI Tools
        </button>

        <div className="bg-white rounded-xl border border-stone-200 p-6 md:p-8 animate-float-in">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-lg ${selectedTool.color} border flex items-center justify-center`}>
              <selectedTool.icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-900 font-[Outfit]">{selectedTool.title}</h2>
              <p className="text-sm text-stone-500">{selectedTool.desc}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-stone-700 mb-1.5 block">Main Input</label>
              <Textarea
                data-testid="ai-tool-prompt"
                placeholder={selectedTool.placeholder}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] rounded-lg resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 mb-1.5 block">Additional Context <span className="text-stone-400">(optional)</span></label>
              <Input
                data-testid="ai-tool-context"
                placeholder="Any additional details, company info, or preferences..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <Button
              data-testid="ai-generate-btn"
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="rounded-full px-8 bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-primary/25 transition-all duration-300"
            >
              {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : "Generate"}
            </Button>
          </div>
        </div>

        {/* Result */}
        {(result || generating) && (
          <div className="mt-6 bg-white rounded-xl border border-stone-200 p-6 md:p-8 animate-float-in" data-testid="ai-result-panel">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-900 font-[Outfit]">Generated Output</h3>
              {result && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard} className="rounded-full text-xs" data-testid="copy-result-btn">
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadAsText} className="rounded-full text-xs" data-testid="download-result-btn">
                    <Download className="w-3 h-3 mr-1" /> Download
                  </Button>
                </div>
              )}
            </div>
            {generating ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-stone-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating with GPT-5.2...</span>
                </div>
              </div>
            ) : (
              <div className="ai-output text-sm text-stone-700 leading-relaxed whitespace-pre-wrap" data-testid="ai-result-content" dangerouslySetInnerHTML={{ __html: formatOutput(result) }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
