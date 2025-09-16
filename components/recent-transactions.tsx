"use client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import Link from "next/link";

type Tx = { id: number; title: string; amount: number; category: string; date: string; type: "income"|"expense"|"transfer" };

const formatDate = (iso: string) => {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  } catch {
    return iso;
  }
};

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [expRes, incRes, trfRes] = await Promise.all([
        supabase.from("expense_transactions").select("id, amount, category, date, description").eq("user_id", user.id).order("date", { ascending: false }).limit(5),
        supabase.from("income_transactions").select("id, amount, category_id, date, description").eq("user_id", user.id).order("date", { ascending: false }).limit(5),
        supabase.from("transfer_transactions").select("id, amount, date, description").eq("user_id", user.id).order("date", { ascending: false }).limit(5),
      ]);

      // categories for names
      const [expCats, incCats] = await Promise.all([
        supabase.from("expense_categories").select("id,name,is_default").or(`user_id.eq.${user.id},is_default.eq.true`),
        supabase.from("income_categories").select("id,name,is_default").or(`user_id.eq.${user.id},is_default.eq.true`),
      ]);
      const expCatMap = new Map<number, string>((expCats.data || []).map((c: any) => [c.id, c.name]));
      const incCatMap = new Map<number, string>((incCats.data || []).map((c: any) => [c.id, c.name]));

      const exp: Tx[] = (expRes.data || []).map((e: any) => ({
        id: e.id,
        title: e.description || (expCatMap.get(e.category as number) || "Expense"),
        amount: Number(e.amount || 0) * -1,
        category: expCatMap.get(e.category as number) || "Expense",
        date: e.date,
        type: "expense",
      }));
      const inc: Tx[] = (incRes.data || []).map((i: any) => ({
        id: i.id,
        title: i.description || (incCatMap.get(i.category_id as number) || "Income"),
        amount: Number(i.amount || 0),
        category: incCatMap.get(i.category_id as number) || "Income",
        date: i.date,
        type: "income",
      }));
      const trf: Tx[] = (trfRes.data || []).map((t: any) => ({
        id: t.id,
        title: t.description || "Transfer",
        amount: Number(t.amount || 0),
        category: "Transfer",
        date: t.date,
        type: "transfer",
      }));
      const all = [...exp, ...inc, ...trf].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,5);
      setTransactions(all);
      setLoading(false);
    })();
  }, []);

  return (
    <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm h-full text-foreground">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Recent Transactions</CardTitle>
          <Link href="/protected/transactions" className="text-sm text-gray-400 dark:text-gray-400 hover:text-foreground transition-colors">
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-white/5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-36 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No transactions yet. Start by adding a transaction.
          </div>
        ) : (
        transactions.map((transaction) => (
          <div key={`${transaction.type}-${transaction.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/10 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                transaction.type === 'income' 
                  ? 'bg-emerald-500 text-foreground shadow-lg' 
                  : 'bg-red-500 text-foreground shadow-lg'
              }`}>
                {transaction.type === 'income' ? (
                  <FaArrowDown className="w-4 h-4" />
                ) : (
                  <FaArrowUp className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground text-[13px] leading-tight">{transaction.title}</p>
                <p className="text-xs text-gray-400">{transaction.category}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold text-sm ${
                transaction.type === 'income' ? 'text-emerald-400' : transaction.type === 'expense' ? 'text-red-400' : 'text-blue-400'
              }`}>
                {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}RM {Math.abs(transaction.amount).toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-400">{formatDate(transaction.date)}</p>
            </div>
          </div>
        ))
        )}
      </CardContent>
    </Card>
  );
} 