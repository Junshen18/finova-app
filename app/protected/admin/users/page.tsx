"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

interface UserRow {
  id: string;
  email: string | null;
  created_at: string;
  email_confirmed_at?: string | null;
  banned_until?: string | null;
  profile: {
    display_name?: string;
    email?: string;
    role?: string;
    avatar_url?: string | null;
    is_locked?: boolean;
  } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState("user");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "user" | "admin">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "verified" | "unverified" | "locked">("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setCurrentUserId(user.id);
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, display_name, email, is_locked")
        .eq("user_id", user.id)
        .single();
      console.log("[AdminUsersPage] profiles fetch", { profile, profileError });
      if ((profile?.role || "") !== "admin") { setUsers([]); setLoading(false); return; }
      await refresh();
      setLoading(false);
    })();
  }, []);

  const refresh = async () => {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    if (!res.ok) { toast.error("Failed to load users"); return; }
    const { data } = await res.json();
    setUsers(data || []);
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      const name = (u.profile?.display_name || "").toLowerCase();
      const email = (u.profile?.email || u.email || "").toLowerCase();
      const role = (u.profile?.role || "user").toLowerCase();
      const verified = Boolean(u.email_confirmed_at);
      const locked = Boolean(u.profile?.is_locked);

      if (q && !(name.includes(q) || email.includes(q))) return false;
      if (filterRole !== "all" && role !== filterRole) return false;
      if (filterStatus === "verified" && !verified) return false;
      if (filterStatus === "unverified" && verified) return false;
      if (filterStatus === "locked" && !locked) return false;
      return true;
    });
  }, [users, search, filterRole, filterStatus]);

  const changeRole = async (id: string, role: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "update_role", updates: { role } })
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Failed" }));
      if (error === "self_action_not_allowed") { toast.error("You cannot modify your own role."); return; }
      if (error === "at_least_one_admin_required") toast.error("You must keep at least one admin.");
      else toast.error("Failed to update role");
      return;
    }
    toast.success("Role updated");
    await refresh();
  };

  const saveProfile = async (id: string, payload: Partial<UserRow["profile"]>) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "update_profile", updates: payload })
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Failed" }));
      if (error === "self_action_not_allowed") { toast.error("You cannot modify your own account here."); return; }
      toast.error("Failed to update profile");
      return;
    }
    toast.success("Profile updated");
    await refresh();
  };

  const verifyUser = async (id: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "verify" })
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Failed" }));
      if (error === "self_action_not_allowed") { toast.error("You cannot verify your own account."); return; }
      toast.error("Failed to verify user");
      return;
    }
    toast.success("User verified");
    await refresh();
  };

  const deleteUser = async (id: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "delete" })
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Failed" }));
      if (error === "self_action_not_allowed") { toast.error("You cannot delete your own account."); return; }
      toast.error("Failed to delete user");
      return;
    }
    toast.success("User deleted");
    await refresh();
  };

  const setLocked = async (id: string, is_locked: boolean) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "set_locked", updates: { is_locked } })
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Failed" }));
      if (error === "self_action_not_allowed") { toast.error("You cannot lock/unlock your own account."); return; }
      toast.error("Failed to update lock state");
      return;
    }
    toast.success(is_locked ? "User locked" : "User unlocked");
    await refresh();
  };

  const addUser = async () => {
    if (!addEmail || !addPassword) { toast.error("Email and password required"); return; }
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Create first without display_name to avoid insert-time constraints; update name after
      body: JSON.stringify({ email: addEmail, password: addPassword, role: addRole })
    });
    if (!res.ok) {
      const { error, message } = await res.json().catch(() => ({ error: "Failed" }));
      toast.error(message || error || "Failed to add user");
      return;
    }
    const { data } = await res.json().catch(() => ({ data: null }));
    const newUserId = data?.id as string | undefined;
    // If a name was provided, update it after creation
    if (newUserId && addName.trim()) {
      await saveProfile(newUserId, { display_name: addName.trim() });
    }
    toast.success("User created");
    setOpenAdd(false);
    setAddEmail(""); setAddPassword(""); setAddName(""); setAddRole("user");
    await refresh();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Users Management</h1>
        <div className="flex items-center gap-2 ml-auto">
          <Input
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[220px]"
          />
          <Select value={filterRole} onValueChange={(v: any) => setFilterRole(v)}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="user">user</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="verified">verified</SelectItem>
              <SelectItem value="unverified">unverified</SelectItem>
              <SelectItem value="locked">locked</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setOpenAdd(true)}>Add User</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b border-white/10">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Verified</th>
              <th className="py-2 pr-4">Locked</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => {
              const name = u.profile?.display_name || "";
              const verified = Boolean(u.email_confirmed_at);
              const locked = Boolean(u.profile?.is_locked);
              const isSelf = currentUserId === u.id;
              return (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      {editingId === u.id ? (
                        <Input className="max-w-xs" value={editName} onChange={(e) => setEditName(e.target.value)} />
                      ) : (
                        <span>{name || "-"}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-4">
                    {editingId === u.id ? (
                      <Input className="max-w-xs" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                    ) : (
                      <span>{u.profile?.email || u.email || ""}</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <Select defaultValue={u.profile?.role || "user"} onValueChange={(v) => changeRole(u.id, v)} disabled={editingId !== u.id || isSelf}>
                      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">user</SelectItem>
                        <SelectItem value="admin">admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 pr-4">
                    {verified ? <span className="text-green-500">Verified</span> : <span className="text-yellow-500">Unverified</span>}
                  </td>
                  <td className="py-2 pr-4">
                    {locked ? <span className="text-red-500">Locked</span> : <span className="text-green-500">Active</span>}
                  </td>
                  <td className="py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" disabled={isSelf}><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {editingId === u.id ? (
                          <>
                            <DropdownMenuItem onClick={async () => { await saveProfile(u.id, { display_name: editName, email: editEmail }); setEditingId(null); }}>
                              Save changes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingId(null)}>Cancel</DropdownMenuItem>
                          </>
                        ) : (!isSelf ? (
                          <DropdownMenuItem onClick={() => { setEditingId(u.id); setEditName(name); setEditEmail(u.profile?.email || u.email || ""); }}>
                            Edit
                          </DropdownMenuItem>
                        ) : null)}
                        {!verified && !isSelf && (
                          <DropdownMenuItem onClick={() => verifyUser(u.id)}>Verify</DropdownMenuItem>
                        )}
                        {!isSelf && (locked ? (
                          <DropdownMenuItem onClick={() => setLocked(u.id, false)}>Unlock</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setLocked(u.id, true)}>Lock</DropdownMenuItem>
                        ))}
                        {!isSelf && (
                        <DropdownMenuItem onClick={() => deleteUser(u.id)} className="text-red-500 focus:text-red-500">
                          Delete
                        </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent>
          <DialogTitle>Add User</DialogTitle>
          <div className="space-y-3 pt-2">
            <Input placeholder="Email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} />
            <Input placeholder="Password" type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} />

            <div>
              <span className="text-xs block mb-1">Role</span>
              <Select value={addRole} onValueChange={setAddRole}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
              <Button onClick={addUser}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

