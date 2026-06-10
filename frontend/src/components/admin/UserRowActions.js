import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical, Shield, ShieldCheck, ShieldAlert,
  Ban, CheckCircle, XCircle, Edit, Activity,
} from "lucide-react";

export default function UserRowActions({
  user, currentUser, isSuperAdmin,
  onViewActivity, onEdit, onRoleChange, onStatusChange,
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onViewActivity(user.user_id)}>
          <Activity className="w-4 h-4 mr-2" />
          View Activity
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(user)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </DropdownMenuItem>

        {/* Role Changes - Only SuperAdmin can promote to superadmin */}
        {user.role !== "superadmin" && (
          <>
            {user.role !== "admin" && (
              <DropdownMenuItem onClick={() => onRoleChange(user.user_id, "admin")}>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Make Admin
              </DropdownMenuItem>
            )}
            {user.role !== "user" && (
              <DropdownMenuItem onClick={() => onRoleChange(user.user_id, "user")}>
                <Shield className="w-4 h-4 mr-2" />
                Make User
              </DropdownMenuItem>
            )}
            {isSuperAdmin && user.role !== "superadmin" && (
              <DropdownMenuItem
                onClick={() => onRoleChange(user.user_id, "superadmin")}
                className="text-purple-400"
              >
                <ShieldAlert className="w-4 h-4 mr-2" />
                Make SuperAdmin
              </DropdownMenuItem>
            )}
          </>
        )}

        {/* Status Changes */}
        {user.status !== "active" && (
          <DropdownMenuItem
            onClick={() => onStatusChange(user.user_id, "active")}
            className="text-green-400"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Activate
          </DropdownMenuItem>
        )}
        {user.status !== "suspended" && user.user_id !== currentUser.user_id && (
          <DropdownMenuItem
            onClick={() => onStatusChange(user.user_id, "suspended", "Administrative action")}
            className="text-amber-400"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Suspend
          </DropdownMenuItem>
        )}
        {user.status !== "banned" && user.user_id !== currentUser.user_id && (
          <DropdownMenuItem
            onClick={() => onStatusChange(user.user_id, "banned", "Policy violation")}
            className="text-red-400"
          >
            <Ban className="w-4 h-4 mr-2" />
            Ban
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
