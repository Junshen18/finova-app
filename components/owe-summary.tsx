"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "./ui/skeleton";

export function OweSummary() {
  const supabase = createClient();
  const [youOwe, setYouOwe] = useState<{ to: string; amount: number }[]>([]);
  const [oweYou, setOweYou] = useState<{ from: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: memberships } = await supabase
        .from("split_group_member")
        .select("group_id, group:split_groups(id,name)")
        .eq("user_id", user.id);
      const groupIds = Array.from(new Set((memberships || []).map((m: any) => m.group_id)));
      if (groupIds.length === 0) { setYouOwe([]); setOweYou([]); setLoading(false); return; }

      const { data: exps } = await supabase
        .from("expense_transactions")
        .select("id, user_id, amount, date, group_id")
        .in("group_id", groupIds);
      const expenseIds = (exps || []).map((e: any) => e.id);
      const payerByExpense: Record<number, string> = Object.fromEntries((exps || []).map((e: any) => [e.id, e.user_id]));

      const aggregateYouOwe: Record<string, number> = {};
      const aggregateOweYou: Record<string, number> = {};

      if (expenseIds.length > 0) {
        const { data: splits } = await supabase
          .from("expense_splits")
          .select("expense_id, user_id, amount")
          .in("expense_id", expenseIds);
        (splits || []).forEach((s: any) => {
          const payer = payerByExpense[s.expense_id];
          if (!payer) return;
          const amt = Number(s.amount || 0);
          if (s.user_id === user.id && payer !== user.id) {
            aggregateYouOwe[payer] = (aggregateYouOwe[payer] || 0) + amt;
          }
          if (s.user_id !== user.id && payer === user.id) {
            aggregateOweYou[s.user_id] = (aggregateOweYou[s.user_id] || 0) + amt;
          }
        });
      }

      const { data: sts } = await supabase
        .from("split_settlements")
        .select("from_user_id, to_user_id, amount")
        .in("group_id", groupIds);
      (sts || []).forEach((s: any) => {
        if (s.from_user_id === user.id) {
          aggregateYouOwe[s.to_user_id] = (aggregateYouOwe[s.to_user_id] || 0) - Number(s.amount || 0);
        }
        if (s.to_user_id === user.id) {
          aggregateOweYou[s.from_user_id] = (aggregateOweYou[s.from_user_id] || 0) - Number(s.amount || 0);
        }
      });

      const youOweList = Object.entries(aggregateYouOwe).map(([to, amount]) => ({ to, amount: Math.round(amount * 100) / 100 })).filter(x=>x.amount>0.01);
      const oweYouList = Object.entries(aggregateOweYou).map(([from, amount]) => ({ from, amount: Math.round(amount * 100) / 100 })).filter(x=>x.amount>0.01);

      const userIds = Array.from(new Set([...youOweList.map(x=>x.to), ...oweYouList.map(x=>x.from)]));
      if (userIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
        const nameById: Record<string, string> = Object.fromEntries((profs || []).map((p: any) => [p.user_id, p.display_name]));
        setYouOwe(youOweList.map(x=>({ to: nameById[x.to] || "Member", amount: x.amount })));
        setOweYou(oweYouList.map(x=>({ from: nameById[x.from] || "Member", amount: x.amount })));
      } else {
        setYouOwe(youOweList as any);
        setOweYou(oweYouList as any);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm">
        <CardHeader className="pb-4"><CardTitle className="text-lg font-semibold text-white">You owe</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_,i)=> (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          ) : youOwe.length === 0 ? <div className="text-sm text-muted-foreground">You're all settled up.</div> : youOwe.map((r,idx)=> (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-gray-300">{r.to}</span>
              <span className="text-red-400 font-semibold">RM {r.amount.toFixed(2)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm">
        <CardHeader className="pb-4"><CardTitle className="text-lg font-semibold text-white">Owe you</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_,i)=> (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          ) : oweYou.length === 0 ? <div className="text-sm text-muted-foreground">No one owes you right now.</div> : oweYou.map((r,idx)=> (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-gray-300">{r.from}</span>
              <span className="text-emerald-400 font-semibold">RM {r.amount.toFixed(2)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}


