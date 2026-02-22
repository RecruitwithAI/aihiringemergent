import { Download, Edit3, Check, X, ChevronDown, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CARD = "bg-white/[0.04] border border-white/[0.07] rounded-2xl";

export default function OutputDisplay({
  result,
  isEditing,
  editBuffer,
  downloading,
  toolColor,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditBufferChange,
  onDownload,
}) {
  if (!result) return null;

  return (
    <div className={`${CARD} p-6 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white font-[Lexend]">
          Generated Output
        </h3>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={onStartEdit}
                className="flex items-center gap-2 px-4 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-slate-300 hover:text-white text-sm font-medium transition-all"
              >
                <Edit3 className="w-4 h-4" strokeWidth={1.5} />
                Edit
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={downloading}
                    className="flex items-center gap-2 px-4 h-9 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all download-button"
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" strokeWidth={1.5} />
                        Download
                        <ChevronDown className="w-3 h-3" strokeWidth={1.5} />
                      </>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 download-dropdown">
                  <DropdownMenuItem
                    onClick={() => onDownload("txt")}
                    className="cursor-pointer download-item"
                  >
                    <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Text (.txt)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDownload("docx")}
                    className="cursor-pointer download-item"
                  >
                    <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Word (.docx)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDownload("pdf")}
                    className="cursor-pointer download-item"
                  >
                    <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    PDF (.pdf)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <button
                onClick={onCancelEdit}
                className="flex items-center gap-2 px-4 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-slate-300 hover:text-white text-sm font-medium transition-all"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
                Cancel
              </button>
              <button
                onClick={onSaveEdit}
                className="flex items-center gap-2 px-4 h-9 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-all"
              >
                <Check className="w-4 h-4" strokeWidth={1.5} />
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <Textarea
          value={editBuffer}
          onChange={(e) => onEditBufferChange(e.target.value)}
          className="min-h-[400px] bg-white/[0.02] border-white/[0.08] text-slate-200 font-mono text-sm resize-none focus:border-blue-500/30"
          placeholder="Edit your output here..."
        />
      ) : (
        <div className="ai-output prose prose-invert max-w-none p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] max-h-[600px] overflow-y-auto">
          {result.split("\n").map((line, i) => (
            <p key={i} className="mb-2">
              {line || " "}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
