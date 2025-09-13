"use client";

import { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EllipsisHorizontalIcon, CheckBadgeIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { ArrowUpCircle, Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { SelectionModal } from "@/components/selection-modal";

type Member = { user_id: string; display_name: string; avatar_url: string | null };
type Activity = { id: number; created_at: string; text: string; user_id: string };
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
  const [youOwe, setYouOwe] = useState<{ to: string; amount: number }[]>([]);
  const [oweYou, setOweYou] = useState<{ from: string; amount: number }[]>([]);

  const [billOpen, setBillOpen] = useState(false);
  const [billAmount, setBillAmount] = useState("");
  const [billDesc, setBillDesc] = useState("");
  const [billPayer, setBillPayer] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");

  // split method state
  const [splitMethod, setSplitMethod] = useState<"equal" | "percentage" | "custom">("equal");
  const [memberSplits, setMemberSplits] = useState<Record<string, number>>({});

  // accounts (for payer == current user)
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedAccountName, setSelectedAccountName] = useState<string>("");

  // add members modal
  const [addOpen, setAddOpen] = useState(false);
  const [friendOptions, setFriendOptions] = useState<FriendOption[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // view/edit expense modal
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<{ id: number; user_id: string; amount: number; description: string; date: string } | null>(null);
  const [selectedExpenseSplits, setSelectedExpenseSplits] = useState<{ user_id: string; amount: number }[]>([]);
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const [editExpenseAmount, setEditExpenseAmount] = useState<string>("");
  const [editExpenseDesc, setEditExpenseDesc] = useState<string>("");
  // settle modal
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleTargetUserId, setSettleTargetUserId] = useState<string>("");
  const [settleAmount, setSettleAmount] = useState<string>("");
  const [settleNote, setSettleNote] = useState<string>("");
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Helper: fetch group expenses visible to current user via RPC with fallback
  const fetchGroupExpenses = async (supabase: ReturnType<typeof createClient>, groupId: number) => {
    try {
      const { data, error } = await (supabase as any).rpc("get_group_expenses", { p_group_id: groupId });
      if (error) throw error;
      return (data || []) as any[];
    } catch (_) {
      const { data } = await supabase
        .from("expense_transactions")
        .select("id, description, amount, date, user_id")
        .eq("group_id", groupId)
        .order("date", { ascending: false });
      return (data || []) as any[];
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user?.id) setCurrentUserId(auth.user.id);
      // membership check: only allow members of the group to proceed
      if (auth.user?.id) {
        const { data: memCheck, error: memCheckError } = await supabase
          .from("split_group_member")
          .select("user_id")
          .eq("group_id", groupId)
          .eq("user_id", auth.user.id);
        if (!memCheckError && (!memCheck || memCheck.length === 0)) {
          setAuthorized(false);
          toast.error("You do not have access to this group");
          router.replace("/protected/groups");
          setLoading(false);
          return;
        }
        setAuthorized(true);
      }
      // categories (default + user)
      if (auth.user?.id) {
        const { data: cats } = await supabase
          .from("expense_categories")
          .select("id, name, is_default")
          .or(`user_id.eq.${auth.user.id},is_default.eq.true`)
          .order("is_default", { ascending: false })
          .order("name", { ascending: true });
        setCategories((cats as any[])?.map((c) => ({ id: String(c.id), name: c.name })) || []);

        // accounts for current user
        const { data: accs } = await supabase
          .from("account_categories")
          .select("id, name, is_default")
          .or(`user_id.eq.${auth.user.id},is_default.eq.true`)
          .order("name", { ascending: true });
        setAccounts((accs as any[])?.map((a) => ({ id: String(a.id), name: a.name })) || []);
      }
      // group
      const { data: group } = await supabase.from("split_groups").select("name, created_by").eq("id", groupId).single();
      setGroupName(group?.name || "");
      setCreatedBy(group?.created_by || "");
      // members (two-step: split_group_member → profiles)
      console.log("[GroupDetail] Fetching members for group", groupId, "as user", auth.user?.id);
      const { data: memRows, error: memsError } = await supabase
        .from("split_group_member")
        .select("user_id")
        .eq("group_id", groupId);
      console.log("[GroupDetail] member rows", memRows, "error", memsError);
      const memberIds: string[] = (memRows || []).map((r: any) => r.user_id);
      let profilesMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
      if (memberIds.length > 0) {
        const { data: profilesRows, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", memberIds);
        console.log("[GroupDetail] profiles rows", profilesRows, "error", profilesError);
        profilesMap = Object.fromEntries(
          (profilesRows || []).map((p: any) => [p.user_id, { display_name: p.display_name || "Member", avatar_url: p.avatar_url || null }])
        );
      }
      const normalized: Member[] = memberIds.map((uid) => ({
        user_id: uid,
        display_name: profilesMap[uid]?.display_name || "Member",
        avatar_url: profilesMap[uid]?.avatar_url || null,
      }));
      console.log("[GroupDetail] members normalized", normalized);
      setMembers(normalized);
      setBillPayer(normalized[0]?.user_id || "");
      // simple activity feed placeholder: recent expenses in this group (via RPC)
      const exps = await fetchGroupExpenses(supabase, groupId);
      const expenseFeed: Activity[] = (exps || []).slice(0,20).map((e: any) => {
        const payerName = normalized.find((m) => m.user_id === e.user_id)?.display_name || "Someone";
        return { id: e.id, created_at: e.date, user_id: e.user_id, text: `Paid by ${payerName}: ${e.description || "Expense"} • $${e.amount}` };
      });
      // settlements feed
      const { data: sts } = await supabase
        .from("split_settlements")
        .select("id, from_user_id, to_user_id, amount, created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(50);
      const settlementFeed: Activity[] = (sts || []).map((s: any) => {
        const fromName = normalized.find((m) => m.user_id === s.from_user_id)?.display_name || "Someone";
        const toName = normalized.find((m) => m.user_id === s.to_user_id)?.display_name || "Someone";
        return { id: s.id, created_at: s.created_at, user_id: s.from_user_id, text: `Settlement: ${fromName} paid ${toName} $${s.amount}` };
      });
      setActivities([...expenseFeed, ...settlementFeed].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()));

      // compute what current user owes to others in this group
      try {
        const expenseIds = (exps || []).map((e: any) => e.id);
        const payerByExpense: Record<number, string> = Object.fromEntries(
          (exps || []).map((e: any) => [e.id, e.user_id])
        );
        const userIdForCompute = auth.user?.id; // use fresh auth value to avoid state timing
        if (userIdForCompute && expenseIds.length > 0) {
          const { data: splits } = await supabase
            .from("expense_splits")
            .select("expense_id, user_id, amount")
            .in("expense_id", expenseIds)
            .eq("user_id", userIdForCompute);
          const aggregate: Record<string, number> = {};
          (splits || []).forEach((s: any) => {
            const payer = payerByExpense[s.expense_id];
            if (!payer || payer === userIdForCompute) return;
            aggregate[payer] = (aggregate[payer] || 0) + Number(s.amount || 0);
          });
          // subtract settlements you made to those payers
          const { data: mySts } = await supabase
            .from("split_settlements")
            .select("to_user_id, amount")
            .eq("group_id", groupId)
            .eq("from_user_id", userIdForCompute);
          (mySts || []).forEach((s: any) => {
            aggregate[s.to_user_id] = (aggregate[s.to_user_id] || 0) - Number(s.amount || 0);
          });
          const list = Object.entries(aggregate).map(([to, amount]) => ({ to, amount: Math.round(amount * 100) / 100 }));
          setYouOwe(list.filter((x) => x.amount > 0.005));
        } else {
          setYouOwe([]);
        }
      } catch (_) {
        setYouOwe([]);
      }

      // compute what others owe to current user
      try {
        const userIdForCompute = auth.user?.id;
        if (userIdForCompute) {
          const expenseIdsYouPaid = (exps || [])
            .filter((e: any) => e.user_id === userIdForCompute)
            .map((e: any) => e.id);
          if (expenseIdsYouPaid.length > 0) {
            const { data: splitsOwed } = await supabase
              .from("expense_splits")
              .select("expense_id, user_id, amount")
              .in("expense_id", expenseIdsYouPaid)
              .neq("user_id", userIdForCompute);
            const aggregate: Record<string, number> = {};
            (splitsOwed || []).forEach((s: any) => {
              aggregate[s.user_id] = (aggregate[s.user_id] || 0) + Number(s.amount || 0);
            });
            // subtract settlements others have paid you
            const { data: stsToMe } = await supabase
              .from("split_settlements")
              .select("from_user_id, amount")
              .eq("group_id", groupId)
              .eq("to_user_id", userIdForCompute);
            (stsToMe || []).forEach((s: any) => {
              aggregate[s.from_user_id] = (aggregate[s.from_user_id] || 0) - Number(s.amount || 0);
            });
            const list = Object.entries(aggregate).map(([from, amount]) => ({ from, amount: Math.round(amount * 100) / 100 }));
            setOweYou(list.filter((x)=>x.amount>0.005));
          } else {
            setOweYou([]);
          }
        } else {
          setOweYou([]);
        }
      } catch (_) {
        setOweYou([]);
      }
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
      if (!selectedCategoryId) {
        toast.error("Select a category");
        return;
      }

      // build splits
      const buildSplits = (): { user_id: string; amount: number }[] => {
        const memIds = members.map((m) => m.user_id);
        if (splitMethod === "equal") {
          const base = Math.floor((amount / memIds.length) * 100) / 100;
          const rows = memIds.map((id) => ({ user_id: id, amount: base }));
          // adjust last to fix rounding
          const sum = rows.reduce((acc, r) => acc + r.amount, 0);
          rows[rows.length - 1].amount = Math.round((rows[rows.length - 1].amount + (amount - sum)) * 100) / 100;
          return rows;
        }
        if (splitMethod === "percentage") {
          const rows = memIds.map((id) => {
            const pct = Number(memberSplits[id] || 0);
            return { user_id: id, amount: Math.round((amount * (pct / 100)) * 100) / 100 };
          });
          const total = rows.reduce((a, r) => a + r.amount, 0);
          rows[rows.length - 1].amount = Math.round((rows[rows.length - 1].amount + (amount - total)) * 100) / 100;
          return rows;
        }
        // custom amounts
        const rows = memIds.map((id) => ({ user_id: id, amount: Math.round(Number(memberSplits[id] || 0) * 100) / 100 }));
        return rows;
      };

      const rows = buildSplits();
      const totalRows = Math.round(rows.reduce((a, r) => a + r.amount, 0) * 100) / 100;
      if (splitMethod !== "equal" && Math.abs(totalRows - amount) > 0.01) {
        toast.error("Splits must sum to total amount");
        return;
      }

      // create expense row
      const { data: exp, error: eErr } = await supabase
        .from("expense_transactions")
        .insert([{ user_id: billPayer, date: date.toISOString(), amount, category: parseInt(selectedCategoryId), description: billDesc, is_split_bill: true, group_id: groupId, account_id: billPayer === currentUserId && selectedAccountId ? parseInt(selectedAccountId) : undefined }])
        .select("id")
        .single();
      if (eErr) throw eErr;

      // create expense_splits
      const splitRows = rows.map((s) => ({ expense_id: exp.id, user_id: s.user_id, amount: s.amount }));
      const { error: sErr } = await supabase.from("expense_splits").insert(splitRows);
      if (sErr) throw sErr;

      toast.success("Bill added and split");
      setBillOpen(false);
      setBillAmount("");
      setBillDesc("");
      setSelectedCategoryId("");
      setSelectedCategoryName("");
      setSelectedAccountId("");
      setSelectedAccountName("");
      setSplitMethod("equal");
      setMemberSplits({});
      // reload activity
      const { data: exps } = await supabase
        .from("expense_transactions")
        .select("id, description, amount, date, user_id")
        .eq("group_id", groupId)
        .order("date", { ascending: false })
        .limit(20);
      const expenseFeed: Activity[] = (exps || []).map((e: any) => {
        const payerName = members.find((m) => m.user_id === e.user_id)?.display_name || "Someone";
        return { id: e.id, created_at: e.date, user_id: e.user_id, text: `Paid by ${payerName}: ${e.description || "Expense"} • $${e.amount}` };
      });
      const { data: sts } = await supabase
        .from("split_settlements")
        .select("id, from_user_id, to_user_id, amount, created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(50);
      const settlementFeed: Activity[] = (sts || []).map((s: any) => {
        const fromName = members.find((m) => m.user_id === s.from_user_id)?.display_name || "Someone";
        const toName = members.find((m) => m.user_id === s.to_user_id)?.display_name || "Someone";
        return { id: s.id, created_at: s.created_at, user_id: s.from_user_id, text: `Settlement: ${fromName} paid ${toName} $${s.amount}` };
      });
      setActivities([...expenseFeed, ...settlementFeed].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()));

      // recompute owe summary after adding bill
      try {
        const expenseIds = (exps || []).map((e: any) => e.id);
        const payerByExpense: Record<number, string> = Object.fromEntries(
          (exps || []).map((e: any) => [e.id, e.user_id])
        );
        if (currentUserId && expenseIds.length > 0) {
          const { data: splits } = await supabase
            .from("expense_splits")
            .select("expense_id, user_id, amount")
            .in("expense_id", expenseIds)
            .eq("user_id", currentUserId);
          const aggregate: Record<string, number> = {};
          (splits || []).forEach((s: any) => {
            const payer = payerByExpense[s.expense_id];
            if (!payer || payer === currentUserId) return;
            aggregate[payer] = (aggregate[payer] || 0) + Number(s.amount || 0);
          });
          // subtract settlements you made to those payers
          const { data: mySts } = await supabase
            .from("split_settlements")
            .select("to_user_id, amount")
            .eq("group_id", groupId)
            .eq("from_user_id", currentUserId);
          (mySts || []).forEach((s: any) => {
            aggregate[s.to_user_id] = (aggregate[s.to_user_id] || 0) - Number(s.amount || 0);
          });
          const list = Object.entries(aggregate).map(([to, amount]) => ({ to, amount: Math.round(amount * 100) / 100 }));
          setYouOwe(list.filter((x)=>x.amount>0.005));
        } else {
          setYouOwe([]);
        }
      } catch (_) {
        setYouOwe([]);
      }

      // recompute others owe you after adding bill
      try {
        if (currentUserId) {
          const expenseIdsYouPaid = (exps || [])
            .filter((e: any) => e.user_id === currentUserId)
            .map((e: any) => e.id);
          if (expenseIdsYouPaid.length > 0) {
            const { data: splitsOwed } = await supabase
              .from("expense_splits")
              .select("expense_id, user_id, amount")
              .in("expense_id", expenseIdsYouPaid)
              .neq("user_id", currentUserId);
            const aggregate: Record<string, number> = {};
            (splitsOwed || []).forEach((s: any) => {
              aggregate[s.user_id] = (aggregate[s.user_id] || 0) + Number(s.amount || 0);
            });
            // subtract settlements others have already paid you
            const { data: stsToMe } = await supabase
              .from("split_settlements")
              .select("from_user_id, amount")
              .eq("group_id", groupId)
              .eq("to_user_id", currentUserId);
            (stsToMe || []).forEach((s: any) => {
              aggregate[s.from_user_id] = (aggregate[s.from_user_id] || 0) - Number(s.amount || 0);
            });
            const list = Object.entries(aggregate).map(([from, amount]) => ({ from, amount: Math.round(amount * 100) / 100 }));
            setOweYou(list.filter((x)=>x.amount>0.005));
          } else {
            setOweYou([]);
          }
        } else {
          setOweYou([]);
        }
      } catch (_) {
        setOweYou([]);
      }
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
      // Refresh members (two-step)
      console.log("[GroupDetail] Refreshing members after add for group", groupId);
      const { data: memRows2, error: memsError2 } = await supabase
        .from("split_group_member")
        .select("user_id")
        .eq("group_id", groupId);
      console.log("[GroupDetail] member rows (after add)", memRows2, "error", memsError2);
      const memberIds2: string[] = (memRows2 || []).map((r: any) => r.user_id);
      let profilesMap2: Record<string, { display_name: string; avatar_url: string | null }> = {};
      if (memberIds2.length > 0) {
        const { data: profilesRows2, error: profilesError2 } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", memberIds2);
        console.log("[GroupDetail] profiles rows (after add)", profilesRows2, "error", profilesError2);
        profilesMap2 = Object.fromEntries(
          (profilesRows2 || []).map((p: any) => [p.user_id, { display_name: p.display_name || "Member", avatar_url: p.avatar_url || null }])
        );
      }
      const normalized2: Member[] = memberIds2.map((uid) => ({
        user_id: uid,
        display_name: profilesMap2[uid]?.display_name || "Member",
        avatar_url: profilesMap2[uid]?.avatar_url || null,
      }));
      console.log("[GroupDetail] members normalized (after add)", normalized2);
      setMembers(normalized2);
      toast.success("Members added");
      setAddOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add members");
    }
  };

  return (
    
    <div className="max-w-4xl w-full mx-auto py-8 px-6 gap-4 flex flex-col">
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
      </div>
      <div className="grid gap-4 lg:grid-cols-[70%_30%]">
        {/* Left: Activity (70%) */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Activity</h2>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {activities.map((a) => (
                <li key={`${a.created_at}-${a.id}`} className="flex items-center justify-between">
                  <button
                    type="button"
                    className="text-left hover:underline"
                    onClick={async () => {
                      try {
                        if (a.text?.startsWith("Settlement:")) return;
                        const supabase = createClient();
                        const { data, error } = await supabase
                          .from("expense_transactions")
                          .select("id, user_id, amount, description, date")
                          .eq("id", a.id)
                          .single();
                        if (error) throw error;
                        setSelectedExpense(data as any);
                        setEditExpenseAmount(String((data as any).amount));
                        setEditExpenseDesc((data as any).description || "");
                        const { data: splitRows } = await supabase
                          .from("expense_splits")
                          .select("user_id, amount")
                          .eq("expense_id", (data as any).id);
                        setSelectedExpenseSplits((splitRows || []).map((s: any) => ({ user_id: s.user_id, amount: Number(s.amount || 0) })));
                        setViewOpen(true);
                        setIsEditingExpense(false);
                      } catch (err: any) {
                        toast.error(err?.message || "Failed to open expense");
                      }
                    }}
                  >
                    {a.text}
                  </button>
                  <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: Actions + Members (30%) */}
        <div className="flex flex-col gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
        <div className="flex gap-2">
          {isOwner && (
            <Button variant="outline" className="bg-white/10 border-white/20 text-foreground hover:bg-white/20" onClick={openAddMembers}>Add members</Button>
          )}
          <Button onClick={() => setBillOpen(true)} className="bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90">Add Bill</Button>
        </div>
      </div>

          {/* You owe section */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-2">You owe</h2>
            {youOwe.length === 0 ? (
              <p className="text-sm text-muted-foreground">You're all settled up.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {youOwe.map((row) => {
                  const name = members.find((m) => m.user_id === row.to)?.display_name || "Someone";
                  return (
                    <li key={row.to} className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{name}</span>
                      <div className="flex items-center gap-2">
                        <span>${row.amount.toFixed(2)}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSettleTargetUserId(row.to);
                            setSettleAmount(String(row.amount));
                            setSettleNote("");
                            setSettleOpen(true);
                          }}
                        >
                          Settle
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Others owe you section */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-2">Others owe you</h2>
            {oweYou.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one owes you right now.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {oweYou.map((row) => {
                  const name = members.find((m) => m.user_id === row.from)?.display_name || "Someone";
                  return (
                    <li key={row.from} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{name}</span>
                      <span>${row.amount.toFixed(2)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

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
        </div>
      </div>

      <Dialog open={billOpen} onOpenChange={setBillOpen}>
        <DialogContent className="bg-form-bg border-form-border max-w-md">
          <DialogTitle className="text-foreground">Add Bill</DialogTitle>
          <div className="space-y-4">
            {/* Date */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal bg-form-bg text-foreground border-form-border hover:bg-form-hover">
                  {date ? date.toLocaleDateString() : "Select date"}
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto overflow-hidden p-0 bg-form-bg border-form-border" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  captionLayout="dropdown"
                  onSelect={(d) => {
                    if (d) setDate(d);
                    setCalendarOpen(false);
                  }}
                  className="bg-form-bg text-foreground"
                />
              </PopoverContent>
            </Popover>

            {/* Amount */}
            <Input type="number" placeholder="Amount" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} className="bg-form-bg text-foreground border-form-border" />

            {/* Category */}
            <Button type="button" className="w-full bg-form-bg text-foreground border-form-border border justify-start px-3 py-2 hover:bg-form-hover" onClick={() => setCategoryModalOpen(true)}>
              {selectedCategoryName || "Select Category"}
            </Button>

            {/* Note (optional) */}
            <div>
              <label className="text-sm">Note (optional)</label>
              <Textarea
                value={billDesc}
                onChange={(e) => setBillDesc(e.target.value)}
                className="mt-1 bg-form-bg text-foreground border-form-border min-h-[80px]"
                placeholder="What is this bill for?"
              />
            </div>

            {/* Paid by */}
            <div>
            <label className="text-sm">Paid by</label>
              <select value={billPayer} onChange={(e) => setBillPayer(e.target.value)} className="mt-1 w-full bg-form-bg text-foreground border border-form-border rounded-md px-3 py-2">
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
              ))}
            </select>
            </div>

            {/* Account (when payer is current user) */}
            {billPayer === currentUserId && (
              <div>
                <label className="text-sm">Account</label>
                <Button type="button" className="mt-1 w-full bg-form-bg text-foreground border-form-border border justify-start px-3 py-2 hover:bg-form-hover" onClick={() => setAccountModalOpen(true)}>
                  {selectedAccountName || "Select Account"}
                </Button>
              </div>
            )}

            {/* Split method */}
            <div className="space-y-2">
              <label className="text-sm">Split method</label>
              <div className="grid grid-cols-3 gap-2">
                {(["equal","percentage","custom"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setSplitMethod(m)} className={`px-3 py-2 rounded-md border ${splitMethod===m?"bg-white/10 border-white/30":"border-white/10 hover:bg-white/5"}`}>
                    {m.charAt(0).toUpperCase()+m.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Member splits */}
            {splitMethod !== "equal" && (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.user_id} className="flex items-center justify-between gap-3">
                    <span className="text-sm">{m.display_name}</span>
                    {splitMethod === "percentage" ? (
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={memberSplits[m.user_id] ?? 0}
                        onChange={(e) => setMemberSplits((p) => ({ ...p, [m.user_id]: Number(e.target.value) }))}
                        className="w-28 bg-form-bg text-foreground border-form-border"
                        placeholder="%"
                      />
                    ) : (
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={memberSplits[m.user_id] ?? 0}
                        onChange={(e) => setMemberSplits((p) => ({ ...p, [m.user_id]: Number(e.target.value) }))}
                        className="w-28 bg-form-bg text-foreground border-form-border"
                        placeholder="$"
                      />
                    )}
                  </div>
                ))}
                {splitMethod === "percentage" && (
                  <p className="text-xs text-muted-foreground">Ensure total equals 100%.</p>
                )}
              </div>
            )}

            {/* Owed summary */}
            <div className="rounded-md bg-white/5 border border-white/10 p-3 text-sm">
              <p className="font-medium mb-2">{billPayer === currentUserId ? "Split summary" : "Who owes the payer"}</p>
              <ul className="space-y-1">
                {(() => {
                  const amt = parseFloat(billAmount || "0");
                  const memIds = members.map((m) => m.user_id);
                  const calc = () => {
                    if (!amt || memIds.length === 0) return [] as { id: string; amount: number }[];
                    if (splitMethod === "equal") {
                      const base = Math.floor((amt / memIds.length) * 100) / 100;
                      const rows = memIds.map((id) => ({ id, amount: base }));
                      const sum = rows.reduce((a, r) => a + r.amount, 0);
                      rows[rows.length - 1].amount = Math.round((rows[rows.length - 1].amount + (amt - sum)) * 100) / 100;
                      return rows;
                    }
                    if (splitMethod === "percentage") {
                      const rows = memIds.map((id) => {
                        const pct = Number(memberSplits[id] || 0);
                        return { id, amount: Math.round((amt * (pct / 100)) * 100) / 100 };
                      });
                      const sum = rows.reduce((a, r) => a + r.amount, 0);
                      rows[rows.length - 1].amount = Math.round((rows[rows.length - 1].amount + (amt - sum)) * 100) / 100;
                      return rows;
                    }
                    return memIds.map((id) => ({ id, amount: Math.round(Number(memberSplits[id] || 0) * 100) / 100 }));
                  };
                  const rows = calc();
                  const items: JSX.Element[] = [];
                  if (billPayer === currentUserId) {
                    const yourShare = rows.find((r) => r.id === billPayer)?.amount ?? 0;
                    items.push(
                      <li key="you-share" className="flex justify-between">
                        <span className="font-medium">You</span>
                        <span>${yourShare.toFixed(2)}</span>
                      </li>
                    );
                  }
                  rows
                    .filter((r) => r.id !== billPayer)
                    .forEach((r) => {
                      const m = members.find((x) => x.user_id === r.id);
                      const label = r.id === currentUserId ? "You" : (m?.display_name || "");
                      const labelClass = r.id === currentUserId ? "font-medium" : "text-muted-foreground";
                      items.push(
                        <li key={r.id} className="flex justify-between">
                          <span className={labelClass}>{label}</span>
                          <span>${r.amount.toFixed(2)}</span>
                        </li>
                      );
                    });
                  return items;
                })()}
              </ul>
            </div>

            <Button onClick={handleAddBill} className="w-full bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Settle Modal */}
      <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
        <DialogContent className="bg-form-bg border-form-border max-w-md">
          <DialogTitle className="text-foreground">Settle Payment</DialogTitle>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              You are settling with {members.find((m)=>m.user_id===settleTargetUserId)?.display_name || "member"}.
            </div>
            <div>
              <span className="text-sm block mb-1">Amount</span>
              <Input type="number" value={settleAmount} onChange={(e)=>setSettleAmount(e.target.value)} className="bg-form-bg text-foreground border-form-border" />
            </div>
            <div>
              <span className="text-sm block mb-1">Note (optional)</span>
              <Input value={settleNote} onChange={(e)=>setSettleNote(e.target.value)} className="bg-form-bg text-foreground border-form-border" />
            </div>
            <Button
              className="w-full bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90"
              onClick={async ()=>{
                try{
                  const supabase = createClient();
                  const { data: { user } } = await supabase.auth.getUser();
                  if(!user) throw new Error("Not signed in");
                  const amt = parseFloat(settleAmount || "0");
                  if(!amt || !settleTargetUserId){
                    toast.error("Invalid settlement");
                    return;
                  }
                  // record settlement
                  const { error } = await supabase
                    .from("split_settlements")
                    .insert([{ group_id: groupId, from_user_id: user.id, to_user_id: settleTargetUserId, amount: amt, note: settleNote }]);
                  if(error) throw error;
                  toast.success("Settlement recorded");
                  setSettleOpen(false);

                  // Also create a personal expense transaction for the member who settled
                  try {
                    // Prefer user's own categories; fallback to a default one (e.g., Other)
                    const { data: cats } = await supabase
                      .from("expense_categories")
                      .select("id, name, is_default")
                      .or(`user_id.eq.${user.id},is_default.eq.true`)
                      .order("is_default", { ascending: false })
                      .order("name", { ascending: true });
                    const other = (cats || []).find((c: any) => (c.name || "").toLowerCase() === "other");
                    const fallback = other || (cats || [])[0];
                    const categoryId = fallback ? parseInt(String(fallback.id)) : undefined;

                    const payerName = members.find((m) => m.user_id === settleTargetUserId)?.display_name || "payer";
                    const note = `to ${payerName} • ${groupName || "Group"}`;

                    await supabase
                      .from("expense_transactions")
                      .insert([{ user_id: user.id, date: new Date().toISOString(), amount: amt, category: categoryId, description: note, is_split_bill: false, group_id: groupId }]);
                  } catch(_) {
                    // non-fatal: if this fails we still keep the settlement record
                  }

                  // refresh activity
                  const { data: exps } = await supabase
                    .from("expense_transactions")
                    .select("id, description, amount, date, user_id")
                    .eq("group_id", groupId)
                    .order("date", { ascending: false })
                    .limit(20);
                  const expenseFeed: Activity[] = (exps || []).map((e: any) => {
                    const payerName = members.find((m) => m.user_id === e.user_id)?.display_name || "Someone";
                    return { id: e.id, created_at: e.date, user_id: e.user_id, text: `Paid by ${payerName}: ${e.description || "Expense"} • $${e.amount}` };
                  });
                  const { data: sts } = await supabase
                    .from("split_settlements")
                    .select("id, from_user_id, to_user_id, amount, created_at")
                    .eq("group_id", groupId)
                    .order("created_at", { ascending: false })
                    .limit(50);
                  const settlementFeed: Activity[] = (sts || []).map((s: any) => {
                    const fromName = members.find((m) => m.user_id === s.from_user_id)?.display_name || "Someone";
                    const toName = members.find((m) => m.user_id === s.to_user_id)?.display_name || "Someone";
                    return { id: s.id, created_at: s.created_at, user_id: s.from_user_id, text: `Settlement: ${fromName} paid ${toName} $${s.amount}` };
                  });
                  setActivities([...expenseFeed, ...settlementFeed].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()));

                  // refresh owe lists
                  // you owe
                  const expenseIds = (exps || []).map((e: any) => e.id);
                  const payerByExpense: Record<number, string> = Object.fromEntries((exps || []).map((e: any) => [e.id, e.user_id]));
                  if (user.id && expenseIds.length > 0) {
                    const { data: splits } = await supabase
                      .from("expense_splits")
                      .select("expense_id, user_id, amount")
                      .in("expense_id", expenseIds)
                      .eq("user_id", user.id);
                    const aggregate: Record<string, number> = {};
                    (splits || []).forEach((s: any) => {
                      const payer = payerByExpense[s.expense_id];
                      if (!payer || payer === user.id) return;
                      aggregate[payer] = (aggregate[payer] || 0) + Number(s.amount || 0);
                    });
                    const { data: mySts } = await supabase
                      .from("split_settlements")
                      .select("to_user_id, amount")
                      .eq("group_id", groupId)
                      .eq("from_user_id", user.id);
                    (mySts || []).forEach((s: any) => {
                      aggregate[s.to_user_id] = (aggregate[s.to_user_id] || 0) - Number(s.amount || 0);
                    });
                    const list = Object.entries(aggregate).map(([to, amount]) => ({ to, amount: Math.round(amount * 100) / 100 }));
                    setYouOwe(list.filter((x)=>x.amount>0.005));
                  }

                }catch(err:any){
                  toast.error(err?.message || "Failed to settle");
                }
              }}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* View/Edit Expense */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="bg-form-bg border-form-border max-w-md">
          <DialogTitle className="text-foreground">Expense Details</DialogTitle>
          {!selectedExpense ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-4">
              {!isEditingExpense && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsEditingExpense(true)}
                      className="h-9 w-9 bg-form-bg text-foreground border-form-border hover:bg-form-hover"
                      aria-label="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center">
                      <ArrowUpCircle className="w-8 h-8" />
                    </div>
                    <div className="text-3xl font-bold tracking-tight text-foreground">
                      -RM {Number(selectedExpense.amount || 0).toFixed(2)}
                    </div>
                    <div className="text-base font-medium text-foreground">
                      Paid by {members.find(m => m.user_id === selectedExpense.user_id)?.display_name || "Unknown"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(selectedExpense.date).toLocaleDateString()}
                    </div>
                    {selectedExpense.description && (
                      <div className="text-sm text-muted-foreground max-w-md leading-relaxed">{selectedExpense.description}</div>
                    )}
                  </div>

                  {selectedExpenseSplits.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground block mb-1">Split</span>
                      <ul className="space-y-1">
                        {selectedExpenseSplits.map((s) => {
                          const member = members.find((m) => m.user_id === s.user_id);
                          const label = s.user_id === currentUserId ? "You" : (member?.display_name || "Member");
                          const labelClass = s.user_id === currentUserId ? "font-medium" : undefined;
                          return (
                            <li key={s.user_id} className="flex items-center justify-between">
                              <span className={labelClass}>{label}</span>
                              <span>${s.amount.toFixed(2)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setViewOpen(false)} className="bg-form-bg text-foreground border-form-border hover:bg-form-hover">Close</Button>
                  </div>
                </div>
              )}

              {isEditingExpense && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Description</div>
                      <Input value={editExpenseDesc} onChange={(e) => setEditExpenseDesc(e.target.value)} className="bg-form-bg text-foreground border-form-border" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Amount</div>
                      <Input type="number" value={editExpenseAmount} onChange={(e) => setEditExpenseAmount(e.target.value)} className="bg-form-bg text-foreground border-form-border" />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button onClick={() => setIsEditingExpense(false)} variant="outline" className="bg-form-bg text-foreground border-form-border hover:bg-form-hover">Cancel</Button>
                    <Button
                      onClick={async () => {
                        try {
                          if (!selectedExpense) return;
                          const supabase = createClient();
                          const { error } = await supabase
                            .from("expense_transactions")
                            .update({ description: editExpenseDesc, amount: parseFloat(editExpenseAmount || "0") })
                            .eq("id", selectedExpense.id);
                          if (error) throw error;
                          toast.success("Expense updated");
                          setIsEditingExpense(false);
                          setViewOpen(false);
                          // refresh activity
                          const { data: exps } = await supabase
                            .from("expense_transactions")
                            .select("id, description, amount, date, user_id")
                            .eq("group_id", groupId)
                            .order("date", { ascending: false })
                            .limit(20);
                          const feed: Activity[] = (exps || []).map((e: any) => {
                            const payerName = members.find((m) => m.user_id === e.user_id)?.display_name || "Someone";
                            return { id: e.id, created_at: e.date, user_id: e.user_id, text: `Paid by ${payerName}: ${e.description || "Expense"} • $${e.amount}` };
                          });
                          setActivities(feed);
                        } catch (err: any) {
                          toast.error(err?.message || "Failed to update expense");
                        }
                      }}
                      className="bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Category Modal */}
      <SelectionModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
        options={categories}
        selected={selectedCategoryId}
        onSelect={(id: string) => {
          const selected = categories.find((c) => c.id === id);
          setSelectedCategoryId(id);
          setSelectedCategoryName(selected?.name || "");
        }}
        title="Select a Category"
      />

      {/* Account Modal */}
      <SelectionModal
        open={accountModalOpen}
        onOpenChange={setAccountModalOpen}
        options={accounts}
        selected={selectedAccountId}
        onSelect={(id: string) => {
          const selected = accounts.find((a) => a.id === id);
          setSelectedAccountId(id);
          setSelectedAccountName(selected?.name || "");
        }}
        title="Select an Account"
      />
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


