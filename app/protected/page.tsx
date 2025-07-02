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
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground pt-6 px-4">
      <div className="flex flex-col items-center justify-start w-full h-full gap-5">
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex flex-col items-start justify-center w-full">
            <div>
              <h1 className="text-sm font-medium opacity-70">Good Morning,</h1>
            </div>
            <SplitText
              text={`${profile?.display_name}.`}
              className="text-xl font-semibold text-center"
              delay={100}
              duration={0.3}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
            />
          </div>
          <div className="flex flex-row items-center justify-end w-full gap-2 px-2">
            <div className="bg-foreground/10 rounded-lg p-2 flex flex-row items-center justify-center gap-1">
              <FaFire className="text-orange-400 text-lg cursor-pointer" />
              <div className="text-sm font-semibold text-orange-300">6</div>
            </div>
            <div className="bg-foreground/10 rounded-lg p-2 flex flex-row items-center justify-center gap-1">
              <FaRegBell className="text-foreground/70 text-lg cursor-pointer" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start justify-center w-full">
          <BalanceCard />
        </div>
      </div>
    </div>
  );
}
