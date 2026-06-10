import { Shield } from "lucide-react";
import DocsCard from "./DocsCard";

export default function RbacSection({ roles }) {
  return (
    <DocsCard icon={Shield} iconColor="text-purple-400" title="Role-Based Access Control (RBAC)">
      <div className="space-y-4">
        {Object.entries(roles).map(([role, details]) => (
          <div key={role} className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-white capitalize">{role}</h3>
              <span className="text-xs text-slate-400">{details.count} user(s)</span>
            </div>
            <p className="text-sm text-slate-400 mb-3">{details.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-green-400 mb-2">Permissions:</p>
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                  {details.permissions.map((perm) => (
                    <li key={perm}>{perm}</li>
                  ))}
                </ul>
              </div>
              {details.restrictions && (
                <div>
                  <p className="text-sm font-medium text-red-400 mb-2">Restrictions:</p>
                  <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                    {details.restrictions.map((rest) => (
                      <li key={rest}>{rest}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </DocsCard>
  );
}
