"use client";

import { useEffect, useMemo, useState } from "react";
import SplitBillGame from "@/components/split-bill-game";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import Link from "next/link";

type Group = { id: number; name: string };
type Member = { user_id: string; display_name: string };
type FriendOption = { friend_id: string; friend_name: string };

export default function GamesPage() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [membersByGroup, setMembersByGroup] = useState<Record<number, Member[]>>({});
  const [friendOptions, setFriendOptions] = useState<FriendOption[]>([]);

  const [mode, setMode] = useState<"group" | "manual">("group");
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedFriendIds, setSelectedFriendIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      // Load groups user belongs to
      const { data: memberships } = await supabase
        .from("split_group_member")
        .select("group_id, group:split_groups(id,name)")
        .eq("user_id", userId);
      const uniqueGroups: Record<number, Group> = {} as any;
      (memberships || []).forEach((row: any) => {
        if (row.group) uniqueGroups[row.group.id] = row.group as Group;
      });
      const groupList = Object.values(uniqueGroups);
      setGroups(groupList);

      // Load members for groups
      if (groupList.length > 0) {
        const ids = groupList.map((g) => g.id);
        const { data: mems } = await supabase
          .from("split_group_member")
          .select("group_id, user_id, user:profiles!inner(display_name)")
          .in("group_id", ids);
        const map: Record<number, Member[]> = {};
        (mems || []).forEach((m: any) => {
          if (!map[m.group_id]) map[m.group_id] = [];
          map[m.group_id].push({ user_id: m.user_id, display_name: m.user?.display_name || "Member" });
        });
        setMembersByGroup(map);
      } else {
        setMembersByGroup({});
      }

      // Load friends for manual selection
      const { data: friends } = await supabase.rpc("get_friends_list");
      const friendOpts: FriendOption[] = (friends || []).map((f: any) => ({ friend_id: f.friend_id, friend_name: f.friend_name }));
      setFriendOptions(friendOpts);

      setLoading(false);
    })();
  }, []);

  const participants = useMemo(() => {
    if (mode === "group") {
      const mems = selectedGroupId ? membersByGroup[selectedGroupId] || [] : [];
      return mems.map((m) => m.display_name);
    }
    return friendOptions.filter((f) => selectedFriendIds[f.friend_id]).map((f) => f.friend_name);
  }, [mode, selectedGroupId, membersByGroup, friendOptions, selectedFriendIds]);

  const toggleFriend = (id: string) => setSelectedFriendIds((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="max-w-3xl w-full mx-auto py-8 px-6 gap-6 flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Split Bill Game</h1>
        <Link href="/protected/groups" className="underline text-sm text-muted-foreground hover:text-foreground">Manage groups</Link>
      </div>

      <div className="rounded-2xl border p-4">
        <div className="flex gap-3 mb-4">
          <button
            className={`px-3 py-1 rounded-full text-sm ${mode === "group" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
            onClick={() => setMode("group")}
          >
            Use group
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm ${mode === "manual" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
            onClick={() => setMode("manual")}
          >
            Pick friends
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : mode === "group" ? (
          <div className="flex flex-col gap-3">
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No groups yet. Create one in Groups.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGroupId(g.id)}
                    className={`rounded-xl border p-3 text-left ${selectedGroupId === g.id ? "border-primary" : "border-muted"}`}
                  >
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-muted-foreground">{(membersByGroup[g.id] || []).length} members</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {friendOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No friends yet. Add some in Friends.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {friendOptions.map((f) => (
                  <label key={f.friend_id} className={`cursor-pointer rounded-xl border p-2 text-sm flex items-center gap-2 ${selectedFriendIds[f.friend_id] ? "border-primary" : "border-muted"}`}>
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={!!selectedFriendIds[f.friend_id]}
                      onChange={() => toggleFriend(f.friend_id)}
                    />
                    <span className="truncate">{f.friend_name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {participants.length > 0 ? (
          <SplitBillGame participants={participants} />
        ) : (
          <div className="rounded-2xl border p-8 text-center text-muted-foreground">
            Select a group or choose friends to start the game.
          </div>
        )}
      </motion.div>
    </div>
  );
}