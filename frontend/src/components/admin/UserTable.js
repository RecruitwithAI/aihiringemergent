import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Key, Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/Navbar";
import { RoleBadge, StatusBadge } from "./badges";
import UserRowActions from "./UserRowActions";

export default function UserTable({
  users, loading, currentUser, isSuperAdmin,
  page, totalPages, setPage,
  onViewActivity, onEdit, onRoleChange, onStatusChange,
}) {
  return (
    <Card className="overflow-hidden bg-[#0f1020]/80 backdrop-blur-xl border border-white/10">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-300">User</TableHead>
                  <TableHead className="text-slate-300">Role</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Points</TableHead>
                  <TableHead className="text-slate-300">API Key</TableHead>
                  <TableHead className="text-slate-300">Joined</TableHead>
                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id} className="border-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} size="sm" />
                        <div>
                          <div className="text-white font-medium">{user.name}</div>
                          <div className="text-xs text-slate-400">{user.email}</div>
                          {user.title && (
                            <div className="text-xs text-slate-500">{user.title}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><RoleBadge role={user.role} /></TableCell>
                    <TableCell><StatusBadge status={user.status} /></TableCell>
                    <TableCell className="text-slate-300">{user.points || 0}</TableCell>
                    <TableCell>
                      {user.has_own_api_key ? (
                        <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                          <Key className="w-3 h-3" />
                          Yes
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <UserRowActions
                        user={user}
                        currentUser={currentUser}
                        isSuperAdmin={isSuperAdmin}
                        onViewActivity={onViewActivity}
                        onEdit={onEdit}
                        onRoleChange={onRoleChange}
                        onStatusChange={onStatusChange}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <div className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
