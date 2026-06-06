import { ToolShell, InputSection, OutputSection } from '../../components';

/**
 * Client Research Tool
 * Standard tool without file upload
 * Research companies and stakeholders
 * 
 * Features:
 * - Prompt + context inputs
 * - TXT/PDF/DOCX downloads
 * - History tracking
 * 
 * @param {Object} props
 * @param {Object} props.toolConfig - Tool configuration from registry
 * @param {Function} props.onBack - Back button handler
 */
export default function ClientResearchTool({ toolConfig, onBack }) {
  return (
    <ToolShell toolConfig={toolConfig} onBack={onBack}>
      {({ generation, download, history, handleGenerate }) => (
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
