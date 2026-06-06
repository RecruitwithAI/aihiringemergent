import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '@/App';

const CHUNK_SIZE = 1 * 1024 * 1024; // 1 MB

/**
 * useFileUpload Hook
 * Manages chunked file upload with progress tracking
 * 
 * Handles:
 * - Multi-file drag-and-drop uploads
 * - Chunked upload for large files (1MB chunks)
 * - Progress tracking per file
 * - Text extraction (PDF, DOCX, TXT, audio files)
 * - File validation (type, size)
 * 
 * @param {Object} config - Upload configuration
 * @param {Array<string>} config.accept - Accepted file extensions (e.g., ['.txt', '.pdf', '.docx'])
 * @param {number} config.maxSize - Max file size in MB
 * @param {boolean} config.multiple - Allow multiple files
 * @returns {Object} File upload state and methods
 * 
 * @example
 * const fileUpload = useFileUpload({
 *   accept: ['.txt', '.pdf', '.docx'],
 *   maxSize: 10,
 *   multiple: true
 * });
 * 
 * // Use in component
 * <input type="file" onChange={(e) => fileUpload.handleFilesDrop(e.target.files)} />
 * {fileUpload.uploading && <div>Progress: {fileUpload.uploadProgress}%</div>}
 * {fileUpload.uploadedFiles.map(file => <div key={file.name}>{file.name}</div>)}
 */
export const useFileUpload = (config = {}) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expandedFileIdx, setExpandedFileIdx] = useState(null);
  
  const {
    accept = ['.txt', '.pdf', '.doc', '.docx', '.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'],
    maxSize = 10,
    multiple = true
  } = config;
  
  /**
   * Process a single file with chunked upload
   * 
   * @param {File} file - File to upload
   * @returns {Object|null} Processed file data or null on error
   */
  const processFile = async (file) => {
    const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    try {
      console.log(`[useFileUpload] Processing file: ${file.name}, chunks: ${totalChunks}`);
      
      // Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('upload_id', uploadId);
        formData.append('chunk_index', i.toString());
        formData.append('total_chunks', totalChunks.toString());
        formData.append('filename', file.name);

        await axios.post(`${API}/ai/upload-chunk`, formData, { 
          withCredentials: true 
        });

        const progress = Math.round(((i + 1) / totalChunks) * 100);
        setUploadProgress(progress);
      }

      console.log(`[useFileUpload] All chunks uploaded, extracting text...`);
      
      // Extract file content
      const res = await axios.post(
        `${API}/ai/extract-file`,
        { upload_id: uploadId, filename: file.name },
        { withCredentials: true }
      );

      console.log(`[useFileUpload] Text extracted, ${res.data.char_count} characters`);

      return {
        name: file.name,
        charCount: res.data.char_count,
        extractedText: res.data.extracted_text,
      };
    } catch (err) {
      console.error('[useFileUpload] Processing failed:', err);
      toast.error(err.response?.data?.detail || 'File processing failed');
      return null;
    }
  };
  
  /**
   * Handle file drop or selection
   * Validates files and processes them
   * 
   * @param {FileList|Array<File>} files - Files to upload
   */
  const handleFilesDrop = async (files) => {
    if (!files || files.length === 0) return;

    const validFiles = [];
    for (const file of files) {
      const ext = `.${file.name.split('.').pop().toLowerCase()}`;
      
      // Validate file type
      if (!accept.includes(ext)) {
        toast.error(`Unsupported type: ${ext}`);
        continue;
      }

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max ${maxSize} MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;
    
    // If not multiple, only process first file
    const filesToProcess = multiple ? validFiles : [validFiles[0]];

    setUploading(true);
    setUploadProgress(0);

    for (const file of filesToProcess) {
      const processed = await processFile(file);
      if (processed) {
        setUploadedFiles((prev) => multiple ? [...prev, processed] : [processed]);
      }
    }

    setUploading(false);
    setUploadProgress(0);
    toast.success(`${filesToProcess.length} file(s) uploaded successfully`);
  };
  
  /**
   * Remove a file by index
   * 
   * @param {number} index - Index of file to remove
   */
  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    if (expandedFileIdx === index) setExpandedFileIdx(null);
    else if (expandedFileIdx > index) setExpandedFileIdx(expandedFileIdx - 1);
  };

  /**
   * Clear all uploaded files
   */
  const clearAllFiles = () => {
    setUploadedFiles([]);
    setExpandedFileIdx(null);
  };

  /**
   * Toggle file expansion for preview
   * 
   * @param {number} idx - Index of file to toggle
   */
  const toggleFileExpand = (idx) => {
    setExpandedFileIdx(expandedFileIdx === idx ? null : idx);
  };
  
  /**
   * Get combined context from all uploaded files
   * Formats with separators for AI context
   * 
   * @returns {string} Combined text from all files
   */
  const getCombinedContext = () => {
    return uploadedFiles
      .map((f, i) => `--- Context File ${i + 1}: ${f.name} ---\n${f.extractedText}`)
      .join('\n\n');
  };
  
  return {
    // State
    uploadedFiles,
    uploading,
    uploadProgress,
    expandedFileIdx,
    
    // Methods
    handleFilesDrop,
    removeFile,
    clearAllFiles,
    toggleFileExpand,
    getCombinedContext
  };
};
