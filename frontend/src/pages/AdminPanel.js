import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import logger from "@/lib/logger";
import { toast } from "sonner";
import { Users, BrainCog } from "lucide-react";
import { Button } from "@/components/ui/button";

import UserFilters from "@/components/admin/UserFilters";
import UserTable from "@/components/admin/UserTable";
import UserActivityModal from "@/components/admin/UserActivityModal";
import UserEditModal from "@/components/admin/UserEditModal";

export default function AdminPanel() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
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

  // Search is applied only on explicit submit (Enter/button) — keep it out of
  // fetchUsers deps via a ref so typing doesn't trigger fetches.
  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (searchRef.current) params.append("search", searchRef.current);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);

      const response = await axios.get(`${API}/users?${params}`, {
        withCredentials: true,
      });
      setUsers(response.data.users);
      setTotalPages(response.data.pages);
    } catch (err) {
      logger.error("Failed to fetch users:", err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, statusFilter]);

  useEffect(() => {
    if (!isAdmin) {
      window.location.href = "/dashboard";
      return;
    }
    fetchUsers();
  }, [isAdmin, fetchUsers]);

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
      logger.error("Failed to fetch user activity:", err);
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

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090914] via-[#0a0a1a] to-[#090914]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            </div>
            <p className="text-slate-400">Manage users, roles, and system access</p>
          </div>
          {isSuperAdmin && (
            <Button
              variant="outline"
              onClick={() => navigate("/admin/prompts")}
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              data-testid="open-prompt-manager-btn"
            >
              <BrainCog className="w-4 h-4 mr-2" />
              System Prompts
            </Button>
          )}
        </div>

        <UserFilters
          search={search}
          setSearch={setSearch}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onSearch={handleSearch}
        />

        <UserTable
          users={users}
          loading={loading}
          currentUser={currentUser}
          isSuperAdmin={isSuperAdmin}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          onViewActivity={viewUserActivity}
          onEdit={openEditModal}
          onRoleChange={handleRoleChange}
          onStatusChange={handleStatusChange}
        />

        <UserActivityModal
          open={showActivityModal}
          onOpenChange={setShowActivityModal}
          selectedUser={selectedUser}
          userActivity={userActivity}
        />

        <UserEditModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          formData={editFormData}
          setFormData={setEditFormData}
          onSubmit={handleEditSubmit}
        />
      </div>
    </div>
  );
}
