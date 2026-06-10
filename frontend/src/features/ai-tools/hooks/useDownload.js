import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '@/App';
import logger from '@/lib/logger';

/**
 * useDownload Hook
 * Manages file download functionality for all formats
 * 
 * Handles:
 * - TXT downloads (client-side, instant)
 * - PDF/DOCX/CSV downloads (server-side generation)
 * - Browser download triggers
 * - Error handling with user feedback
 * - Loading states
 * 
 * @returns {Object} Download state and methods
 * 
 * @example
 * const download = useDownload();
 * 
 * // Use in component
 * <button 
 *   onClick={() => download.handleDownload(content, 'pdf', 'document')}
 *   disabled={download.downloading}
 * >
 *   {download.downloading ? 'Downloading...' : 'Download PDF'}
 * </button>
 */
export const useDownload = () => {
  const [downloading, setDownloading] = useState(false);
  
  /**
   * Trigger browser download
   * Creates temporary anchor element and clicks it
   * 
   * @param {Blob} blob - File blob to download
   * @param {string} filename - Name for downloaded file
   */
  const triggerBrowserDownload = (blob, filename) => {
    logger.debug(`[useDownload] Triggering download: ${filename}, size: ${blob.size} bytes`);
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Append to body to ensure it works in all browsers
    document.body.appendChild(link);
    link.click();
    
    // Cleanup after download initiated
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      logger.debug('[useDownload] Cleanup complete');
    }, 100);
  };
  
  /**
   * Handle file download
   * 
   * @param {string} content - Content to download
   * @param {string} format - File format ('txt', 'pdf', 'docx', 'csv')
   * @param {string} filename - Base filename (without extension)
   * @returns {boolean} Success status
   */
  const handleDownload = async (content, format, filename = 'document') => {
    if (!content || !content.trim()) {
      toast.error('No content to download');
      return false;
    }
    
    setDownloading(true);
    
    try {
      const safeFilename = filename.replace(/[^a-zA-Z0-9-_]/g, '_');
      logger.debug(`[useDownload] Starting download: ${format}, filename: ${safeFilename}`);
      
      if (format === 'txt') {
        // Client-side TXT download (instant)
        logger.debug('[useDownload] Creating TXT blob');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        triggerBrowserDownload(blob, `${safeFilename}.txt`);
      } else {
        // Server-side PDF/DOCX/CSV generation
        logger.debug('[useDownload] Requesting server-side generation');
        const res = await axios.post(
          `${API}/ai/download`,
          { content, format, filename: safeFilename },
          { responseType: 'blob', withCredentials: true }
        );
        
        // Validate response is a blob
        if (!(res.data instanceof Blob)) {
          throw new Error('Invalid response format from server');
        }
        
        logger.debug(`[useDownload] Received blob: ${res.data.size} bytes, type: ${res.data.type}`);
        triggerBrowserDownload(res.data, `${safeFilename}.${format}`);
      }
      
      toast.success(`Downloaded as ${format.toUpperCase()}`);
      return true;
    } catch (err) {
      logger.error('[useDownload] Download failed:', err);
      
      let errorMsg = 'Download failed. Please try again.';
      
      // Try to extract error message from blob response
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const errorData = JSON.parse(text);
          errorMsg = errorData.detail || errorMsg;
        } catch (parseErr) {
          // Blob wasn't JSON — keep the default message but record why
          logger.debug('[useDownload] Could not parse error blob:', parseErr);
        }
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      toast.error(errorMsg);
      return false;
    } finally {
      setDownloading(false);
    }
  };
  
  return { 
    downloading, 
    handleDownload 
  };
};
