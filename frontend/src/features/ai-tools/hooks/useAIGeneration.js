import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '@/App';
import logger from '@/lib/logger';

/**
 * useAIGeneration Hook
 * Manages AI generation state and API calls
 * 
 * Handles:
 * - Prompt and context state management
 * - API calls to /api/ai/generate
 * - Loading states
 * - Error handling with user-friendly toasts
 * - Success notifications
 * 
 * @param {Object} toolConfig - Tool configuration from registry
 * @returns {Object} AI generation state and methods
 * 
 * @example
 * const generation = useAIGeneration(toolConfig);
 * 
 * // Use in component
 * <input value={generation.prompt} onChange={(e) => generation.setPrompt(e.target.value)} />
 * <button onClick={() => generation.handleGenerate()}>Generate</button>
 * {generation.result && <div>{generation.result}</div>}
 */
export const useAIGeneration = (toolConfig) => {
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [generating, setGenerating] = useState(false);
  
  /**
   * Generate AI content
   * 
   * @param {string} overridePrompt - Optional prompt override (for custom tools)
   * @param {string} overrideContext - Optional context override (for file uploads)
   * @param {string} customToolType - Optional backend tool type override
   * @returns {Object|null} API response data or null on error
   */
  const handleGenerate = async (overridePrompt, overrideContext, customToolType) => {
    // Defensive: only treat overrides as strings (callers sometimes wire onClick directly
    // and pass a SyntheticEvent here). Ignore non-string values and fall back to state.
    const safeOverridePrompt = typeof overridePrompt === 'string' ? overridePrompt : undefined;
    const safeOverrideContext = typeof overrideContext === 'string' ? overrideContext : undefined;
    const safeCustomToolType = typeof customToolType === 'string' ? customToolType : undefined;

    const actualPrompt = safeOverridePrompt ?? prompt;
    const actualContext = safeOverrideContext ?? context;
    const toolType = safeCustomToolType || toolConfig?.backendType || 'default';
    
    // Validation
    if (!actualPrompt?.trim()) {
      toast.error('Please enter a prompt');
      return null;
    }
    
    setGenerating(true);
    setResult('');
    
    try {
      logger.debug('[useAIGeneration] Generating with tool type:', toolType);
      
      const res = await axios.post(
        `${API}/ai/generate`,
        { 
          tool_type: toolType, 
          prompt: actualPrompt, 
          context: actualContext 
        },
        { withCredentials: true }
      );
      
      logger.debug('[useAIGeneration] Generation successful, response length:', res.data.response?.length);
      
      setResult(res.data.response);
      toast.success('Generated successfully');
      return res.data;
    } catch (err) {
      logger.error('[useAIGeneration] Generation failed:', err);
      
      const errorMsg = err.response?.data?.detail || 'Generation failed';
      toast.error(errorMsg);
      
      // Special handling for rate limit errors
      if (err.response?.status === 429) {
        toast.error('Daily limit reached. Please add your own API key.', {
          duration: 5000
        });
      }
      
      return null;
    } finally {
      setGenerating(false);
    }
  };
  
  /**
   * Clear only the result
   */
  const clearResult = () => setResult('');
  
  /**
   * Clear all state (prompt, context, result)
   */
  const clearAll = () => {
    setPrompt('');
    setContext('');
    setResult('');
  };
  
  /**
   * Reset to initial state
   */
  const reset = () => {
    clearAll();
    setGenerating(false);
  };
  
  return {
    // State
    prompt,
    context,
    result,
    generating,
    
    // Setters
    setPrompt,
    setContext,
    setResult,
    
    // Methods
    handleGenerate,
    clearResult,
    clearAll,
    reset
  };
};
