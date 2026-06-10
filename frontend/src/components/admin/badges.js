import {
  Shield, ShieldCheck, ShieldAlert, Ban, CheckCircle, XCircle,
} from "lucide-react";

export function RoleBadge({ role }) {
  if (role === "superadmin") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-medium">
        <ShieldAlert className="w-3 h-3" />
        SuperAdmin
      </span>
    );
  }
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium">
        <ShieldCheck className="w-3 h-3" />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-xs font-medium">
      <Shield className="w-3 h-3" />
      User
    </span>
  );
}

export function StatusBadge({ status }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium">
        <CheckCircle className="w-3 h-3" />
        Active
      </span>
    );
  }
  if (status === "suspended") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
        <XCircle className="w-3 h-3" />
        Suspended
      </span>
    );
  }
  if (status === "banned") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
        <Ban className="w-3 h-3" />
        Banned
      </span>
    );
  }
  return null;
}
