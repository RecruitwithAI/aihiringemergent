import { useRef } from "react";
import { Upload, FileIcon, X, Eye, EyeOff } from "lucide-react";

const CARD = "bg-white/[0.04] border border-white/[0.07] rounded-2xl";

export default function FileUploader({
  files,
  uploading,
  uploadProgress,
  expandedFileIdx,
  onFilesDrop,
  onRemoveFile,
  onClearAll,
  onToggleExpand,
  acceptedTypes = ".txt,.pdf,.doc,.docx,.mp3,.wav,.m4a,.ogg,.aac,.flac",
  acceptedLabels = "PDF, Word (.doc/.docx), TXT, or Audio (MP3/WAV/M4A)",
  title = "Upload Context Files",
  subtitle = "Add resumes, job descriptions, or notes to provide context",
  multiple = true,
  maxSizeMB = 10,
}) {
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    onFilesDrop(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    onFilesDrop(selectedFiles);
  };

  return (
    <div className="space-y-4">
      {/* Upload Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className={`${CARD} p-6 border-2 border-dashed border-white/[0.1] hover:border-blue-500/30 hover:bg-white/[0.02] transition-all duration-300 cursor-pointer group`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
          </div>
          
          <div>
            <p className="text-white font-medium mb-1">{title}</p>
            <p className="text-sm text-slate-400">{subtitle}</p>
            <p className="text-xs text-slate-500 mt-2">
              Supported: {acceptedLabels} • Max {maxSizeMB} MB each
            </p>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-1.5 rounded-full transition-all duration-300 bg-blue-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 text-center mt-2">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className={`${CARD} p-4 space-y-2`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-300">
              Uploaded Files ({files.length})
            </p>
            <button
              onClick={onClearAll}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear All
            </button>
          </div>

          {files.map((file, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">
                <FileIcon className="w-4 h-4 text-blue-400 flex-shrink-0" strokeWidth={1.5} />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {file.charCount?.toLocaleString()} characters
                  </p>
                </div>

                <button
                  onClick={() => onToggleExpand(idx)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-white transition-colors"
                  title={expandedFileIdx === idx ? "Hide preview" : "Show preview"}
                >
                  {expandedFileIdx === idx ? (
                    <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                  ) : (
                    <Eye className="w-4 h-4" strokeWidth={1.5} />
                  )}
                </button>

                <button
                  onClick={() => onRemoveFile(idx)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              {/* File Content Preview */}
              {expandedFileIdx === idx && (
                <div className="ml-7 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <p className="text-xs text-slate-400 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {file.extractedText?.substring(0, 1000)}
                    {file.extractedText?.length > 1000 && "..."}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
