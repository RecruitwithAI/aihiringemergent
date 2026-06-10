import { Zap } from "lucide-react";
import DocsCard from "./DocsCard";

export default function OverviewSection({ overview }) {
  return (
    <DocsCard icon={Zap} iconColor="text-blue-400" title="System Overview">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-400 mb-1">Application:</p>
          <p className="text-slate-200">{overview.application}</p>
        </div>
        <div>
          <p className="text-slate-400 mb-1">Architecture Type:</p>
          <p className="text-slate-200">{overview.architecture_type}</p>
        </div>
        <div>
          <p className="text-slate-400 mb-1">Pattern:</p>
          <p className="text-slate-200">{overview.pattern}</p>
        </div>
        <div>
          <p className="text-slate-400 mb-1">Environment:</p>
          <p className="text-slate-200">{overview.environment}</p>
        </div>
      </div>
    </DocsCard>
  );
}
