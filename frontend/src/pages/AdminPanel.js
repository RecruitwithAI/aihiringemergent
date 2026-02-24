import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users,
  Search,
  MoreVertical,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Ban,
  CheckCircle,
  XCircle,
  Edit,
  Activity,
  ChevronLeft,
  ChevronRight,
  Key,
  Loader2,
} from "lucide-react";
import { UserAvatar } from "@/components/Navbar";

export default function AdminPanel() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userActivity, setUserActivity] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Check if current user is admin/superadmin
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";
  const isSuperAdmin = currentUser?.role === "superadmin";

  useEffect(() => {
    if (!isAdmin) {
      window.location.href = "/dashboard";
      return;
    }
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);

      const response = await axios.get(`${API}/users?${params}`, {
        withCredentials: true,
      });
      setUsers(response.data.users);
      setTotalPages(response.data.pages);
    } catch (err) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(
        `${API}/users/${userId}/role`,
        { role: newRole },
        { withCredentials: true }
      );
      toast.success("User role updated");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update role");
    }
  };

  const handleStatusChange = async (userId, newStatus, reason = "") => {
    try {
      await axios.put(
        `${API}/users/${userId}/status`,
        { status: newStatus, reason },
        { withCredentials: true }
      );
      toast.success("User status updated");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update status");
    }
  };

  const viewUserActivity = async (userId) => {
    try {
      const response = await axios.get(`${API}/users/${userId}/activity`, {
        withCredentials: true,
      });
      setUserActivity(response.data);
      setSelectedUser(users.find((u) => u.user_id === userId));
      setShowActivityModal(true);
    } catch (err) {
      toast.error("Failed to fetch user activity");
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || "",
      title: user.title || "",
      company: user.company || "",
      city: user.city || "",
      country: user.country || "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      await axios.put(
        `${API}/users/${selectedUser.user_id}`,
        editFormData,
        { withCredentials: true }
      );
      toast.success("User profile updated");
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
    }
  };

  const getRoleBadge = (role) => {
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
  };

  const getStatusBadge = (status) => {
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
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090914] via-[#0a0a1a] to-[#090914]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          </div>
          <p className="text-slate-400">Manage users, roles, and system access</p>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6 bg-[#0f1020]/80 backdrop-blur-xl border border-white/10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search by name or email..."
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[#0f1020] border border-white/10 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="superadmin">SuperAdmin</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[#0f1020] border border-white/10 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>

            <Button onClick={handleSearch} className="bg-blue-500 hover:bg-blue-600">
              Search
            </Button>
          </div>
        </Card>

        {/* Users Table */}
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
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => viewUserActivity(user.user_id)}>
                                <Activity className="w-4 h-4 mr-2" />
                                View Activity
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditModal(user)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Profile
                              </DropdownMenuItem>

                              {/* Role Changes - Only SuperAdmin can promote to superadmin */}
                              {user.role !== "superadmin" && (
                                <>
                                  {user.role !== "admin" && (
                                    <DropdownMenuItem
                                      onClick={() => handleRoleChange(user.user_id, "admin")}
                                    >
                                      <ShieldCheck className="w-4 h-4 mr-2" />
                                      Make Admin
                                    </DropdownMenuItem>
                                  )}
                                  {user.role !== "user" && (
                                    <DropdownMenuItem
                                      onClick={() => handleRoleChange(user.user_id, "user")}
                                    >
                                      <Shield className="w-4 h-4 mr-2" />
                                      Make User
                                    </DropdownMenuItem>
                                  )}
                                  {isSuperAdmin && user.role !== "superadmin" && (
                                    <DropdownMenuItem
                                      onClick={() => handleRoleChange(user.user_id, "superadmin")}
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
                                  onClick={() => handleStatusChange(user.user_id, "active")}
                                  className="text-green-400"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              {user.status !== "suspended" && user.user_id !== currentUser.user_id && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(user.user_id, "suspended", "Administrative action")
                                  }
                                  className="text-amber-400"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                              )}
                              {user.status !== "banned" && user.user_id !== currentUser.user_id && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(user.user_id, "banned", "Policy violation")
                                  }
                                  className="text-red-400"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Ban
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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

        {/* User Activity Modal */}
        <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Activity: {selectedUser?.name}</DialogTitle>
              <DialogDescription>{selectedUser?.email}</DialogDescription>
            </DialogHeader>

            {userActivity && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-blue-500/5 border-blue-500/20">
                    <div className="text-2xl font-bold text-blue-400">
                      {userActivity.total_points}
                    </div>
                    <div className="text-xs text-slate-400">Total Points</div>
                  </Card>
                  <Card className="p-4 bg-purple-500/5 border-purple-500/20">
                    <div className="text-2xl font-bold text-purple-400">
                      {userActivity.challenges_created}
                    </div>
                    <div className="text-xs text-slate-400">Challenges</div>
                  </Card>
                  <Card className="p-4 bg-green-500/5 border-green-500/20">
                    <div className="text-2xl font-bold text-green-400">
                      {userActivity.answers_created}
                    </div>
                    <div className="text-xs text-slate-400">Answers</div>
                  </Card>
                  <Card className="p-4 bg-amber-500/5 border-amber-500/20">
                    <div className="text-2xl font-bold text-amber-400">
                      {userActivity.ai_history?.length || 0}
                    </div>
                    <div className="text-xs text-slate-400">AI Generations</div>
                  </Card>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Recent AI Activity</h3>
                  <div className="space-y-2">
                    {userActivity.ai_history?.slice(0, 5).map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#0f1020] border border-white/5 text-sm"
                      >
                        <div className="text-blue-400 font-medium">{item.tool_type}</div>
                        <div className="text-slate-400 text-xs mt-1 line-clamp-2">
                          {item.prompt}
                        </div>
                        <div className="text-slate-500 text-xs mt-1">
                          {new Date(item.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Profile</DialogTitle>
              <DialogDescription>Update user information</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Company</Label>
                <Input
                  value={editFormData.company}
                  onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={editFormData.country}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, country: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditSubmit} className="bg-blue-500 hover:bg-blue-600">
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
