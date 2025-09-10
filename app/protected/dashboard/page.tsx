
import { createClient } from "@/lib/supabase/server";
import BalanceCard from "@/components/balance-card";
import { redirect } from "next/navigation";
import MainHeader from "@/components/main-header";
import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import { DashboardStats } from "@/components/dashboard-stats";
import { RecentTransactions } from "@/components/recent-transactions";
import { SpendingInsights } from "@/components/spending-insights";
import Sidebar from "@/components/side-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import Link from "next/link";
import { SplitSquareHorizontal, BarChart3, Wallet } from "lucide-react";
import { OweSummary } from "@/components/owe-summary";
import { MonthlyTrend } from "@/components/monthly-trend";
import { FriendsQuickAction } from "@/components/friends-quick-action";

export default async function DashboardPage() {
    const supabase = await createClient();
    const profile = await getCurrentUserProfile();

    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
        redirect("/auth/login");
    }
    const user = data.user;

    // Determine empty state: no transactions and no split membership/owe
    const [expenseCountRes, incomeCountRes, transferCountRes, splitMembershipRes] = await Promise.all([
        supabase.from("expense_transactions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("income_transactions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("transfer_transactions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("split_group_member").select("group_id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    const hasAnyTransactions = (expenseCountRes.count || 0) + (incomeCountRes.count || 0) + (transferCountRes.count || 0) > 0;
    const hasAnySplit = (splitMembershipRes.count || 0) > 0;
    
    return (
        <div className="flex min-h-screen w-full justify-center items-start bg-background text-foreground">
            <div className="flex flex-col">
                <div className="flex flex-col items-start justify-start max-w-7xl h-full gap-6 p-4 md:p-6 lg:p-8">
                    <MainHeader profile={profile} />
                    
                    {/* Main Content */}
                    <div className="w-full mx-auto flex flex-col gap-3 md:gap-6">
                        {/* Balance Card Section */}
                        <div className="">
                            <BalanceCard />
                        </div>

                        {/* Quick Actions Row */}
                        <div className="">
                          <div className="grid grid-cols-4 gap-3">
                            <Link href="/protected/groups" className="flex flex-col items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 py-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition">
                              <SplitSquareHorizontal className="w-5 h-5 mb-1" />
                              <span className="text-sm font-medium">Split Bill</span>
                            </Link>
                            <Link href="/protected/transactions" className="flex flex-col items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 py-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition">
                              <BarChart3 className="w-5 h-5 mb-1" />
                              <span className="text-sm font-medium">Cash Flow</span>
                            </Link>
                            <Link href="/protected/accounts" className="flex flex-col items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 py-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition">
                              <Wallet className="w-5 h-5 mb-1" />
                              <span className="text-sm font-medium">Accounts</span>
                            </Link>
                            <FriendsQuickAction />
                          </div>
                        </div>
                        
                        {/* Stats Grid */}
                        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-8"> */}
                            {/* <DashboardStats /> */}
                        {/* </div> */}

                        {/* 6-Month Trend */}
                        <div className="">
                          <MonthlyTrend />
                        </div>
                        
                        {/* Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6 items-stretch">
                            {/* Recent Transactions */}
                            <div className="lg:col-span-2">
                                <RecentTransactions />
                            </div>
                            
                            {/* Spending Insights */}
                            <div className="lg:col-span-1">
                                <SpendingInsights />
                            </div>
                        </div>

                        {/* Owed / Owe Section */}
                        <div className="">
                          <OweSummary />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}