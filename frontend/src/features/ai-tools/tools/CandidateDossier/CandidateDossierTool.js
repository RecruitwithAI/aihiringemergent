import { ToolShell, InputSection, FileUploadSection, OutputSection } from '../../components';
import { useFileUpload } from '../../hooks';
import FormatUploader from './FormatUploader';

/**
 * Candidate Dossier Tool
 * Custom tool with two file upload sections:
 * 1. Context files (standard)
 * 2. Format sample file (special - influences output structure)
 * 
 * @param {Object} props
 * @param {Object} props.toolConfig - Tool configuration from registry
 * @param {Function} props.onBack - Back button handler
 */
export default function CandidateDossierTool({ toolConfig, onBack }) {
  // Special: Format file upload (separate from context files)
  const formatUpload = useFileUpload(toolConfig.formatUploadConfig);
  
  return (
    <ToolShell toolConfig={toolConfig} onBack={onBack}>
      {({ generation, fileUpload, download, history, handleGenerate }) => {
        
        // Override handleGenerate to include format file in context
        const handleGenerateWithFormat = async () => {
          let fullContext = generation.context;
          
          // Prepend format sample if uploaded
          if (formatUpload.uploadedFiles.length > 0) {
            const formatText = formatUpload.uploadedFiles[0].extractedText;
            fullContext = `========================================
📋 DESIRED OUTPUT FORMAT (CRITICAL - MUST FOLLOW EXACTLY)
========================================

YOU MUST REPLICATE THIS EXACT FORMAT, STRUCTURE, STYLE, AND SECTION ORDERING:

${formatText}

========================================
END OF FORMAT SAMPLE
========================================

IMPORTANT INSTRUCTIONS:
- Use the EXACT same section headings as shown above
- Follow the SAME ordering of sections
- Match the writing style, tone, and level of detail
- Use the same formatting approach (bullets, paragraphs, metrics presentation)
- Preserve any special structure or flow patterns from the sample

${fullContext}`;
          }
          
          return handleGenerate(null, fullContext);
        };
        
        return (
          <div className="space-y-6">
            {/* Standard Input Section */}
            <InputSection
              prompt={generation.prompt}
              context={generation.context}
              onPromptChange={generation.setPrompt}
              onContextChange={generation.setContext}
              placeholder={toolConfig.placeholder}
              generating={generation.generating}
              onGenerate={handleGenerateWithFormat}
              onShowHistory={history.openHistory}
              hasHistory={history.history.length > 0}
            />
            
            {/* Standard Context Files Upload */}
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
            
            {/* Custom: Format File Uploader */}
            <FormatUploader
              file={formatUpload.uploadedFiles[0]}
              uploading={formatUpload.uploading}
              uploadProgress={formatUpload.uploadProgress}
              onFilesDrop={formatUpload.handleFilesDrop}
              onRemove={() => formatUpload.clearAllFiles()}
            />
            
            {/* Output Section */}
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
        );
      }}
    </ToolShell>
  );
}
