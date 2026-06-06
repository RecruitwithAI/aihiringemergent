import { Upload, FileText, X, ChevronDown, ChevronUp } from 'lucide-react';
import { themeClasses } from '@/design-system/tokens';

/**
 * FileUploadSection Component
 * Drag-and-drop file upload with progress tracking and file management
 * 
 * @param {Object} props
 * @param {Array<Object>} props.files - Uploaded files array
 * @param {boolean} props.uploading - Upload in progress state
 * @param {number} props.uploadProgress - Upload progress (0-100)
 * @param {number} props.expandedFileIdx - Index of expanded file (for preview)
 * @param {Function} props.onFilesDrop - File drop handler
 * @param {Function} props.onRemoveFile - Remove file handler (index)
 * @param {Function} props.onClearAll - Clear all files handler
 * @param {Function} props.onToggleExpand - Toggle file expansion (index)
 * @param {Object} props.config - Upload configuration
 * @param {Array<string>} props.config.accept - Accepted file extensions
 * @param {number} props.config.maxSize - Max file size in MB
 * @param {boolean} props.config.multiple - Allow multiple files
 * @param {string} props.config.label - Section label
 * 
 * @example
 * <FileUploadSection
 *   files={fileUpload.uploadedFiles}
 *   uploading={fileUpload.uploading}
 *   uploadProgress={fileUpload.uploadProgress}
 *   expandedFileIdx={fileUpload.expandedFileIdx}
 *   onFilesDrop={fileUpload.handleFilesDrop}
 *   onRemoveFile={fileUpload.removeFile}
 *   onClearAll={fileUpload.clearAllFiles}
 *   onToggleExpand={fileUpload.toggleFileExpand}
 *   config={{
 *     accept: ['.txt', '.pdf', '.docx'],
 *     maxSize: 10,
 *     multiple: true,
 *     label: 'Upload Context Documents'
 *   }}
 * />
 */
export default function FileUploadSection({
  files,
  uploading,
  uploadProgress,
  expandedFileIdx,
  onFilesDrop,
  onRemoveFile,
  onClearAll,
  onToggleExpand,
  config = {}
}) {
  const {
    accept = ['.txt', '.pdf', '.doc', '.docx'],
    maxSize = 10,
    multiple = true,
    label = 'Upload Context Documents'
  } = config;
  
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    onFilesDrop(files);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    onFilesDrop(files);
  };
  
  return (
    <div className={`${themeClasses.card} p-6 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">{label}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Supported: {accept.join(', ')} • Max {maxSize} MB each
          </p>
        </div>
        {files.length > 0 && (
          <button
            onClick={onClearAll}
            disabled={uploading}
            className="text-xs text-destructive hover:text-destructive/80 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
      
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          uploading 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }`}
      >
        <input
          type="file"
          accept={accept.join(',')}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
          disabled={uploading}
        />
        <label 
          htmlFor="file-input" 
          className={`cursor-pointer ${uploading ? 'pointer-events-none' : ''}`}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-foreground font-medium">
            {uploading ? `Uploading... ${uploadProgress}%` : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {multiple ? 'Multiple files supported' : 'Single file only'}
          </p>
        </label>
        
        {/* Progress Bar */}
        {uploading && (
          <div className="mt-4 w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>
      
      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Uploaded Files ({files.length})
          </p>
          {files.map((file, idx) => (
            <div 
              key={idx} 
              className={`${themeClasses.surface} rounded-lg transition-all`}
            >
              {/* File Header */}
              <div className="p-3 flex items-center justify-between">
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => onToggleExpand && onToggleExpand(idx)}
                >
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file.charCount?.toLocaleString() || 0} characters extracted
                    </p>
                  </div>
                  {onToggleExpand && (
                    expandedFileIdx === idx ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                    )
                  )}
                </div>
                <button
                  onClick={() => onRemoveFile(idx)}
                  className="p-2 hover:bg-destructive/10 rounded-lg transition-colors flex-shrink-0 ml-2"
                >
                  <X className="w-4 h-4 text-destructive" strokeWidth={1.5} />
                </button>
              </div>
              
              {/* File Preview (Expanded) */}
              {expandedFileIdx === idx && file.extractedText && (
                <div className="px-3 pb-3">
                  <div className="bg-background rounded-lg p-3 max-h-40 overflow-y-auto">
                    <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
                      {file.extractedText.substring(0, 500)}
                      {file.extractedText.length > 500 && '...'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
