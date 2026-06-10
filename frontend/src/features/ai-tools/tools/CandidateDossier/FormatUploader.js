import { Upload, FileText, X } from 'lucide-react';
import { themeClasses } from '@/design-system/tokens';

/**
 * FormatUploader Component
 * Special file uploader for format sample files
 * Only allows single file upload
 * 
 * @param {Object} props
 * @param {Object} props.file - Uploaded file object
 * @param {boolean} props.uploading - Upload in progress
 * @param {number} props.uploadProgress - Progress (0-100)
 * @param {Function} props.onFilesDrop - File drop handler
 * @param {Function} props.onRemove - Remove file handler
 */
export default function FormatUploader({ file, uploading, uploadProgress, onFilesDrop, onRemove }) {
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    onFilesDrop(files);
  };
  
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    onFilesDrop(files);
  };
  
  return (
    <div className={`${themeClasses.card} p-6 space-y-4`}>
      {/* Header */}
      <div>
        <h3 className="text-sm font-medium text-foreground">
          Upload Sample Output Format <span className="text-muted-foreground">(Optional)</span>
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Provide a sample format for the dossier to follow (e.g., your company&apos;s standard CV template)
        </p>
      </div>
      
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            uploading 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
        >
          <input
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            id="format-file-input"
            disabled={uploading}
          />
          <label 
            htmlFor="format-file-input" 
            className={`cursor-pointer ${uploading ? 'pointer-events-none' : ''}`}
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-foreground font-medium">
              {uploading ? `Uploading... ${uploadProgress}%` : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, Word, or TXT (Max 10 MB)
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
      ) : (
        <div className={`${themeClasses.surface} rounded-lg p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{file.charCount} characters</p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-destructive" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
