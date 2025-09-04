"use client";

import { FaFire, FaRegBell, FaUserGroup, FaCircleUser } from "react-icons/fa6";
import SplitText from "./ui/split-text";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface MainHeaderProps {
    profile: {
      display_name: string;
      avatar_url?: string | null;
    };
}

export default function MainHeader({ profile }: MainHeaderProps) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning,";
    if (hour < 18) return "Good Afternoon,";
    return "Good Evening,";
  }, []);

  const [pendingCount, setPendingCount] = useState<number>(0);
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase.rpc("get_received_friend_requests");
        if (!error) setPendingCount((data || []).length || 0);
      } catch {
        // ignore silently in header
      }
    })();
  }, []);

  return (
    <div className="flex flex-row items-center justify-between w-full pt-2">
      <div className="flex flex-row items-center justify-start w-full gap-2 px-2">
      <Link href="/protected/profile" className="md:hidden w-11 h-11 rounded-full overflow-hidden border border-black/10" aria-label="Profile">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/10">
              <FaCircleUser className="text-foreground/70 text-lg" />
            </div>
          )}
        </Link>
        <div className="flex flex-col items-start justify-center w-fit md:w-full">
          <div>
            <h1 className="text-sm md:text-base font-medium opacity-70">{greeting}</h1>
          </div>
          <SplitText
            text={`${profile?.display_name}.`}
            className="text-base md:text-lg font-semibold text-center"
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
      </div>

      <div className="flex flex-row items-center justify-end w-full gap-2 px-2">
        {/* <div className="bg-white/10 rounded-lg p-2 flex flex-row items-center justify-center gap-1 border border-black/10">
          <FaFire className="text-orange-400 text-lg cursor-pointer" />
          <div className="text-sm font-semibold text-orange-300">6</div>
        </div> */}
        
        <div className="bg-white/10 rounded-lg p-2 flex flex-row items-center justify-center gap-1 border border-black/10">
          <FaRegBell className="text-foreground/70 text-lg cursor-pointer" />
        </div>
        <Link href="/protected/friends" className="relative bg-white/10 rounded-lg p-2 flex flex-row items-center justify-center gap-1 border border-black/10">
          <FaUserGroup className="text-foreground/70 text-lg cursor-pointer" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 min-w-[16px] h-4 rounded-full bg-red-500 text-[10px] leading-4 text-white font-semibold text-center ring-2 ring-black/20">
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </Link>
        
      </div>
    </div>
  );
}