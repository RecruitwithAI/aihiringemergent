import { ToolShell, InputSection, FileUploadSection, OutputSection } from '../../components';

/**
 * JD Builder Tool
 * Standard tool with file upload capability
 * Creates professional job descriptions
 * 
 * Features:
 * - Prompt + context inputs
 * - File upload for context documents
 * - TXT/PDF/DOCX downloads
 * - History tracking
 * 
 * @param {Object} props
 * @param {Object} props.toolConfig - Tool configuration from registry
 * @param {Function} props.onBack - Back button handler
 */
export default function JDBuilderTool({ toolConfig, onBack }) {
  return (
    <ToolShell toolConfig={toolConfig} onBack={onBack}>
      {({ generation, fileUpload, download, history, handleGenerate }) => (
        <div className="space-y-6">
          {/* Input Section */}
          <InputSection
            prompt={generation.prompt}
            context={generation.context}
            onPromptChange={generation.setPrompt}
            onContextChange={generation.setContext}
            placeholder={toolConfig.placeholder}
            generating={generation.generating}
            onGenerate={handleGenerate}
            onShowHistory={history.openHistory}
            hasHistory={history.history.length > 0}
          />
          
          {/* File Upload Section */}
          <FileUploadSection
            files={fileUpload.uploadedFiles}
            uploading={fileUpload.uploading}
            uploadProgress={fileUpload.uploadProgress}
            expandedFileIdx={fileUpload.expandedFileIdx}
            onFilesDrop={fileUpload.handleFilesDrop}
            onRemoveFile={fileUpload.removeFile}
            onClearAll={fileUpload.clearAllFiles}
            onToggleExpand={fileUpload.toggleFileExpand}
            config={toolConfig.fileUploadConfig}
          />
          
          {/* Output Section - Only show when result exists */}
          {generation.result && (
            <OutputSection
              result={generation.result}
              downloading={download.downloading}
              outputFormats={toolConfig.features.outputFormats}
              onDownload={(format) => download.handleDownload(
                generation.result, 
                format, 
                toolConfig.label
              )}
              toolColor={toolConfig.color}
            />
          )}
        </div>
      )}
    </ToolShell>
  );
}
