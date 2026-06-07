import { Sparkles, Clock } from 'lucide-react';
import { themeClasses } from '@/design-system/tokens';

/**
 * InputSection Component
 * Reusable prompt and context input fields
 * Used by all standard AI tools
 * 
 * @param {Object} props
 * @param {string} props.prompt - Current prompt value
 * @param {string} props.context - Current context value (optional)
 * @param {Function} props.onPromptChange - Prompt change handler
 * @param {Function} props.onContextChange - Context change handler (optional)
 * @param {string} props.placeholder - Prompt textarea placeholder
 * @param {boolean} props.generating - Loading state
 * @param {Function} props.onGenerate - Generate button click handler
 * @param {Function} props.onShowHistory - Show history button click handler (optional)
 * @param {boolean} props.hasHistory - Whether history exists
 * 
 * @example
 * <InputSection
 *   prompt={generation.prompt}
 *   context={generation.context}
 *   onPromptChange={generation.setPrompt}
 *   onContextChange={generation.setContext}
 *   placeholder="Enter your prompt..."
 *   generating={generation.generating}
 *   onGenerate={handleGenerate}
 *   onShowHistory={history.openHistory}
 *   hasHistory={history.history.length > 0}
 * />
 */
export default function InputSection({
  prompt,
  context,
  onPromptChange,
  onContextChange,
  placeholder,
  generating,
  onGenerate,
  onShowHistory,
  hasHistory
}) {
  return (
    <div className={`${themeClasses.card} p-6 space-y-4`}>
      {/* Main Prompt */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          What would you like to generate?
        </label>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={placeholder || "Enter your prompt..."}
          className={`w-full min-h-[120px] ${themeClasses.textarea} focus:ring-2 focus:ring-ring`}
          disabled={generating}
        />
      </div>
      
      {/* Additional Context (Optional) */}
      {onContextChange && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Additional Context <span className="text-muted-foreground">(Optional)</span>
          </label>
          <textarea
            value={context}
            onChange={(e) => onContextChange(e.target.value)}
            placeholder="Any additional information or requirements..."
            className={`w-full min-h-[80px] ${themeClasses.textarea} focus:ring-2 focus:ring-ring`}
            disabled={generating}
          />
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onGenerate()}
          disabled={generating || !prompt?.trim()}
          className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-full ${themeClasses.buttonPrimary} ${
            generating || !prompt?.trim() ? themeClasses.disabled : ''
          }`}
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" strokeWidth={1.5} />
              <span>Generate with AI</span>
            </>
          )}
        </button>
        
        {onShowHistory && hasHistory && (
          <button
            onClick={onShowHistory}
            className={`flex items-center gap-2 px-4 h-11 rounded-full ${themeClasses.button}`}
          >
            <Clock className="w-4 h-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">History</span>
          </button>
        )}
      </div>
    </div>
  );
}
