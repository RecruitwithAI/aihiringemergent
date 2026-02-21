import { useState, useRef, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Brain, FileText, Search, UserSearch, BookUser, Building2,
  ArrowLeft, Sparkles, Download, Edit3, Check, X, Upload,
  File as FileIcon, ChevronDown, Loader2, Eye, EyeOff, History, Clock
} from "lucide-react";

const TOOLS = [
  { id: "jd-builder",        icon: FileText,   label: "JD Builder",       color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20",  prompt: "Role title, seniority, key responsibilities..." },
  { id: "search-strategy",   icon: Search,     label: "Search Strategy",  color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20",  prompt: "Target role, industry, location, key skills..." },
  { id: "candidate-research",icon: UserSearch, label: "Candidate Research",color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20",prompt: "Candidate name, LinkedIn URL, or background..." },
  { id: "dossier",           icon: BookUser,   label: "Candidate Dossier",color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20", prompt: "Candidate name, role, company, experience notes..." },
  { id: "client-research",   icon: Building2,  label: "Client Research",  color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20",prompt: "Company name, industry, HQ location..." },
];

const CARD = "bg-white/[0.04] border border-white/[0.07] rounded-2xl";
const CHUNK_SIZE = 1 * 1024 * 1024; // 1 MB

const ACCEPTED = ".txt,.pdf,.doc,.docx,.mp3,.wav,.m4a,.ogg,.aac,.flac";
const ACCEPTED_LABELS = "PDF, Word (.doc/.docx), TXT, or Audio (MP3/WAV/M4A)";

export default function AITools() {
  const { user } = useAuth();
  const [selectedTool, setSelectedTool] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState("");
  const [generating, setGenerating] = useState(false);

  // Multi-file upload state
  const [uploadedFiles, setUploadedFiles] = useState([]); // [{ name, charCount, extractedText }]
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [expandedFileIdx, setExpandedFileIdx] = useState(null);

  // edit/download state
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState("");
  const [downloading, setDownloading] = useState(false);

  // History state
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fileInputRef = useRef(null);

  const selectTool = (tool) => {
    setSelectedTool(tool);
    setPrompt(""); setContext(""); setResult("");
    setUploadedFiles([]);
    setIsEditing(false); setEditBuffer(""); setUploadProgress(0);
    setExpandedFileIdx(null);
  };

  // Fetch history when tool is selected
  useEffect(() => {
    if (selectedTool) {
      fetchHistory();
    }
  }, [selectedTool]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API}/ai/history`, { withCredentials: true });
      // Filter history for current tool
      const filtered = res.data.filter(h => h.tool_type === selectedTool.id);
      setHistory(filtered);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadFromHistory = (historyItem) => {
    setPrompt(historyItem.prompt);
    setResult(historyItem.response);
    setHistoryOpen(false);
    toast.success("Loaded from history");
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    if (expandedFileIdx === index) setExpandedFileIdx(null);
    else if (expandedFileIdx > index) setExpandedFileIdx(expandedFileIdx - 1);
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setExpandedFileIdx(null);
  };

  // ── Chunked Upload for single file ──
  const processFile = async (file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    const allowed = ["txt","pdf","doc","docx","mp3","wav","m4a","ogg","aac","flac"];
    if (!allowed.includes(ext)) {
      toast.error(`Unsupported type: .${ext}. Allowed: ${allowed.join(", ")}`);
      return null;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error(`${file.name} is too large. Max 25 MB.`);
      return null;
    }

    const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    try {
      for (let i = 0; i < totalChunks; i++) {
        const slice = file.slice(i * CHUNK_SIZE, Math.min((i + 1) * CHUNK_SIZE, file.size));
        const fd = new FormData();
        fd.append("chunk", slice, file.name);
        fd.append("upload_id", uploadId);
        fd.append("chunk_index", String(i));
        fd.append("total_chunks", String(totalChunks));
        fd.append("filename", file.name);
        await axios.post(`${API}/ai/upload-chunk`, fd, { withCredentials: true });
      }

      const res = await axios.post(`${API}/ai/extract-file`, { upload_id: uploadId, filename: file.name }, { withCredentials: true });
      return {
        name: file.name,
        charCount: res.data.char_count,
        extractedText: res.data.extracted_text,
      };
    } catch (err) {
      toast.error(`Failed to process ${file.name}: ${err.response?.data?.detail || "Unknown error"}`);
      return null;
    }
  };

  // ── Handle multiple file drops ──
  const handleFileDrop = async (files) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const maxFiles = 5;
    
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      toast.error(`You can upload up to ${maxFiles} files. You have ${uploadedFiles.length} already.`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const results = [];
    for (let i = 0; i < fileArray.length; i++) {
      setUploadProgress(Math.round(((i) / fileArray.length) * 80));
      const processed = await processFile(fileArray[i]);
      if (processed) results.push(processed);
      setUploadProgress(Math.round(((i + 1) / fileArray.length) * 100));
    }

    if (results.length > 0) {
      setUploadedFiles(prev => [...prev, ...results]);
      toast.success(`${results.length} file(s) processed successfully`);
    }

    setUploading(false);
    setUploadProgress(0);
  };

  // ── Generate ──
  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt first"); return; }
    setGenerating(true); setResult(""); setIsEditing(false);

    // Combine all uploaded file contents
    const fileContextParts = uploadedFiles.map((f, i) => 
      `--- File ${i + 1}: ${f.name} ---\n${f.extractedText}`
    );
    const fullContext = [context, ...fileContextParts].filter(Boolean).join("\n\n");

    try {
      const res = await axios.post(`${API}/ai/generate`, { tool_type: selectedTool.id, prompt, context: fullContext }, { withCredentials: true });
      setResult(res.data.response);
      // Refresh history after generating
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  // ── Edit ──
  const startEdit = () => { setEditBuffer(result); setIsEditing(true); };
  const saveEdit  = () => { setResult(editBuffer); setIsEditing(false); };
  const cancelEdit= () => { setIsEditing(false); };

  // ── Download ──
  const handleDownload = async (format) => {
    const content = isEditing ? editBuffer : result;
    if (!content) return;
    setDownloading(true);
    
    try {
      const filename = `${selectedTool.label}.${format}`;
      
      if (format === "txt") {
        // For text, create blob directly
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        saveAs(blob, filename);
      } else {
        // For PDF/DOCX, fetch from server
        const res = await axios.post(`${API}/ai/download`,
          { content, format, filename: selectedTool.label },
          { withCredentials: true, responseType: "blob" }
        );
        saveAs(res.data, filename);
      }
      toast.success(`Downloaded ${filename}`);
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Download failed - please try again");
    } finally {
      setDownloading(false);
    }
  };

  // ── Markdown Render (basic) ──
  const renderMarkdown = (text) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.trim() === "---") return <hr key={i} className="border-white/[0.10] my-3" />;
      if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold text-white mt-4 mb-1">{line.slice(4)}</h3>;
      if (line.startsWith("## "))  return <h2 key={i} className="text-lg font-semibold text-white mt-5 mb-1.5">{line.slice(3)}</h2>;
      if (line.startsWith("# "))   return <h1 key={i} className="text-xl font-bold text-white mt-6 mb-2">{line.slice(2)}</h1>;
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return <li key={i} className="text-slate-300 text-sm ml-4 list-disc">{parseBold(line.slice(2))}</li>;
      }
      if (!line.trim()) return <br key={i} />;
      return <p key={i} className="text-slate-300 text-sm leading-relaxed">{parseBold(line)}</p>;
    });
  };

  const parseBold = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/);
    return parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{p}</strong> : p);
  };

  // ── Tool Grid ──
  if (!selectedTool) {
    return (
      <div className="min-h-screen bg-[#090914]" data-testid="ai-tools-page">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs text-blue-400/60 uppercase tracking-widest mb-2">
              <Brain className="w-3 h-3" strokeWidth={1.5} /> AI Tools
            </div>
            <h1 className="text-3xl font-semibold font-[Lexend] text-white">AI Tools</h1>
            <p className="text-slate-400 text-sm mt-1">Choose a tool to get started</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => selectTool(tool)}
                className={`${CARD} p-6 text-left hover:border-blue-500/30 hover:bg-white/[0.06] transition-all duration-300 group`}
                data-testid={`tool-card-${tool.id}`}
              >
                <div className={`w-10 h-10 rounded-xl ${tool.bg} border ${tool.border} flex items-center justify-center mb-4`}>
                  <tool.icon className={`w-5 h-5 ${tool.color}`} strokeWidth={1.5} />
                </div>
                <p className="text-base font-semibold text-white font-[Lexend]">{tool.label}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {tool.id === "jd-builder" ? "Build job descriptions — upload docs for context" :
                   tool.id === "search-strategy" ? "Boolean strings, channel maps, targeting" :
                   tool.id === "candidate-research" ? "Research background & fit" :
                   tool.id === "dossier" ? "Compile candidate profile — upload docs for context" :
                   "Research company intel"}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const supportsFileUpload = selectedTool.id === "jd-builder" || selectedTool.id === "dossier";

  return (
    <div className="min-h-screen bg-[#090914]" data-testid="ai-tool-detail">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back */}
        <button
          onClick={() => setSelectedTool(null)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-6 transition-colors"
          data-testid="back-to-tools"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> All Tools
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`w-10 h-10 rounded-xl ${selectedTool.bg} border ${selectedTool.border} flex items-center justify-center`}>
            <selectedTool.icon className={`w-5 h-5 ${selectedTool.color}`} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white font-[Lexend]">{selectedTool.label}</h1>
            <p className="text-xs text-slate-500">Powered by GPT-5.2</p>
          </div>
        </div>

        {/* Input Area */}
        <div className={`${CARD} p-6 mb-5`}>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Prompt</Label>
              <Textarea
                data-testid="tool-prompt-input"
                placeholder={selectedTool.prompt}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="bg-white/[0.05] border-white/[0.10] text-white placeholder:text-slate-600 focus-visible:border-blue-500/50 resize-none"
              />
            </div>

            <div>
              <Label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Additional Context (optional)</Label>
              <Input
                data-testid="tool-context-input"
                placeholder="Any extra context, constraints, tone preferences..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="bg-white/[0.05] border-white/[0.10] text-white placeholder:text-slate-600 focus-visible:border-blue-500/50"
              />
            </div>

            {/* Multi-File Upload — JD Builder and Dossier */}
            {supportsFileUpload && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-slate-400 text-xs uppercase tracking-wider">
                    Upload Files for Context (max 5)
                  </Label>
                  {uploadedFiles.length > 0 && (
                    <button
                      onClick={clearAllFiles}
                      className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                      data-testid="clear-all-files"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Uploaded files list */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 mb-3" data-testid="uploaded-files-list">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg ${selectedTool.bg} border ${selectedTool.border} flex items-center justify-center`}>
                              <FileIcon className={`w-4 h-4 ${selectedTool.color}`} strokeWidth={1.5} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white truncate max-w-[200px]">{file.name}</p>
                              <p className="text-xs text-slate-500">{file.charCount.toLocaleString()} chars</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedFileIdx(expandedFileIdx === idx ? null : idx)}
                              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                              data-testid={`toggle-preview-${idx}`}
                            >
                              {expandedFileIdx === idx ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              {expandedFileIdx === idx ? "Hide" : "Preview"}
                            </button>
                            <button
                              onClick={() => removeFile(idx)}
                              className="text-slate-600 hover:text-red-400 transition-colors"
                              data-testid={`remove-file-${idx}`}
                            >
                              <X className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                        {expandedFileIdx === idx && (
                          <div className="mt-3 bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 max-h-32 overflow-y-auto">
                            <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
                              {file.extractedText.slice(0, 500)}{file.charCount > 500 ? "..." : ""}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Drop zone */}
                {uploadedFiles.length < 5 && (
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${uploading ? `${selectedTool.border} ${selectedTool.bg}` : "border-white/[0.10] hover:border-white/[0.20] hover:bg-white/[0.04]"}`}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleFileDrop(e.dataTransfer.files); }}
                    data-testid="file-upload-zone"
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className={`w-6 h-6 ${selectedTool.color} animate-spin`} strokeWidth={1.5} />
                        <p className={`text-sm ${selectedTool.color} font-medium`}>Processing files... {uploadProgress}%</p>
                        <div className="w-full max-w-[200px] bg-white/[0.06] rounded-full h-1.5 overflow-hidden mt-1">
                          <div className={`h-1.5 rounded-full transition-all duration-300 ${selectedTool.id === "dossier" ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-600 mx-auto mb-2" strokeWidth={1.5} />
                        <p className="text-sm text-slate-400 font-medium">
                          Drag & drop or <span className={selectedTool.color}>click to upload</span>
                        </p>
                        <p className="text-xs text-slate-600 mt-1">{ACCEPTED_LABELS} · Max 25 MB each</p>
                        {uploadedFiles.length > 0 && (
                          <p className="text-xs text-slate-500 mt-2">{uploadedFiles.length}/5 files uploaded</p>
                        )}
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED}
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileDrop(e.target.files)}
                      data-testid="file-input"
                    />
                  </div>
                )}
              </div>
            )}

          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="mt-5 flex items-center gap-2 px-6 h-10 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-blue-500/20"
            data-testid="generate-btn"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> : <Sparkles className="w-4 h-4" strokeWidth={1.5} />}
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>

        {/* Result Area */}
        {result && (
          <div className={`${CARD} p-6`} data-testid="ai-result">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Generated Output</p>
              <div className="flex items-center gap-2">

                {/* Edit / Save / Cancel */}
                {!isEditing ? (
                  <button
                    onClick={startEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white text-xs font-medium transition-all"
                    data-testid="edit-btn"
                  >
                    <Edit3 className="w-3 h-3" strokeWidth={1.5} /> Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={saveEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-xs font-medium transition-all"
                      data-testid="save-edit-btn"
                    >
                      <Check className="w-3 h-3" strokeWidth={2} /> Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-500 hover:text-white text-xs transition-all"
                      data-testid="cancel-edit-btn"
                    >
                      <X className="w-3 h-3" strokeWidth={2} /> Cancel
                    </button>
                  </>
                )}

                {/* Download Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      disabled={downloading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white text-xs font-medium transition-all disabled:opacity-50"
                      data-testid="download-btn"
                    >
                      {downloading ? <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} /> : <Download className="w-3 h-3" strokeWidth={1.5} />}
                      Download <ChevronDown className="w-3 h-3" strokeWidth={2} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => handleDownload("docx")} data-testid="download-docx">
                      <FileText className="w-4 h-4 mr-2 text-blue-400" strokeWidth={1.5} /> Word (.docx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload("pdf")} data-testid="download-pdf">
                      <FileIcon className="w-4 h-4 mr-2 text-red-400" strokeWidth={1.5} /> PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload("txt")} data-testid="download-txt">
                      <FileText className="w-4 h-4 mr-2 text-slate-400" strokeWidth={1.5} /> Text (.txt)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

              </div>
            </div>

            {isEditing ? (
              <Textarea
                data-testid="edit-textarea"
                value={editBuffer}
                onChange={(e) => setEditBuffer(e.target.value)}
                rows={20}
                className="bg-white/[0.03] border-white/[0.10] text-slate-200 text-sm font-mono resize-y focus-visible:border-blue-500/50"
              />
            ) : (
              <div className="prose-sm prose-invert max-w-none space-y-1" data-testid="result-content">
                {renderMarkdown(result)}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
