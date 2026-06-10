import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import DocsCard from "./DocsCard";

export function DeploymentSection({ deployment }) {
  return (
    <DocsCard title="Deployment">
      <div className="space-y-4 text-sm">
        <div>
          <p className="text-slate-400">Platform:</p>
          <p className="text-slate-200">{deployment.platform}</p>
        </div>
        <div>
          <h3 className="text-md font-medium text-blue-400 mb-2">Containers</h3>
          {Object.entries(deployment.containers).map(([name, config]) => (
            <div key={name} className="mb-2">
              <p className="text-slate-300 font-medium capitalize">{name}:</p>
              <p className="text-slate-400 text-xs">
                {JSON.stringify(config, null, 2)}
              </p>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-md font-medium text-green-400 mb-2">Ingress Rules</h3>
          {Object.entries(deployment.ingress_rules).map(([route, target]) => (
            <p key={route} className="text-slate-300">
              <span className="font-mono text-blue-400">{route}</span> → {target}
            </p>
          ))}
        </div>
      </div>
    </DocsCard>
  );
}

export function CredentialsSection({ credentials }) {
  return (
    <Card className="p-6 bg-red-500/10 border border-red-500/30">
      <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
        <Lock className="w-5 h-5" />
        Credentials (CONFIDENTIAL)
      </h2>
      <div className="space-y-3 text-sm">
        <div>
          <h3 className="text-md font-medium text-white mb-2">SuperAdmin</h3>
          <p className="text-slate-300">
            Email: <span className="font-mono">{credentials.superadmin.email}</span>
          </p>
          <p className="text-slate-300">Role: {credentials.superadmin.role}</p>
        </div>
        <div>
          <h3 className="text-md font-medium text-white mb-2">Test Users</h3>
          <p className="text-slate-300">
            Admin: <span className="font-mono">{credentials.test_users.admin.email}</span> (
            {credentials.test_users.admin.role})
          </p>
          <p className="text-slate-300">
            Regular Users: {credentials.test_users.regular_user.count} users with role &quot;
            {credentials.test_users.regular_user.role}&quot;
          </p>
        </div>
      </div>
    </Card>
  );
}
