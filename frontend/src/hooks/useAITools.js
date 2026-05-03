import { useState, useRef, useEffect, useCallback } from "react";
import { API } from "@/App";
import axios from "axios";
import { toast } from "sonner";

const CHUNK_SIZE = 1 * 1024 * 1024; // 1 MB

export default function useAITools() {
  const [selectedTool, setSelectedTool] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState("");
  const [generating, setGenerating] = useState(false);
  const [outputType, setOutputType] = useState("strategy");

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [expandedFileIdx, setExpandedFileIdx] = useState(null);

  // Output format file (Candidate Dossier)
  const [outputFormatFile, setOutputFormatFile] = useState(null);
  const [uploadingFormat, setUploadingFormat] = useState(false);
  const [formatUploadProgress, setFormatUploadProgress] = useState(0);

  // Edit / download
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState("");
  const [downloading, setDownloading] = useState(false);

  // History
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fileInputRef = useRef(null);
  const formatFileInputRef = useRef(null);

  // ── Tool selection ──
  const selectTool = useCallback((tool) => {
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
    setOutputType("strategy");
  }, []);

  // ── History ──
  const fetchHistory = useCallback(async () => {
    if (!selectedTool) return;
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API}/ai/history`, { withCredentials: true });
      setHistory(res.data.filter((h) => h.tool_type === selectedTool.id));
    } catch {
      // silent
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedTool]);

  useEffect(() => {
    if (selectedTool) fetchHistory();
  }, [selectedTool, fetchHistory]);

  const loadFromHistory = useCallback((item) => {
    setPrompt(item.prompt);
    setResult(item.response);
    setHistoryOpen(false);
    toast.success("Loaded from history");
  }, []);

  // ── Chunked file upload ──
  const processFile = useCallback(async (file) => {
    const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunk = file.slice(i * CHUNK_SIZE, Math.min((i + 1) * CHUNK_SIZE, file.size));
        const fd = new FormData();
        fd.append("chunk", chunk);
        fd.append("upload_id", uploadId);
        fd.append("chunk_index", i.toString());
        fd.append("total_chunks", totalChunks.toString());
        fd.append("filename", file.name);
        await axios.post(`${API}/ai/upload-chunk`, fd, { withCredentials: true });
        const pct = Math.round(((i + 1) / totalChunks) * 100);
        setUploadProgress(pct);
        setFormatUploadProgress(pct);
      }

      const res = await axios.post(
        `${API}/ai/extract-file`,
        { upload_id: uploadId, filename: file.name },
        { withCredentials: true },
      );
      return { name: file.name, charCount: res.data.char_count, extractedText: res.data.extracted_text };
    } catch (err) {
      toast.error(err.response?.data?.detail || "File processing failed");
      return null;
    }
  }, []);

  const handleFilesDrop = useCallback(async (files) => {
    if (!files?.length) return;
    const allowed = ["txt", "pdf", "doc", "docx", "mp3", "wav", "m4a", "ogg", "aac", "flac"];
    const valid = [];
    for (const f of files) {
      const ext = f.name.split(".").pop().toLowerCase();
      if (!allowed.includes(ext)) { toast.error(`Unsupported type: .${ext}`); continue; }
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} too large. Max 10 MB.`); continue; }
      valid.push(f);
    }
    if (!valid.length) return;

    setUploading(true);
    setUploadProgress(0);
    for (const f of valid) {
      const processed = await processFile(f);
      if (processed) setUploadedFiles((prev) => [...prev, processed]);
    }
    setUploading(false);
    setUploadProgress(0);
    toast.success(`${valid.length} file(s) uploaded`);
  }, [processFile]);

  const handleFormatFileDrop = useCallback(async (files) => {
    if (!files?.length) return;
    const file = files[0];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["txt", "pdf", "doc", "docx"].includes(ext)) {
      toast.error(`Unsupported type: .${ext}`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) { toast.error("Format file too large. Max 10 MB."); return; }

    setUploadingFormat(true);
    setFormatUploadProgress(0);
    const processed = await processFile(file);
    if (processed) { setOutputFormatFile(processed); toast.success("Output format uploaded"); }
    setUploadingFormat(false);
    setFormatUploadProgress(0);
  }, [processFile]);

  const removeFile = useCallback((index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setExpandedFileIdx((prev) => (prev === index ? null : prev > index ? prev - 1 : prev));
  }, []);

  const clearAllFiles = useCallback(() => {
    setUploadedFiles([]);
    setExpandedFileIdx(null);
  }, []);

  const toggleFileExpand = useCallback((idx) => {
    setExpandedFileIdx((prev) => (prev === idx ? null : idx));
  }, []);

  // ── Generate ──
  const handleGenerate = useCallback(async (overridePrompt = null, overrideContext = null) => {
    const actualPrompt = typeof overridePrompt === "string" ? overridePrompt : prompt;
    const actualContext = typeof overrideContext === "string" ? overrideContext : context;
    if (!actualPrompt?.trim()) { toast.error("Please enter a prompt first"); return null; }

    setGenerating(true);
    setResult("");
    setIsEditing(false);

    const fileParts = uploadedFiles.map(
      (f, i) => `--- Context File ${i + 1}: ${f.name} ---\n${f.extractedText}`,
    );

    if (outputFormatFile && selectedTool?.id === "dossier") {
      fileParts.unshift(
        `========================================\n📋 DESIRED OUTPUT FORMAT (CRITICAL - MUST FOLLOW EXACTLY)\n========================================\n\nYOU MUST REPLICATE THIS EXACT FORMAT, STRUCTURE, STYLE, AND SECTION ORDERING:\n\n${outputFormatFile.extractedText}\n\n========================================\nEND OF FORMAT SAMPLE\n========================================\n\nIMPORTANT INSTRUCTIONS:\n- Use the EXACT same section headings as shown above\n- Follow the SAME ordering of sections\n- Match the writing style, tone, and level of detail\n- Use the same formatting approach (bullets, paragraphs, metrics presentation)\n- Preserve any special structure or flow patterns from the sample`,
      );
    }

    const fullContext = [actualContext, ...fileParts].filter(Boolean).join("\n\n");
    let toolType = selectedTool?.id;
    if (toolType === "search-strategy" && outputType === "target-list") toolType = "search-strategy-targets";

    try {
      const res = await axios.post(
        `${API}/ai/generate`,
        { tool_type: toolType, prompt: actualPrompt, context: fullContext },
        { withCredentials: true },
      );
      setResult(res.data.response);
      fetchHistory();
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.detail || "Generation failed");
      return null;
    } finally {
      setGenerating(false);
    }
  }, [prompt, context, uploadedFiles, outputFormatFile, selectedTool, outputType, fetchHistory]);

  // ── Edit ──
  const startEdit = useCallback(() => { setEditBuffer(result); setIsEditing(true); }, [result]);
  const saveEdit = useCallback(() => { setResult(editBuffer); setIsEditing(false); }, [editBuffer]);
  const cancelEdit = useCallback(() => setIsEditing(false), []);

  // ── Download ──
  const handleDownload = useCallback(async (format) => {
    const content = isEditing ? editBuffer : result;
    if (!content) { toast.error("No content to download"); return; }
    setDownloading(true);

    try {
      const filename = `${selectedTool?.label}.${format}`;
      if (format === "txt") {
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 200);
      } else {
        const mimeMap = {
          pdf: "application/pdf",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          csv: "text/csv",
        };
        const res = await axios.post(
          `${API}/ai/download`,
          { content, format, filename },
          { responseType: "blob", withCredentials: true },
        );
        const blob = new Blob([res.data], { type: mimeMap[format] || "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 200);
      }
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch (err) {
      let msg = err.message;
      if (err.response?.data instanceof Blob) msg = await err.response.data.text();
      toast.error(`Download failed: ${msg}`);
    } finally {
      setDownloading(false);
    }
  }, [isEditing, editBuffer, result, selectedTool]);

  return {
    // Tool
    selectedTool, selectTool,
    // Prompt / result
    prompt, setPrompt, context, setContext, result, generating,
    outputType, setOutputType,
    // Files
    uploadedFiles, uploading, uploadProgress, expandedFileIdx,
    handleFilesDrop, removeFile, clearAllFiles, toggleFileExpand,
    fileInputRef,
    // Format file
    outputFormatFile, setOutputFormatFile, uploadingFormat, formatUploadProgress,
    handleFormatFileDrop, formatFileInputRef,
    // Edit
    isEditing, editBuffer, setEditBuffer, startEdit, saveEdit, cancelEdit,
    // Download
    downloading, handleDownload,
    // History
    history, historyOpen, setHistoryOpen, loadingHistory, loadFromHistory,
    // Generate
    handleGenerate,
  };
}
