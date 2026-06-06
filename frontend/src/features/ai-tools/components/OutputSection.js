import { useState } from 'react';
import { Download, Edit2, Check, X } from 'lucide-react';
import { themeClasses } from '@/design-system/tokens';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * OutputSection Component
 * Displays AI-generated output with edit and download capabilities
 * 
 * @param {Object} props
 * @param {string} props.result - Generated AI content
 * @param {boolean} props.downloading - Download loading state
 * @param {Array<string>} props.outputFormats - Available download formats (e.g., ['txt', 'pdf', 'docx'])
 * @param {Function} props.onDownload - Download handler (format) => void
 * @param {string} props.toolColor - Tool accent color class
 * @param {Function} props.onEdit - Optional: Edit save handler (newContent) => void
 * 
 * @example
 * <OutputSection
 *   result={generation.result}
 *   downloading={download.downloading}
 *   outputFormats={['txt', 'pdf', 'docx']}
 *   onDownload={(format) => download.handleDownload(result, format, 'filename')}
 *   toolColor="text-blue-400"
 * />
 */
export default function OutputSection({
  result,
  downloading,
  outputFormats = ['txt', 'pdf', 'docx'],
  onDownload,
  toolColor = 'text-primary',
  onEdit
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState(result);
  
  const handleEditToggle = () => {
    if (isEditing && onEdit) {
      // Save changes
      onEdit(editBuffer);
    } else {
      // Enter edit mode
      setEditBuffer(result);
    }
    setIsEditing(!isEditing);
  };
  
  const handleCancelEdit = () => {
    setEditBuffer(result);
    setIsEditing(false);
  };
  
  // Update edit buffer when result changes
  if (!isEditing && editBuffer !== result) {
    setEditBuffer(result);
  }
  
  const formatLabel = {
    txt: 'Text (.txt)',
    pdf: 'PDF (.pdf)',
    docx: 'Word (.docx)',
    csv: 'CSV (.csv)'
  };
  
  return (
    <div className={`${themeClasses.card} p-6 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${themeClasses.heading}`}>
          Generated Output
        </h3>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Edit Button */}
          {onEdit && (
            isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${themeClasses.button} text-sm`}
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleEditToggle}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${themeClasses.buttonPrimary} text-sm`}
                >
                  <Check className="w-4 h-4" strokeWidth={1.5} />
                  <span>Save</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleEditToggle}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${themeClasses.button} text-sm`}
              >
                <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )
          )}
          
          {/* Download Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={downloading}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${themeClasses.buttonPrimary} text-sm ${
                  downloading ? themeClasses.disabled : ''
                }`}
              >
                {downloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="hidden sm:inline">Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" strokeWidth={1.5} />
                    <span className="hidden sm:inline">Download</span>
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {outputFormats.map((format) => (
                <DropdownMenuItem
                  key={format}
                  onClick={() => onDownload(format)}
                  disabled={downloading}
                >
                  <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  {formatLabel[format] || format.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Output Content */}
      {isEditing ? (
        <textarea
          value={editBuffer}
          onChange={(e) => setEditBuffer(e.target.value)}
          className={`w-full min-h-[400px] ${themeClasses.textarea} font-mono text-sm`}
        />
      ) : (
        <div className={`${themeClasses.surface} rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto`}>
          <pre className="whitespace-pre-wrap text-sm font-mono text-foreground">
            {result}
          </pre>
        </div>
      )}
      
      {/* Character Count */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{result?.length || 0} characters</span>
        <span>{Math.ceil((result?.length || 0) / 4)} tokens (est.)</span>
      </div>
    </div>
  );
}
