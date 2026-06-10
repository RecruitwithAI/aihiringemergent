import { Cloud } from "lucide-react";
import DocsCard from "./DocsCard";

export default function ArchitectureLayersSection({ layers }) {
  return (
    <DocsCard icon={Cloud} iconColor="text-blue-400" title="System Architecture">
      <div className="space-y-4">
        {layers.map((layer) => (
          <div key={layer.name} className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-white">{layer.name}</h3>
              <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                {layer.technology}
              </span>
            </div>
            {layer.port && (
              <p className="text-sm text-slate-400 mb-2">Port: {layer.port}</p>
            )}
            <p className="text-sm text-slate-400 mb-2">
              Hot Reload: {layer.hot_reload ? "✅ Enabled" : "❌ Disabled"}
            </p>
            <div>
              <p className="text-sm text-slate-400 mb-1">Responsibilities:</p>
              <ul className="list-disc list-inside text-sm text-slate-300">
                {layer.responsibilities.map((resp) => (
                  <li key={resp}>{resp}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </DocsCard>
  );
}
