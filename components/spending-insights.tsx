"use client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FaUtensils, FaCar, FaShoppingBag, FaHome, FaGamepad } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "./ui/skeleton";

export function SpendingInsights() {
  const [rows, setRows] = useState<{ name: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: exps } = await supabase
        .from("expense_transactions")
        .select("id, amount, category, is_split_bill")
        .eq("user_id", user.id);
      const splitIds = (exps || []).filter((e: any) => e.is_split_bill).map((e: any) => e.id);
      const { data: splits } = splitIds.length > 0 ? await supabase
        .from("expense_splits").select("expense_id, amount").in("expense_id", splitIds).eq("user_id", user.id) : { data: [] } as any;
      const splitMap: Record<number, number> = {};
      (splits || []).forEach((s: any) => { splitMap[s.expense_id] = Number(s.amount || 0); });

      const { data: cats } = await supabase
        .from("expense_categories")
        .select("id,name,is_default").or(`user_id.eq.${user.id},is_default.eq.true`);
      const catMap = new Map<number, string>((cats || []).map((c: any) => [c.id, c.name]));

      const agg: Record<string, number> = {};
      (exps || []).forEach((e: any) => {
        const name = catMap.get(e.category as number) || "Other";
        const amt = e.is_split_bill ? (splitMap[e.id] ?? Number(e.amount || 0)) : Number(e.amount || 0);
        agg[name] = (agg[name] || 0) + amt;
      });
      const items = Object.entries(agg).map(([name, amount]) => ({ name, amount }));
      items.sort((a,b)=>b.amount-a.amount);
      setRows(items.slice(0, 6));
      setLoading(false);
    })();
  }, []);

  const total = useMemo(() => rows.reduce((s,r)=>s + r.amount, 0), [rows]);
  const categories = useMemo(() => rows.map(r => ({
    name: r.name,
    amount: r.amount,
    percentage: total > 0 ? Math.round((r.amount / total) * 100) : 0,
    icon: FaGamepad,
    color: "bg-gray-500",
  })), [rows, total]);

  return (
    <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-white">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          Array.from({ length: 6 }).map((_,i)=> (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-36 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex items-center gap-2 w-28">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <Skeleton className="h-3 w-6" />
              </div>
            </div>
          ))
        ) : (
        categories.map((category, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${category.color} text-white shadow-lg`}>
                <category.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">{category.name}</p>
                <p className="text-xs text-gray-300">RM {category.amount.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${category.color}`}
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
              <span className="text-xs font-semibold text-gray-300 w-8 text-right">
                {category.percentage}%
              </span>
            </div>
          </div>
        ))
        )}
        
        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Total Spent</span>
            <span className="text-sm font-bold text-white">{loading ? <Skeleton className="h-5 w-24" /> : <>RM {total.toFixed(2)}</>}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 