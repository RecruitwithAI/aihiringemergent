import { ArrowLeft } from "lucide-react";
import ToolForm from "@/components/ai-tools/ToolForm";
import FileUploader from "@/components/ai-tools/FileUploader";
import OutputDisplay from "@/components/ai-tools/OutputDisplay";
import HistoryPanel from "@/components/ai-tools/HistoryPanel";
import TalentScoutTool from "@/components/ai-tools/TalentScoutTool";
import OutputTypeSelector from "@/components/ai-tools/OutputTypeSelector";

const TOOL_DESCRIPTIONS = {
  "jd-builder": "Create professional job descriptions",
  "search-strategy": "Develop targeted candidate search plans",
  "candidate-research": "Analyze candidate backgrounds and fit",
  "dossier": "Compile candidate profile — upload docs for context",
  "client-research": "Research companies and stakeholders",
};

export default function ToolWorkspace({ state }) {
  const {
    selectedTool, selectTool,
    prompt, setPrompt, context, setContext, result, generating,
    outputType, setOutputType,
    uploadedFiles, uploading, uploadProgress, expandedFileIdx,
    handleFilesDrop, removeFile, clearAllFiles, toggleFileExpand,
    outputFormatFile, setOutputFormatFile, uploadingFormat, formatUploadProgress,
    handleFormatFileDrop,
    isEditing, editBuffer, setEditBuffer, startEdit, saveEdit, cancelEdit,
    downloading, handleDownload,
    history, historyOpen, setHistoryOpen, loadingHistory, loadFromHistory,
    handleGenerate,
  } = state;

  const supportsFileUpload = selectedTool.id === "jd-builder" || selectedTool.id === "dossier";

  return (
    <div className="min-h-screen bg-[#090914] px-4 sm:px-6 lg:px-8 py-8 ai-tool-workspace">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back */}
        <button
          onClick={() => selectTool(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group back-button"
          data-testid="back-to-tools"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
          <span className="text-sm font-medium">Back to Tools</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 tool-header">
          <div className={`w-14 h-14 rounded-xl ${selectedTool.bg} border ${selectedTool.border} flex items-center justify-center tool-header-icon`}>
            <selectedTool.icon className={`w-7 h-7 ${selectedTool.color}`} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white font-[Lexend] tool-header-title">
              {selectedTool.label}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base tool-header-subtitle">
              {TOOL_DESCRIPTIONS[selectedTool.id] || ""}
            </p>
          </div>
        </div>

        {/* Search Strategy output type */}
        {selectedTool.id === "search-strategy" && (
          <OutputTypeSelector outputType={outputType} onChangeType={setOutputType} />
        )}

        {/* Talent Scout uses its own UI */}
        {selectedTool.id === "talent-scout" ? (
          <TalentScoutTool onGenerate={handleGenerate} onPromptChange={setPrompt} loading={generating} />
        ) : (
          <>
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
          </>
        )}

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
