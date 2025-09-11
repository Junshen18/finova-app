import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import { FaRegBell, FaFire } from "react-icons/fa6";
import SplitText from "@/components/ui/split-text";
import BalanceCard from "@/components/balance-card";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const profile = await getCurrentUserProfile();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  } else {
    if ((profile as any)?.role === "admin") {
      redirect("/protected/admin");
    } else {
      redirect("/protected/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground pt-6 px-4">
      <div className="flex flex-col items-center justify-start w-full h-full gap-5">
        <div className="flex flex-col items-start justify-center w-full">
          <BalanceCard />
        </div>
      </div>
    </div>
  );
}
