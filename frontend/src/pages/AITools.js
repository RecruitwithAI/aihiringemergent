import { useState, useRef, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, FileText, Search, UserSearch, BookUser, Building2 } from "lucide-react";

// Import refactored components
import ToolSelector from "@/components/ai-tools/ToolSelector";
import ToolForm from "@/components/ai-tools/ToolForm";
import FileUploader from "@/components/ai-tools/FileUploader";
import OutputDisplay from "@/components/ai-tools/OutputDisplay";
import HistoryPanel from "@/components/ai-tools/HistoryPanel";

const TOOLS = [
  { id: "jd-builder",        icon: FileText,   label: "JD Builder",       color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20",  prompt: "Role title, seniority, key responsibilities..." },
  { id: "search-strategy",   icon: Search,     label: "Search Strategy",  color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20",  prompt: "Target role, industry, location, key skills..." },
  { id: "candidate-research",icon: UserSearch, label: "Candidate Research",color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20",prompt: "Candidate name, LinkedIn URL, or background..." },
  { id: "dossier",           icon: BookUser,   label: "Candidate Dossier",color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20", prompt: "Candidate name, role, company, experience notes..." },
  { id: "client-research",   icon: Building2,  label: "Client Research",  color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20",prompt: "Company name, industry, HQ location..." },
];

const CHUNK_SIZE = 1 * 1024 * 1024; // 1 MB

export default function AITools() {
  const { user } = useAuth();
  const [selectedTool, setSelectedTool] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState("");
  const [generating, setGenerating] = useState(false);
  
  // Search Strategy output type selection
  const [outputType, setOutputType] = useState("strategy"); // "strategy" or "target-list"

  // Multi-file upload state (for context)
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [expandedFileIdx, setExpandedFileIdx] = useState(null);

  // Output format file upload state (for Candidate Dossier)
  const [outputFormatFile, setOutputFormatFile] = useState(null);
  const [uploadingFormat, setUploadingFormat] = useState(false);
  const [formatUploadProgress, setFormatUploadProgress] = useState(0);

  // edit/download state
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState("");
  const [downloading, setDownloading] = useState(false);

  // History state
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fileInputRef = useRef(null);
  const formatFileInputRef = useRef(null);

  const selectTool = (tool) => {
    setSelectedTool(tool);
    setPrompt("");
    setContext("");
    setResult("");
    setUploadedFiles([]);
    setOutputFormatFile(null);
    setIsEditing(false);
    setEditBuffer("");
    setUploadProgress(0);
    setExpandedFileIdx(null);
    setOutputType("strategy"); // Reset output type
  };

  // Fetch history when tool is selected
  useEffect(() => {
    if (selectedTool) {
      fetchHistory();
    }
  }, [selectedTool]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API}/ai/history`, { withCredentials: true });
      const filtered = res.data.filter((h) => h.tool_type === selectedTool.id);
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

  // ── File Processing (Chunked Upload) ──
  const processFile = async (file) => {
    const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    try {
      // Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("upload_id", uploadId);
        formData.append("chunk_index", i.toString());
        formData.append("total_chunks", totalChunks.toString());
        formData.append("filename", file.name);

        await axios.post(`${API}/ai/upload-chunk`, formData, { withCredentials: true });

        const progress = Math.round(((i + 1) / totalChunks) * 100);
        setUploadProgress(progress);
        setFormatUploadProgress(progress);
      }

      // Extract file
      const res = await axios.post(
        `${API}/ai/extract-file`,
        { upload_id: uploadId, filename: file.name },
        { withCredentials: true }
      );

      return {
        name: file.name,
        charCount: res.data.char_count,
        extractedText: res.data.extracted_text,
      };
    } catch (err) {
      toast.error(err.response?.data?.detail || "File processing failed");
      return null;
    }
  };

  // ── Context File Upload ──
  const handleFilesDrop = async (files) => {
    if (!files || files.length === 0) return;

    const validFiles = [];
    for (const file of files) {
      const ext = file.name.split(".").pop().toLowerCase();
      const allowed = ["txt", "pdf", "doc", "docx", "mp3", "wav", "m4a", "ogg", "aac", "flac"];

      if (!allowed.includes(ext)) {
        toast.error(`Unsupported type: .${ext}`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 10 MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    for (const file of validFiles) {
      const processed = await processFile(file);
      if (processed) {
        setUploadedFiles((prev) => [...prev, processed]);
      }
    }

    setUploading(false);
    setUploadProgress(0);
    toast.success(`${validFiles.length} file(s) uploaded successfully`);
  };

  // ── Output Format File Upload (for Candidate Dossier) ──
  const handleFormatFileDrop = async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // Only one format file allowed
    const ext = file.name.split(".").pop().toLowerCase();
    const allowed = ["txt", "pdf", "doc", "docx"];

    if (!allowed.includes(ext)) {
      toast.error(`Unsupported type: .${ext}. For format, use: PDF, Word, or TXT`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(`Format file too large. Max 10 MB.`);
      return;
    }

    setUploadingFormat(true);
    setFormatUploadProgress(0);

    const processed = await processFile(file);

    if (processed) {
      setOutputFormatFile(processed);
      toast.success("Output format uploaded successfully");
    }

    setUploadingFormat(false);
    setFormatUploadProgress(0);
  };

  // ── Generate ──
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt first");
      return;
    }
    setGenerating(true);
    setResult("");
    setIsEditing(false);

    // Combine all uploaded file contents for context
    const fileContextParts = uploadedFiles.map(
      (f, i) => `--- Context File ${i + 1}: ${f.name} ---\n${f.extractedText}`
    );

    // Add output format if provided (for Candidate Dossier) - with STRONG emphasis
    if (outputFormatFile && selectedTool.id === "dossier") {
      fileContextParts.unshift(
        `========================================
📋 DESIRED OUTPUT FORMAT (CRITICAL - MUST FOLLOW EXACTLY)
========================================

YOU MUST REPLICATE THIS EXACT FORMAT, STRUCTURE, STYLE, AND SECTION ORDERING:

${outputFormatFile.extractedText}

========================================
END OF FORMAT SAMPLE
========================================

IMPORTANT INSTRUCTIONS:
- Use the EXACT same section headings as shown above
- Follow the SAME ordering of sections
- Match the writing style, tone, and level of detail
- Use the same formatting approach (bullets, paragraphs, metrics presentation)
- Preserve any special structure or flow patterns from the sample`
      );
    }

    const fullContext = [context, ...fileContextParts].filter(Boolean).join("\n\n");
    
    // Determine the actual tool type to send to backend
    let toolType = selectedTool.id;
    if (selectedTool.id === "search-strategy" && outputType === "target-list") {
      toolType = "search-strategy-targets";
    }

    try {
      const res = await axios.post(
        `${API}/ai/generate`,
        { tool_type: toolType, prompt, context: fullContext },
        { withCredentials: true }
      );
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
  const startEdit = () => {
    setEditBuffer(result);
    setIsEditing(true);
  };
  const saveEdit = () => {
    setResult(editBuffer);
    setIsEditing(false);
  };
  const cancelEdit = () => {
    setIsEditing(false);
  };

  // ── Download ──
  const handleDownload = async (format) => {
    const content = isEditing ? editBuffer : result;
    if (!content) {
      toast.error("No content to download");
      return;
    }
    setDownloading(true);

    try {
      const filename = `${selectedTool.label}.${format}`;
      console.log(`[DOWNLOAD] Starting download: ${format}, filename: ${filename}, content length: ${content.length}`);

      if (format === "txt") {
        // TXT: Create blob and trigger download directly
        console.log("[DOWNLOAD] Creating TXT blob...");
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        console.log("[DOWNLOAD] Blob created, size:", blob.size);
        
        const url = window.URL.createObjectURL(blob);
        console.log("[DOWNLOAD] Object URL created:", url);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        console.log("[DOWNLOAD] Link appended to body, triggering click...");
        
        // Force click with timeout
        setTimeout(() => {
          link.click();
          console.log("[DOWNLOAD] Click triggered");
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            console.log("[DOWNLOAD] Cleanup complete");
          }, 100);
        }, 0);
        
        toast.success(`Downloaded as ${format.toUpperCase()}`);
      } else {
        // PDF/DOCX: Get from backend
        console.log("[DOWNLOAD] Requesting from backend...");
        const res = await axios.post(
          `${API}/ai/download`,
          { content, format, filename },
          { responseType: "blob", withCredentials: true }
        );
        console.log(`[DOWNLOAD] Response received, size: ${res.data.size} bytes, type: ${res.data.type}`);
        
        // Verify we got a blob
        if (!(res.data instanceof Blob)) {
          throw new Error("Response is not a Blob");
        }
        
        // Create download link
        const url = window.URL.createObjectURL(res.data);
        console.log("[DOWNLOAD] Object URL created:", url);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        console.log("[DOWNLOAD] Link appended, triggering click...");
        
        // Force click with timeout
        setTimeout(() => {
          link.click();
          console.log("[DOWNLOAD] Click triggered");
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            console.log("[DOWNLOAD] Cleanup complete");
          }, 100);
        }, 0);
        
        toast.success(`Downloaded as ${format.toUpperCase()}`);
      }
    } catch (err) {
      console.error("[DOWNLOAD] Error:", err);
      console.error("[DOWNLOAD] Error stack:", err.stack);
      let errorMsg = err.message;
      if (err.response?.data instanceof Blob) {
        errorMsg = await err.response.data.text();
      }
      toast.error(`Download failed: ${errorMsg}`);
    } finally {
      setDownloading(false);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    if (expandedFileIdx === index) setExpandedFileIdx(null);
    else if (expandedFileIdx > index) setExpandedFileIdx(expandedFileIdx - 1);
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setExpandedFileIdx(null);
  };

  const toggleFileExpand = (idx) => {
    setExpandedFileIdx(expandedFileIdx === idx ? null : idx);
  };

  // Show tool selector if no tool selected
  if (!selectedTool) {
    return <ToolSelector tools={TOOLS} onSelectTool={selectTool} />;
  }

  const supportsFileUpload = selectedTool.id === "jd-builder" || selectedTool.id === "dossier";

  return (
    <div className="min-h-screen bg-[#090914] px-4 sm:px-6 lg:px-8 py-8 ai-tool-workspace">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => selectTool(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group back-button"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
          <span className="text-sm font-medium">Back to Tools</span>
        </button>

        {/* Tool Header */}
        <div className="flex items-center gap-4 tool-header">
          <div
            className={`w-14 h-14 rounded-xl ${selectedTool.bg} border ${selectedTool.border} flex items-center justify-center tool-header-icon`}
          >
            <selectedTool.icon className={`w-7 h-7 ${selectedTool.color}`} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white font-[Lexend] tool-header-title">
              {selectedTool.label}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base tool-header-subtitle">
              {selectedTool.id === "jd-builder" && "Create professional job descriptions"}
              {selectedTool.id === "search-strategy" && "Develop targeted candidate search plans"}
              {selectedTool.id === "candidate-research" && "Analyze candidate backgrounds and fit"}
              {selectedTool.id === "dossier" && "Compile candidate profile — upload docs for context"}
              {selectedTool.id === "client-research" && "Research companies and stakeholders"}
            </p>
          </div>
        </div>

        {/* Output Type Selection for Search Strategy */}
        {selectedTool.id === "search-strategy" && (
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4">
            <label className="text-sm font-medium text-slate-300 mb-3 block">Output Type</label>
            <div className="flex gap-3">
              <button
                onClick={() => setOutputType("strategy")}
                className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                  outputType === "strategy"
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                    : "bg-white/[0.02] border-white/[0.08] text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <div className="text-left">
                  <div className="font-medium mb-1">Search Strategy</div>
                  <div className="text-xs opacity-75">Concise, actionable search plan</div>
                </div>
              </button>
              <button
                onClick={() => setOutputType("target-list")}
                className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                  outputType === "target-list"
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                    : "bg-white/[0.02] border-white/[0.08] text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <div className="text-left">
                  <div className="font-medium mb-1">Target Company List</div>
                  <div className="text-xs opacity-75">Tabular list with 15-20 companies</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Tool Form */}
        <ToolForm
          tool={selectedTool}
          prompt={prompt}
          context={context}
          generating={generating}
          onPromptChange={setPrompt}
          onContextChange={setContext}
          onGenerate={handleGenerate}
          onShowHistory={() => setHistoryOpen(true)}
          hasHistory={history.length > 0}
        />

        {/* File Uploads */}
        {supportsFileUpload && (
          <FileUploader
            files={uploadedFiles}
            uploading={uploading}
            uploadProgress={uploadProgress}
            expandedFileIdx={expandedFileIdx}
            onFilesDrop={handleFilesDrop}
            onRemoveFile={removeFile}
            onClearAll={clearAllFiles}
            onToggleExpand={toggleFileExpand}
          />
        )}

        {/* Output Format File Upload (Candidate Dossier only) */}
        {selectedTool.id === "dossier" && (
          <FileUploader
            files={outputFormatFile ? [outputFormatFile] : []}
            uploading={uploadingFormat}
            uploadProgress={formatUploadProgress}
            expandedFileIdx={null}
            onFilesDrop={handleFormatFileDrop}
            onRemoveFile={() => setOutputFormatFile(null)}
            onClearAll={() => setOutputFormatFile(null)}
            onToggleExpand={() => {}}
            acceptedTypes=".txt,.pdf,.doc,.docx"
            acceptedLabels="PDF, Word (.doc/.docx), or TXT"
            title="Upload Sample Output Format"
            subtitle="Provide a sample format for the dossier to follow"
            multiple={false}
            maxSizeMB={10}
          />
        )}

        {/* Output Display */}
        <OutputDisplay
          result={result}
          isEditing={isEditing}
          editBuffer={editBuffer}
          downloading={downloading}
          toolColor={selectedTool.color}
          onStartEdit={startEdit}
          onSaveEdit={saveEdit}
          onCancelEdit={cancelEdit}
          onEditBufferChange={setEditBuffer}
          onDownload={handleDownload}
        />

        {/* History Panel */}
        <HistoryPanel
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          history={history}
          loading={loadingHistory}
          onLoadItem={loadFromHistory}
          toolLabel={selectedTool.label}
        />
      </div>
    </div>
  );
}
