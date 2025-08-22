"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "./ui/skeleton";

type Series = { label: string; color: string; data: number[] };

function getLastSixMonthLabels(): { key: string; label: string; start: string; end: string }[] {
  const now = new Date();
  const months: { key: string; label: string; start: string; end: string }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString(undefined, { month: "short" });
    months.push({ key, label, start: start.toISOString(), end: end.toISOString() });
  }
  return months;
}

export function MonthlyTrend() {
  const [loading, setLoading] = useState(true);
  const [incomeByMonth, setIncomeByMonth] = useState<number[]>(Array(6).fill(0));
  const [expenseByMonth, setExpenseByMonth] = useState<number[]>(Array(6).fill(0));

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const months = getLastSixMonthLabels();
      const startBound = months[0].start;
      const endBound = months[months.length - 1].end;

      // Fetch incomes and expenses within the 6-month window
      const [{ data: inc }, { data: exp }] = await Promise.all([
        supabase
          .from("income_transactions")
          .select("amount,date")
          .eq("user_id", user.id)
          .gte("date", startBound)
          .lte("date", endBound),
        supabase
          .from("expense_transactions")
          .select("id,amount,date,is_split_bill")
          .eq("user_id", user.id)
          .gte("date", startBound)
          .lte("date", endBound),
      ]);

      // Handle split bills for expenses
      const splitIds = (exp || []).filter((e: any) => e.is_split_bill).map((e: any) => e.id);
      let splitMap: Record<number, number> = {};
      if (splitIds.length > 0) {
        const { data: splits } = await supabase
          .from("expense_splits")
          .select("expense_id, amount")
          .in("expense_id", splitIds)
          .eq("user_id", user.id);
        (splits || []).forEach((s: any) => { splitMap[s.expense_id] = Number(s.amount || 0); });
      }

      const monthsIndex = new Map<string, number>();
      getLastSixMonthLabels().forEach((m, idx) => monthsIndex.set(m.key, idx));

      const incomes = Array(6).fill(0);
      (inc || []).forEach((r: any) => {
        const d = new Date(r.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const idx = monthsIndex.get(key);
        if (idx !== undefined) incomes[idx] += Number(r.amount || 0);
      });

      const expenses = Array(6).fill(0);
      (exp || []).forEach((r: any) => {
        const d = new Date(r.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const idx = monthsIndex.get(key);
        if (idx !== undefined) {
          const base = Number(r.amount || 0);
          const amt = r.is_split_bill ? (splitMap[r.id] ?? base) : base;
          expenses[idx] += amt;
        }
      });

      setIncomeByMonth(incomes);
      setExpenseByMonth(expenses);
      setLoading(false);
    })();
  }, []);

  const labels = useMemo(() => getLastSixMonthLabels().map((m) => m.label), []);
  const maxValue = useMemo(() => {
    const m = Math.max(...incomeByMonth, ...expenseByMonth, 1);
    return m;
  }, [incomeByMonth, expenseByMonth]);

  const chartWidth = 560; // will scale to 100% via viewBox
  const chartHeight = 180;
  const padding = { left: 32, right: 16, top: 16, bottom: 28 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const xFor = (i: number) => padding.left + (i * innerW) / (labels.length - 1);
  const yFor = (v: number) => padding.top + innerH - (v / maxValue) * innerH;

  const toPath = (values: number[]) => {
    return values.map((v, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(v)}`).join(" ");
  };

  const incomePath = toPath(incomeByMonth);
  const expensePath = toPath(expenseByMonth);

  return (
    <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">Income vs Expenses (Last 6 months)</CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-400" /> Income</div>
            <div className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-400" /> Expenses</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="h-48 flex flex-col justify-end">
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : (
          <div className="w-full">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-48">
              {/* grid */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => (
                <line key={idx} x1={padding.left} x2={chartWidth - padding.right} y1={padding.top + innerH * p} y2={padding.top + innerH * p} stroke="rgba(255,255,255,0.08)" />
              ))}
              {/* axes labels */}
              {labels.map((l, i) => (
                <text key={l + i} x={xFor(i)} y={chartHeight - 8} textAnchor="middle" fontSize="10" fill="#9CA3AF">{l}</text>
              ))}
              {/* series */}
              <path d={incomePath} fill="none" stroke="#34d399" strokeWidth={2} style={{ strokeDasharray: 1200, strokeDashoffset: 1200, animation: "draw 1.2s ease forwards" }} />
              <path d={expensePath} fill="none" stroke="#f87171" strokeWidth={2} style={{ strokeDasharray: 1200, strokeDashoffset: 1200, animation: "draw 1.2s 0.1s ease forwards" }} />
              {incomeByMonth.map((v, i) => (
                <circle key={`inc-${i}`} cx={xFor(i)} cy={yFor(v)} r={3} fill="#34d399" />
              ))}
              {expenseByMonth.map((v, i) => (
                <circle key={`exp-${i}`} cx={xFor(i)} cy={yFor(v)} r={3} fill="#f87171" />
              ))}
              <style>{`@keyframes draw { to { stroke-dashoffset: 0; } }`}</style>
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


