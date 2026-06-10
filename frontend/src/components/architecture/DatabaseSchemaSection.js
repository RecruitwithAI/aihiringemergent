import { Database } from "lucide-react";
import DocsCard from "./DocsCard";

export default function DatabaseSchemaSection({ collections }) {
  return (
    <DocsCard icon={Database} iconColor="text-purple-400" title="Database Schema">
      <div className="space-y-4">
        {Object.entries(collections).map(([name, details]) => (
          <div key={name} className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-white">{name}</h3>
              {details.total_documents && (
                <span className="text-xs text-slate-400">{details.total_documents}</span>
              )}
            </div>
            <p className="text-sm text-slate-400 mb-3">{details.description}</p>
            <div className="mb-3">
              <p className="text-sm font-medium text-slate-300 mb-2">Key Fields:</p>
              <div className="space-y-1">
                {details.key_fields.map((field) => (
                  <p key={field} className="text-xs text-slate-400 font-mono">
                    {field}
                  </p>
                ))}
              </div>
            </div>
            {details.indexes && (
              <div>
                <p className="text-sm font-medium text-slate-300 mb-1">Indexes:</p>
                <p className="text-xs text-slate-400">{details.indexes.join(", ")}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </DocsCard>
  );
}
