"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FaUsers } from "react-icons/fa6";

type FriendOption = {
  friend_id: string;
  friend_name: string;
  friend_avatar: string | null;
};

export default function CreateGroup({ onCreated, iconOnly }: { onCreated?: () => void; iconOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_friends_list");
      if (error) {
        toast.error(error.message || "Failed to load friends");
        return;
      }
      const options = (data || []).map((f: any) => ({
        friend_id: f.friend_id,
        friend_name: f.friend_name,
        friend_avatar: f.friend_avatar,
      }));
      setFriends(options);
    })();
  }, [open]);

  const toggle = (id: string) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error("Enter a group name");
      return;
    }
    const memberIds = Object.keys(selected).filter(k => selected[k]);
    if (memberIds.length === 0) {
      toast.error("Select at least one friend");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const { data: group, error: gErr } = await supabase
        .from("split_groups")
        .insert([{ name: groupName, created_by: user.id }])
        .select("id")
        .single();
      if (gErr) throw gErr;

      const rows = [user.id, ...memberIds].map(uid => ({ group_id: group.id, user_id: uid }));
      const { error: mErr } = await supabase.from("split_group_member").insert(rows);
      if (mErr) throw mErr;

      toast.success("Group created");
      setOpen(false);
      setGroupName("");
      setSelected({});
      onCreated?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="" title="Create Group" aria-label="Create Group">
        {iconOnly ? <div className="flex items-center gap-2"><FaUsers className="text-xl" /> Create Group</div> : "Create Group"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-form-bg border-form-border max-w-lg">
          <DialogTitle className="text-foreground">Create Split Group</DialogTitle>
          <div className="space-y-3">
            <Input
              placeholder="Group name"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="bg-form-bg text-foreground border-form-border"
            />
            <div className="max-h-64 overflow-auto pr-1 space-y-2">
              {friends.length === 0 && (
                <p className="text-sm text-muted-foreground">No friends yet.</p>
              )}
              {friends.map((f) => (
                <label key={f.friend_id} className="flex items-center gap-3 text-foreground">
                  <Checkbox checked={!!selected[f.friend_id]} onCheckedChange={() => toggle(f.friend_id)} />
                  {f.friend_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.friend_avatar} alt={f.friend_name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                      {f.friend_name?.[0]}
                    </div>
                  )}
                  <span>{f.friend_name}</span>
                </label>
              ))}
            </div>
            <Button onClick={handleCreate} disabled={loading} className="w-full bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90">
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


