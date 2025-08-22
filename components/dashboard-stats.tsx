"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { FaArrowUp, FaArrowDown, FaCreditCard, FaPiggyBank } from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "./ui/skeleton";

export function DashboardStats() {
  const [incomeThisMonth, setIncomeThisMonth] = useState(0);
  const [expenseThisMonth, setExpenseThisMonth] = useState(0);
  // Removed last month cards; will show 6-month trend separately
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const startOfThisMonth = startOfMonth;
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      // Income sums
      const [{ data: incThis }] = await Promise.all([
        supabase.from("income_transactions").select("amount,date").eq("user_id", user.id).gte("date", startOfThisMonth),
      ]);
      const incomeT = (incThis || []).reduce((s, r: any) => s + Number(r.amount || 0), 0);

      // Expenses sums with split handling
      const [{ data: expThis }] = await Promise.all([
        supabase.from("expense_transactions").select("id,amount,is_split_bill,date").eq("user_id", user.id).gte("date", startOfThisMonth),
      ]);

      const computeExpense = async (rows: any[]) => {
        const splitIds = rows.filter(r => r.is_split_bill).map(r => r.id);
        let map: Record<number, number> = {};
        if (splitIds.length > 0) {
          const { data: splits } = await supabase.from("expense_splits").select("expense_id,amount").in("expense_id", splitIds).eq("user_id", user.id);
          (splits || []).forEach((s: any) => { map[s.expense_id] = Number(s.amount || 0); });
        }
        return rows.reduce((sum, r: any) => sum + (r.is_split_bill ? (map[r.id] ?? Number(r.amount || 0)) : Number(r.amount || 0)), 0);
      };

      const [expT] = await Promise.all([
        computeExpense(expThis || []),
      ]);

      setIncomeThisMonth(incomeT);
      setExpenseThisMonth(expT);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    return [
      {
        title: "Income (This Month)",
        amount: `RM ${incomeThisMonth.toFixed(2)}`,
        change: "",
        icon: FaArrowDown,
        color: "bg-emerald-100 text-emerald-700",
        iconBg: "bg-emerald-500",
      },
      {
        title: "Expenses (This Month)",
        amount: `RM ${expenseThisMonth.toFixed(2)}`,
        change: "",
        icon: FaArrowUp,
        color: "bg-red-100 text-red-700",
        iconBg: "bg-red-500",
      },
    ];
  }, [incomeThisMonth, expenseThisMonth]);

  return (
    <>
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white/5 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-300 mb-1">{loading ? <Skeleton className="h-3 w-32" /> : stat.title}</p>
                <p className="text-xl font-bold text-white">{loading ? <Skeleton className="h-7 w-32 rounded-lg" /> : stat.amount}</p>
                {stat.change && (
                  <div className="flex items-center gap-1 mt-1">
                    {loading ? <Skeleton className="h-5 w-16 rounded-full" /> : (
                      <span className={`text-xs font-semibold ${stat.color} px-2 py-1 rounded-full`}>
                        {stat.change}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {loading ? <Skeleton className="h-10 w-10 rounded-full" /> : (
                <div className={`p-3 rounded-full ${stat.iconBg} text-white shadow-lg`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}