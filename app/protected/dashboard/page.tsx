
import { createClient } from "@/lib/supabase/server";
import BalanceCard from "@/components/balance-card";
import { redirect } from "next/navigation";
import MainHeader from "@/components/main-header";
import { getCurrentUserProfile } from "@/lib/supabase/profiles";

export default async function DashboardPage() {
    const supabase = await createClient();
    const profile = await getCurrentUserProfile();

    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
        redirect("/auth/login");
    }
    return (
        <div className="flex min-h-screen bg-background text-foreground pt-6 px-4">
      <div className="flex flex-col items-center justify-start w-full h-full gap-5">
        <MainHeader profile={profile} />
        <div className="flex flex-col items-start justify-center w-full">
          <BalanceCard />
        </div>
      </div>
    </div>
    )
}