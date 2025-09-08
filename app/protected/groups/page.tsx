"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import CreateGroup from "@/components/create-group";
import { toast } from "sonner";
import { FaUserGroup } from "react-icons/fa6";

type Group = {
  id: number;
  name: string;
  created_by: string;
  created_at: string;
};
type Member = {
  group_id: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
};
type FriendOption = {
  friend_id: string;
  friend_name: string;
  friend_avatar: string | null;
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [owedByGroup, setOwedByGroup] = useState<Record<number, number>>({});
  const [hasExpenseByGroup, setHasExpenseByGroup] = useState<Record<number, boolean>>({});

  const [addOpen, setAddOpen] = useState(false);
  const [targetGroup, setTargetGroup] = useState<Group | null>(null);
  const [friendOptions, setFriendOptions] = useState<FriendOption[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const membersByGroup = useMemo(() => {
    const map: Record<number, Member[]> = {};
    for (const m of members) {
      (map[m.group_id] ||= []).push(m);
    }
    return map;
  }, [members]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setLoading(false);
        return;
      }
      setUserId(auth.user.id);

      // 1) Find groups current user belongs to
      const { data: memberships, error } = await supabase
        .from("split_group_member")
        .select(
          "group_id, group:split_groups(id, name, created_by, created_at)"
        )
        .eq("user_id", auth.user.id);
      if (error) {
        toast.error(error.message || "Failed to load groups");
        setLoading(false);
        return;
      }

      const uniqueGroups: Record<number, Group> = {} as any;
      (memberships || []).forEach((row: any) => {
        if (row.group) uniqueGroups[row.group.id] = row.group as Group;
      });
      const groupList = Object.values(uniqueGroups);
      setGroups(groupList);

      // 2) Load members for all groups
      if (groupList.length > 0) {
        const ids = groupList.map((g) => g.id);
        const { data: mems } = await supabase
          .from("split_group_member")
          .select("group_id, user_id, user:profiles!inner(display_name, avatar_url)")
          .in("group_id", ids);
        const normalized: Member[] = (mems || []).map((m: any) => ({
          group_id: m.group_id,
          user_id: m.user_id,
          display_name: m.user?.display_name || "Member",
          avatar_url: m.user?.avatar_url || null,
        }));
        setMembers(normalized);
      } else {
        setMembers([]);
      }

      // Compute owed amounts summary for each group
      await computeOwedForGroups(groupList);

      setLoading(false);
    })();
  }, []);

  const openAddMembers = async (group: Group) => {
    setTargetGroup(group);
    setSelected({});
    setAddOpen(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_friends_list");
      if (error) throw error;
      const inGroup = new Set(
        (membersByGroup[group.id] || []).map((m) => m.user_id)
      );
      const options: FriendOption[] = (data || [])
        .filter((f: any) => !inGroup.has(f.friend_id))
        .map((f: any) => ({
          friend_id: f.friend_id,
          friend_name: f.friend_name,
          friend_avatar: f.friend_avatar,
        }));
      setFriendOptions(options);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load friends");
    }
  };

  const toggle = (id: string) => setSelected((p) => ({ ...p, [id]: !p[id] }));

  const handleAdd = async () => {
    if (!targetGroup) return;
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) {
      toast.error("Select at least one friend");
      return;
    }
    try {
      const supabase = createClient();
      const rows = ids.map((uid) => ({
        group_id: targetGroup.id,
        user_id: uid,
      }));
      const { error } = await supabase
        .from("split_group_member")
        .upsert(rows, { onConflict: "group_id,user_id" });
      if (error) throw error;
      toast.success("Members added");
      setAddOpen(false);
      // refresh members for this group
      const { data: mems } = await supabase
        .from("split_group_member")
        .select("group_id, user_id, user:profiles!inner(display_name, avatar_url)")
        .eq("group_id", targetGroup.id);
      const normalized: Member[] = (mems || []).map((m: any) => ({
        group_id: m.group_id,
        user_id: m.user_id,
        display_name: m.user?.display_name || "Member",
        avatar_url: m.user?.avatar_url || null,
      }));
      setMembers((prev) => {
        const others = prev.filter((m) => m.group_id !== targetGroup.id);
        return [...others, ...normalized];
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to add members");
    }
  };

  const refetchGroups = async () => {
    // re-run initial effect logic in a compact way
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data: memberships } = await supabase
      .from("split_group_member")
      .select("group_id, group:split_groups(id, name, created_by, created_at)")
      .eq("user_id", auth.user.id);
    const uniqueGroups: Record<number, Group> = {} as any;
    (memberships || []).forEach((row: any) => {
      if (row.group) uniqueGroups[row.group.id] = row.group as Group;
    });
    const groupList = Object.values(uniqueGroups);
    setGroups(groupList);
    await computeOwedForGroups(groupList);
  };

  // Compute how much current user owes per group (net of settlements)
  const computeOwedForGroups = async (groupList: Group[]) => {
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      const current = auth.user?.id;
      if (!current || groupList.length === 0) {
        setOwedByGroup({});
        setHasExpenseByGroup({});
        return;
      }
      const groupIds = groupList.map(g => g.id);
      // Load all expenses for these groups
      const { data: expenses } = await supabase
        .from("expense_transactions")
        .select("id, user_id, group_id")
        .in("group_id", groupIds);
      const expenseIds = (expenses || []).map((e: any) => e.id);
      const payerByExpense: Record<number, string> = Object.fromEntries(
        (expenses || []).map((e: any) => [Number(e.id), String(e.user_id)])
      );
      const groupByExpense: Record<number, number> = Object.fromEntries(
        (expenses || []).map((e: any) => [Number(e.id), Number(e.group_id)])
      );
      const hasExp: Record<number, boolean> = {};
      (expenses || []).forEach((e: any) => { hasExp[Number(e.group_id)] = true; });

      let oweMap: Record<number, number> = {};

      if (expenseIds.length > 0) {
        // Your splits in those expenses
        const { data: splits } = await supabase
          .from("expense_splits")
          .select("expense_id, user_id, amount")
          .in("expense_id", expenseIds)
          .eq("user_id", current);
        (splits || []).forEach((s: any) => {
          const expId = Number(s.expense_id);
          const gid = groupByExpense[expId];
          const payer = payerByExpense[expId];
          if (!gid) return;
          if (payer && payer !== current) {
            oweMap[gid] = (oweMap[gid] || 0) + Number(s.amount || 0);
          }
        });
      }

      // Subtract settlements you've paid to others in each group
      const { data: mySts } = await supabase
        .from("split_settlements")
        .select("group_id, amount")
        .in("group_id", groupIds)
        .eq("from_user_id", current);
      (mySts || []).forEach((s: any) => {
        const gid = Number(s.group_id);
        oweMap[gid] = (oweMap[gid] || 0) - Number(s.amount || 0);
      });

      // Round to 2 dp for display stability
      const rounded: Record<number, number> = {};
      groupIds.forEach((gid) => {
        const v = oweMap[gid] || 0;
        rounded[gid] = Math.round(v * 100) / 100;
      });
      setOwedByGroup(rounded);
      setHasExpenseByGroup(hasExp);
    } catch (_) {
      // keep previous values
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto py-4 md:py-8 px-6 gap-4 flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
            <FaUserGroup className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Groups</h1>
        </div>
        <CreateGroup onCreated={refetchGroups} />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : groups.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          No groups yet. Create one to start splitting bills.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((g) => (
            <Card key={g.id} className="bg-white/5 border-white/10">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <Link
                  href={`/protected/groups/${g.id}`}
                  className="flex-1 min-w-0"
                >
                  <div className="font-semibold text-foreground">{g.name}</div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {(membersByGroup[g.id] || []).slice(0, 6).map((m) => (
                      <div key={m.user_id} className="flex items-center gap-2">
                        {m.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.avatar_url} alt={m.display_name} className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[10px]">
                            {m.display_name?.[0]}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground truncate max-w-[90px]">
                          {m.display_name}
                        </span>
                      </div>
                    ))}
                    {membersByGroup[g.id] && membersByGroup[g.id].length > 6 && (
                      <span className="text-xs text-muted-foreground">+{membersByGroup[g.id].length - 6} more</span>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  {hasExpenseByGroup[g.id] ? (
                    (() => {
                      const owed = owedByGroup[g.id] ?? 0;
                      if (Math.abs(owed) < 0.005) {
                        return <span className="text-xs text-muted-foreground">Settled up</span>;
                      }
                      return (
                        <span className="text-xs">
                          You owe <span className="font-medium">RM {Math.abs(owed).toFixed(2)}</span>
                        </span>
                      );
                    })()
                  ) : (
                    <span className="text-xs text-muted-foreground">No record</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-form-bg border-form-border max-w-lg">
          <DialogTitle className="text-foreground">
            Add members to {targetGroup?.name}
          </DialogTitle>
          <div className="space-y-3 max-h-80 overflow-auto pr-1">
            {friendOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No available friends to add.
              </p>
            ) : (
              friendOptions.map((f) => (
                <label
                  key={f.friend_id}
                  className="flex items-center gap-3 text-foreground"
                >
                  <Checkbox
                    checked={!!selected[f.friend_id]}
                    onCheckedChange={() => toggle(f.friend_id)}
                  />
                  {f.friend_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.friend_avatar}
                      alt={f.friend_name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
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
          <Button
            onClick={handleAdd}
            className="w-full bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90"
          >
            Add Selected
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
