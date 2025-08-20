"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EllipsisHorizontalIcon, CheckBadgeIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Checkbox } from "@/components/ui/checkbox";

type Member = { user_id: string; display_name: string; avatar_url: string | null };
type Activity = { id: number; created_at: string; text: string };
type FriendOption = { friend_id: string; friend_name: string; friend_avatar: string | null };

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const groupId = Number(params.id);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [createdBy, setCreatedBy] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [billOpen, setBillOpen] = useState(false);
  const [billAmount, setBillAmount] = useState("");
  const [billDesc, setBillDesc] = useState("");
  const [billPayer, setBillPayer] = useState<string>("");

  // add members modal
  const [addOpen, setAddOpen] = useState(false);
  const [friendOptions, setFriendOptions] = useState<FriendOption[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user?.id) setCurrentUserId(auth.user.id);
      // group
      const { data: group } = await supabase.from("split_groups").select("name, created_by").eq("id", groupId).single();
      setGroupName(group?.name || "");
      setCreatedBy(group?.created_by || "");
      // members
      const { data: mems } = await supabase
        .from("split_group_member")
        .select("user_id, user:profiles(display_name, avatar_url)")
        .eq("group_id", groupId);
      const normalized: Member[] = (mems || []).map((m: any) => ({
        user_id: m.user_id,
        display_name: m.user?.display_name || "",
        avatar_url: m.user?.avatar_url || null,
      }));
      setMembers(normalized);
      setBillPayer(normalized[0]?.user_id || "");
      // simple activity feed placeholder: recent expenses in this group
      const { data: exps } = await supabase
        .from("expense_transactions")
        .select("id, description, amount, date, user_id")
        .eq("group_id", groupId)
        .order("date", { ascending: false })
        .limit(20);
      const feed: Activity[] = (exps || []).map((e: any) => ({ id: e.id, created_at: e.date, text: `${e.description || "Expense"} • $${e.amount}` }));
      setActivities(feed);
      setLoading(false);
    })();
  }, [groupId]);

  const splitEvenly = useMemo(() => {
    const amt = parseFloat(billAmount || "0");
    if (!amt || members.length === 0) return [] as { user_id: string; amount: number }[];
    const share = Math.round((amt / members.length) * 100) / 100;
    return members.map((m) => ({ user_id: m.user_id, amount: share }));
  }, [billAmount, members]);

  const handleAddBill = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const amount = parseFloat(billAmount);
      if (!amount || !billPayer) {
        toast.error("Enter amount and payer");
        return;
      }

      // create expense row (use a generic category or your UI to choose one later)
      const { data: exp, error: eErr } = await supabase
        .from("expense_transactions")
        .insert([{ user_id: billPayer, date: new Date().toISOString(), amount, category: 1, description: billDesc, is_split_bill: true, group_id: groupId }])
        .select("id")
        .single();
      if (eErr) throw eErr;

      // create expense_splits for all members (even split)
      const rows = splitEvenly.map((s) => ({ expense_id: exp.id, user_id: s.user_id, amount: s.amount }));
      const { error: sErr } = await supabase.from("expense_splits").insert(rows);
      if (sErr) throw sErr;

      toast.success("Bill added and split");
      setBillOpen(false);
      setBillAmount("");
      setBillDesc("");
      // reload activity
      const { data: exps } = await supabase
        .from("expense_transactions")
        .select("id, description, amount, date, user_id")
        .eq("group_id", groupId)
        .order("date", { ascending: false })
        .limit(20);
      const feed: Activity[] = (exps || []).map((e: any) => ({ id: e.id, created_at: e.date, text: `${e.description || "Expense"} • $${e.amount}` }));
      setActivities(feed);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add bill");
    }
  };

  const isOwner = currentUserId && createdBy && currentUserId === createdBy;

  const removeMember = async (userId: string) => {
    try {
      if (!isOwner) return;
      if (userId === createdBy) {
        toast.error("Owner cannot be removed");
        return;
      }
      const supabase = createClient();
      const { error } = await supabase
        .from("split_group_member")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);
      if (error) throw error;
      setMembers(prev => prev.filter(m => m.user_id !== userId));
      toast.success("Member removed");
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove member");
    }
  };

  const openAddMembers = async () => {
    try {
      setSelected({});
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_friends_list");
      if (error) throw error;
      const inGroup = new Set(members.map((m) => m.user_id));
      const options: FriendOption[] = (data || [])
        .filter((f: any) => !inGroup.has(f.friend_id))
        .map((f: any) => ({ friend_id: f.friend_id, friend_name: f.friend_name, friend_avatar: f.friend_avatar }));
      setFriendOptions(options);
      setAddOpen(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load friends");
    }
  };

  const toggle = (id: string) => setSelected((p) => ({ ...p, [id]: !p[id] }));

  const handleAddMembers = async () => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) {
      toast.error("Select at least one friend");
      return;
    }
    try {
      const supabase = createClient();
      const rows = ids.map((uid) => ({ group_id: groupId, user_id: uid }));
      const { error } = await supabase.from("split_group_member").upsert(rows, { onConflict: "group_id,user_id" });
      if (error) throw error;
      // Refresh members
      const { data: mems } = await supabase
        .from("split_group_member")
        .select("user_id, user:profiles(display_name, avatar_url)")
        .eq("group_id", groupId);
      const normalized: Member[] = (mems || []).map((m: any) => ({
        user_id: m.user_id,
        display_name: m.user?.display_name || "",
        avatar_url: m.user?.avatar_url || null,
      }));
      setMembers(normalized);
      toast.success("Members added");
      setAddOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add members");
    }
  };

  return (
    
    <div className="max-w-2xl w-full mx-auto py-8 px-6 gap-4 flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">{groupName || "Group"}</h1>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <Button variant="outline" className="bg-white/10 border-white/20 text-foreground hover:bg-white/20" onClick={openAddMembers}>Add members</Button>
          )}
          <Button onClick={() => setBillOpen(true)} className="bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90">Add Bill</Button>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h2 className="text-sm font-semibold mb-2">Members</h2>
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
              {m.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.avatar_url} alt={m.display_name} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs">{m.display_name?.[0]}</div>
              )}
              <span className="text-sm flex items-center gap-1">{m.display_name} {m.user_id === createdBy && <CheckBadgeIcon className="h-4 w-4 text-[#E9FE52]" />}</span>
              </div>
              {isOwner && m.user_id !== createdBy && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded-md hover:bg-white/10" aria-label="Member actions">
                      <EllipsisHorizontalIcon className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => removeMember(m.user_id)}>Remove from group</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h2 className="text-sm font-semibold mb-2">Activity</h2>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {activities.map((a) => (
              <li key={a.id} className="flex items-center justify-between">
                <span>{a.text}</span>
                <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={billOpen} onOpenChange={setBillOpen}>
        <DialogContent className="bg-form-bg border-form-border max-w-md">
          <DialogTitle className="text-foreground">Add Bill</DialogTitle>
          <div className="space-y-3">
            <Input type="number" placeholder="Amount" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} className="bg-form-bg text-foreground border-form-border" />
            <Input placeholder="Description" value={billDesc} onChange={(e) => setBillDesc(e.target.value)} className="bg-form-bg text-foreground border-form-border" />
            <label className="text-sm">Paid by</label>
            <select value={billPayer} onChange={(e) => setBillPayer(e.target.value)} className="bg-form-bg text-foreground border border-form-border rounded-md px-3 py-2">
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
              ))}
            </select>
            <div className="text-xs text-muted-foreground">Split evenly among {members.length} members.</div>
            <Button onClick={handleAddBill} className="w-full bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-form-bg border-form-border max-w-md">
          <DialogTitle className="text-foreground">Add Members</DialogTitle>
          <div className="space-y-3 max-h-80 overflow-auto pr-1">
            {friendOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No available friends to add.</p>
            ) : (
              friendOptions.map((f) => (
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
              ))
            )}
          </div>
          <Button onClick={handleAddMembers} className="w-full bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90">Add Selected</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}


