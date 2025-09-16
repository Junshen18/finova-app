"use client";
import { useEffect, useState } from "react";
import { FaAngleUp, FaEllipsis, FaArrowDown, FaArrowUp } from "react-icons/fa6";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "./ui/skeleton";

export default function BalanceCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [incomeTotal, setIncomeTotal] = useState<number>(0);
  const [expenseTotal, setExpenseTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const balance = incomeTotal - expenseTotal;

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Income total
      const { data: incomes } = await supabase
        .from("income_transactions")
        .select("amount")
        .eq("user_id", user.id);
      const income = (incomes || []).reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);

      // Expenses total (respect split bills)
      const { data: expenses } = await supabase
        .from("expense_transactions")
        .select("id, amount, is_split_bill")
        .eq("user_id", user.id);
      const splitIds = (expenses || []).filter((e: any) => e.is_split_bill).map((e: any) => e.id);
      let splitMap: Record<number, number> = {};
      if (splitIds.length > 0) {
        const { data: splits } = await supabase
          .from("expense_splits")
          .select("expense_id, amount")
          .in("expense_id", splitIds)
          .eq("user_id", user.id);
        (splits || []).forEach((s: any) => { splitMap[s.expense_id] = Number(s.amount || 0); });
      }
      const expense = (expenses || []).reduce((sum: number, e: any) => {
        const base = Number(e.amount || 0);
        const amt = e.is_split_bill ? (splitMap[e.id] ?? base) : base;
        return sum + amt;
      }, 0);

      setIncomeTotal(income);
      setExpenseTotal(expense);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="w-full h-44 bg-[#E9FE52] rounded-xl p-6 flex flex-col justify-between shadow-lg">
      <div className="flex flex-col w-full h-full">
        <div className="flex flex-row justify-between items-start w-full">
          <div
            onClick={() => {
              setIsOpen(!isOpen);
            }}
            className="text-sm font-semibold opacity-90 flex flex-row items-center gap-1 cursor-pointer select-none text-black hover:opacity-100 transition-opacity"
          >
            {loading ? <Skeleton className="h-3 w-24" /> : <>Total Balance</>} {" "}
            {/* <FaAngleUp
              className={`text-base ${
                isOpen ? "rotate-180" : ""
              } transition-all duration-300`}
            /> */}
          </div>
          {/* <FaEllipsis className="text-black/70 text-base cursor-pointer hover:text-black transition-colors" /> */}
        </div>
        {/* Balance */}
        <div className="text-3xl font-black text-black tracking-tight">
            {loading ? <Skeleton className="h-8 w-40" /> : <>RM {balance.toFixed(2)}</>}
        </div>
      </div>
      {/* Income & Expenses */}
      <div className="flex flex-row justify-between w-full mt-4">
        {/* Income */}
        <div className="flex flex-col items-start">
          <div className="flex flex-row items-center gap-2">
            <span className="bg-black/20 rounded-full p-1.5">
              <FaArrowDown className="text-black/80 text-sm" />
            </span>
            <span className="text-black/80 text-sm font-semibold">
              Income
            </span>
          </div>
          <div className="text-black text-lg font-bold mt-1">
            {loading ? <Skeleton className="h-5 w-24" /> : <>RM {incomeTotal.toFixed(2)}</>}
          </div>
        </div>
        {/* Expenses */}
        <div className="flex flex-col items-start">
          <div className="flex flex-row items-center gap-2">
            <span className="bg-black/20 rounded-full p-1.5">
              <FaArrowUp className="text-black/80 text-sm" />
            </span>
            <span className="text-black/80 text-sm font-semibold">
              Expenses
            </span>
          </div>
          <div className="text-black text-lg font-bold mt-1">
            {loading ? <Skeleton className="h-5 w-24" /> : <>RM {expenseTotal.toFixed(2)}</>}
          </div>
        </div>
      </div>
    </div>
  );
}
