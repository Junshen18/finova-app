
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
import { OweSummary } from "@/components/owe-summary";

export default async function DashboardPage() {
    const supabase = await createClient();
    const profile = await getCurrentUserProfile();

    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
        redirect("/auth/login");
    }
    
    return (
        <div className="flex min-h-screen w-full justify-center items-center bg-background text-foreground">
            <div className="flex flex-col">
                <div className="flex flex-col items-start justify-start max-w-7xl h-full gap-6 p-4 md:p-6 lg:p-8">
                    <MainHeader profile={profile} />
                    
                    {/* Main Content */}
                    <div className="w-full mx-auto">
                        {/* Balance Card Section */}
                        <div className="mb-8">
                            <BalanceCard />
                        </div>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <DashboardStats />
                        </div>
                        
                        {/* Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        <div className="mt-8">
                          <OweSummary />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}