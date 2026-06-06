import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API } from '@/App';

/**
 * useHistory Hook
 * Manages AI generation history for a specific tool
 * 
 * Handles:
 * - Fetching history from API
 * - Filtering by tool type
 * - Loading states
 * - Panel open/close state
 * - Manual refresh
 * 
 * @param {string} toolId - Tool identifier (e.g., 'jd-builder')
 * @returns {Object} History state and methods
 * 
 * @example
 * const history = useHistory('jd-builder');
 * 
 * // Use in component
 * <button onClick={history.openHistory}>Show History</button>
 * {history.isOpen && (
 *   <HistoryPanel 
 *     history={history.history}
 *     loading={history.loading}
 *     onClose={history.closeHistory}
 *   />
 * )}
 */
export const useHistory = (toolId) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  /**
   * Fetch history from API
   * Filters results by current tool type
   */
  const fetchHistory = useCallback(async () => {
    if (!toolId) {
      console.log('[useHistory] No toolId provided, skipping fetch');
      return;
    }
    
    setLoading(true);
    try {
      console.log(`[useHistory] Fetching history for tool: ${toolId}`);
      
      const res = await axios.get(`${API}/ai/history`, { 
        withCredentials: true 
      });
      
      // Filter by tool type
      const filtered = res.data.filter((h) => h.tool_type === toolId);
      
      console.log(`[useHistory] Fetched ${filtered.length} items for ${toolId}`);
      setHistory(filtered);
    } catch (err) {
      console.error('[useHistory] Failed to load history:', err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [toolId]);
  
  /**
   * Fetch history on mount and when toolId changes
   */
  useEffect(() => {
    if (toolId) {
      fetchHistory();
    }
  }, [toolId, fetchHistory]);
  
  /**
   * Open history panel
   */
  const openHistory = () => {
    console.log('[useHistory] Opening history panel');
    setIsOpen(true);
  };
  
  /**
   * Close history panel
   */
  const closeHistory = () => {
    console.log('[useHistory] Closing history panel');
    setIsOpen(false);
  };
  
  /**
   * Manually refresh history
   * Useful after generating new content
   */
  const refreshHistory = () => {
    console.log('[useHistory] Manually refreshing history');
    fetchHistory();
  };
  
  /**
   * Load a history item
   * Returns the item data for component to handle
   * 
   * @param {Object} item - History item to load
   * @returns {Object} History item data
   */
  const loadHistoryItem = (item) => {
    console.log(`[useHistory] Loading history item: ${item.history_id}`);
    closeHistory();
    return item;
  };
  
  return {
    // State
    history,
    loading,
    isOpen,
    
    // Methods
    openHistory,
    closeHistory,
    refreshHistory,
    loadHistoryItem,
    fetchHistory
  };
};
