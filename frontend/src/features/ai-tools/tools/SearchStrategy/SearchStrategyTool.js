import { useState } from 'react';
import { ToolShell, InputSection, OutputSection } from '../../components';
import { themeClasses } from '@/design-system/tokens';

/**
 * Search Strategy Tool
 * Custom tool with output type selector
 * Two modes: "Strategy" or "Target Company List"
 * 
 * @param {Object} props
 * @param {Object} props.toolConfig - Tool configuration from registry
 * @param {Function} props.onBack - Back button handler
 */
export default function SearchStrategyTool({ toolConfig, onBack }) {
  const [outputType, setOutputType] = useState('strategy');
  
  // Override backend type based on selection
  const customToolConfig = {
    ...toolConfig,
    backendType: outputType === 'target-list' ? 'search-strategy-targets' : 'search-strategy'
  };
  
  return (
    <ToolShell toolConfig={customToolConfig} onBack={onBack}>
      {({ generation, download, history, handleGenerate }) => (
        <div className="space-y-6">
          {/* Custom UI: Output Type Selector */}
          <div className={`${themeClasses.card} p-6`}>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Select Output Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setOutputType('strategy')}
                className={`p-4 rounded-xl border transition-all text-left ${
                  outputType === 'strategy'
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    : `${themeClasses.surface} border-border hover:border-primary/30`
                }`}
              >
                <div className="font-medium mb-1">Search Strategy</div>
                <div className="text-xs opacity-75">
                  Concise, actionable search plan
                </div>
              </button>
              <button
                onClick={() => setOutputType('target-list')}
                className={`p-4 rounded-xl border transition-all text-left ${
                  outputType === 'target-list'
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    : `${themeClasses.surface} border-border hover:border-primary/30`
                }`}
              >
                <div className="font-medium mb-1">Target Company List</div>
                <div className="text-xs opacity-75">
                  Tabular list with 15-20 companies
                </div>
              </button>
            </div>
          </div>
          
          {/* Standard Input Section */}
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
          
          {/* Output Section */}
          {generation.result && (
            <OutputSection
              result={generation.result}
              downloading={download.downloading}
              outputFormats={toolConfig.features.outputFormats}
              onDownload={(format) => download.handleDownload(
                generation.result, 
                format, 
                `${toolConfig.label}-${outputType}`
              )}
              toolColor={toolConfig.color}
            />
          )}
        </div>
      )}
    </ToolShell>
  );
}
