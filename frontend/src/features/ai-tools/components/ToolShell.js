import { ArrowLeft } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { themeClasses } from '@/design-system/tokens';
import { useAIGeneration, useFileUpload, useDownload, useHistory } from '../hooks';
import logger from '@/lib/logger';

/**
 * ToolShell Component
 * Universal wrapper for all AI tools
 * 
 * Provides:
 * - Standard layout with back button and header
 * - All shared hooks (generation, fileUpload, download, history)
 * - Theme-aware styling
 * - Support for custom UI via render props
 * 
 * @param {Object} props
 * @param {Object} props.toolConfig - Tool configuration from registry
 * @param {Function} props.onBack - Callback when back button clicked
 * @param {Function|ReactNode} props.children - Custom tool UI (optional)
 * 
 * @example
 * // Standard tool (no custom UI)
 * <ToolShell toolConfig={config} onBack={handleBack} />
 * 
 * @example
 * // Custom tool with render props
 * <ToolShell toolConfig={config} onBack={handleBack}>
 *   {({ generation, fileUpload, download, history, handleGenerate }) => (
 *     <CustomToolUI {...props} />
 *   )}
 * </ToolShell>
 */
export default function ToolShell({ 
  toolConfig,
  onBack,
  children
}) {
  const { theme } = useTheme();
  
  // Initialize all shared hooks
  const generation = useAIGeneration(toolConfig);
  const fileUpload = useFileUpload(toolConfig?.fileUploadConfig);
  const download = useDownload();
  const history = useHistory(toolConfig?.id);
  
  /**
   * Enhanced generate function that combines file context with manual context
   * Automatically refreshes history after successful generation
   */
  const handleGenerateWithFiles = async (overridePrompt, overrideContext, customToolType) => {
    // Defensive: ignore non-string args (e.g. SyntheticEvent if caller wires onClick directly)
    const safeOverridePrompt = typeof overridePrompt === 'string' ? overridePrompt : undefined;
    const safeOverrideContext = typeof overrideContext === 'string' ? overrideContext : undefined;
    const safeCustomToolType = typeof customToolType === 'string' ? customToolType : undefined;

    // Combine file uploads with context
    const fileContext = fileUpload.getCombinedContext();
    const fullContext = [safeOverrideContext || generation.context, fileContext]
      .filter(Boolean)
      .join('\n\n');
    
    logger.debug('[ToolShell] Generating with combined context:', {
      promptLength: (safeOverridePrompt || generation.prompt).length,
      contextLength: fullContext.length,
      hasFiles: fileUpload.uploadedFiles.length > 0
    });
    
    const result = await generation.handleGenerate(safeOverridePrompt, fullContext, safeCustomToolType);
    
    // Refresh history on success
    if (result) {
      logger.debug('[ToolShell] Generation successful, refreshing history');
      history.refreshHistory();
    }
    
    return result;
  };
  
  /**
   * Enhanced download function with automatic filename from tool label
   */
  const handleDownloadWithLabel = (format) => {
    const filename = toolConfig?.label?.replace(/\s+/g, '-').toLowerCase() || 'document';
    return download.handleDownload(generation.result, format, filename);
  };
  
  // Create props object to pass to children
  const childProps = {
    generation,
    fileUpload,
    download,
    history,
    handleGenerate: handleGenerateWithFiles,
    handleDownload: handleDownloadWithLabel
  };
  
  return (
    <div className={themeClasses.page}>
      <div className={themeClasses.container}>
        <div className="space-y-6">
          {/* Back Button */}
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft 
              className="w-4 h-4 group-hover:-translate-x-1 transition-transform" 
              strokeWidth={1.5} 
            />
            <span className="text-sm font-medium">Back to Tools</span>
          </button>
          
          {/* Tool Header */}
          <div className="flex items-center gap-4">
            <div 
              className={`w-14 h-14 rounded-xl ${toolConfig?.bg || 'bg-primary/10'} border ${toolConfig?.border || 'border-primary/20'} flex items-center justify-center`}
            >
              {toolConfig?.icon && (
                <toolConfig.icon 
                  className={`w-7 h-7 ${toolConfig?.color || 'text-primary'}`} 
                  strokeWidth={1.5} 
                />
              )}
            </div>
            <div>
              <h1 className={`text-2xl sm:text-3xl font-semibold ${themeClasses.heading}`}>
                {toolConfig?.label || 'AI Tool'}
              </h1>
              <p className={`text-sm sm:text-base ${themeClasses.subtext}`}>
                {toolConfig?.description || 'AI-powered tool'}
              </p>
            </div>
          </div>
          
          {/* Custom Tool UI or Default Message */}
          {children ? (
            typeof children === 'function' ? (
              // Render props pattern for custom tools
              children(childProps)
            ) : (
              // Standard children
              children
            )
          ) : (
            // No children provided - show placeholder
            <div className={`${themeClasses.card} p-8 text-center`}>
              <p className={themeClasses.subtext}>
                This tool uses the default ToolShell wrapper.
              </p>
              <p className={`text-sm ${themeClasses.subtext} mt-2`}>
                Custom UI should be provided via children prop.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
