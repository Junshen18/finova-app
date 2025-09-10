"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface UserRow {
  id: string;
  email: string | null;
  created_at: string;
  email_confirmed_at?: string | null;
  profile: {
    display_name?: string;
    email?: string;
    role?: string;
    avatar_url?: string | null;
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

  useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
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

  const changeRole = async (id: string, role: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "update_role", updates: { role } })
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Failed" }));
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
    if (!res.ok) { toast.error("Failed to update profile"); return; }
    toast.success("Profile updated");
    await refresh();
  };

  const verifyUser = async (id: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "verify" })
    });
    if (!res.ok) { toast.error("Failed to verify user"); return; }
    toast.success("User verified");
    await refresh();
  };

  const addUser = async () => {
    if (!addEmail || !addPassword) { toast.error("Email and password required"); return; }
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: addEmail, password: addPassword, display_name: addName, role: addRole })
    });
    if (!res.ok) { toast.error("Failed to add user"); return; }
    toast.success("User created");
    setOpenAdd(false);
    setAddEmail(""); setAddPassword(""); setAddName(""); setAddRole("user");
    await refresh();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={() => setOpenAdd(true)}>Add User</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b border-white/10">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Verified</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const name = u.profile?.display_name || (u.email || "User").split("@")[0];
              const verified = Boolean(u.email_confirmed_at);
              return (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <Input className="max-w-xs" defaultValue={name} onBlur={(e) => saveProfile(u.id, { display_name: e.target.value })} />
                    </div>
                  </td>
                  <td className="py-2 pr-4">
                    <Input className="max-w-xs" defaultValue={u.profile?.email || u.email || ""} onBlur={(e) => saveProfile(u.id, { email: e.target.value })} />
                  </td>
                  <td className="py-2 pr-4">
                    <Select defaultValue={u.profile?.role || "user"} onValueChange={(v) => changeRole(u.id, v)}>
                      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">user</SelectItem>
                        <SelectItem value="professional">professional</SelectItem>
                        <SelectItem value="admin">admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 pr-4">
                    {verified ? <span className="text-green-500">Yes</span> : <span className="text-yellow-500">No</span>}
                  </td>
                  <td className="py-2">
                    {!verified && (
                      <Button size="sm" variant="outline" onClick={() => verifyUser(u.id)}>Verify</Button>
                    )}
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
            <Input placeholder="Display name (optional)" value={addName} onChange={(e) => setAddName(e.target.value)} />
            <div>
              <span className="text-xs block mb-1">Role</span>
              <Select value={addRole} onValueChange={setAddRole}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="professional">professional</SelectItem>
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

