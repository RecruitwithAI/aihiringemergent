import { Lock } from "lucide-react";
import DocsCard from "./DocsCard";

export default function SecuritySection({ security }) {
  return (
    <DocsCard icon={Lock} iconColor="text-red-400" title="Security">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 className="text-md font-medium text-blue-400 mb-2">Authentication</h3>
          <ul className="space-y-1 text-slate-300">
            <li>Method: {security.authentication.method}</li>
            <li>Password: {security.authentication.password_hashing}</li>
            <li>Session Duration: {security.authentication.session_duration}</li>
            <li>OAuth: {security.authentication.oauth_provider}</li>
          </ul>
        </div>
        <div>
          <h3 className="text-md font-medium text-green-400 mb-2">Authorization</h3>
          <ul className="space-y-1 text-slate-300">
            <li>Method: {security.authorization.method}</li>
            <li>Middleware: {security.authorization.middleware}</li>
            <li>Frontend: {security.authorization.frontend_guards}</li>
          </ul>
        </div>
        <div>
          <h3 className="text-md font-medium text-purple-400 mb-2">Data Protection</h3>
          <ul className="space-y-1 text-slate-300">
            {Object.entries(security.data_protection).map(([key, value]) => (
              <li key={key}>
                {key.replace(/_/g, " ")}: {value}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-md font-medium text-amber-400 mb-2">Privacy</h3>
          <ul className="space-y-1 text-slate-300">
            {Object.entries(security.privacy).map(([key, value]) => (
              <li key={key}>
                {key.replace(/_/g, " ")}: {value}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DocsCard>
  );
}
