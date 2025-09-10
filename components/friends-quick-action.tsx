"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function FriendsQuickAction() {
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
        // ignore silently
      }
    })();
  }, []);

  return (
    <Link 
      href="/protected/friends" 
      className="relative flex flex-col items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 py-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
    >
      <Users className="w-5 h-5 mb-1" />
      <span className="text-sm font-medium">Friends</span>
      {pendingCount > 0 && (
        <span className="absolute -top-1 -right-1 px-1.5 min-w-[16px] h-4 rounded-full bg-red-500 text-[10px] leading-4 text-white font-semibold text-center ring-2 ring-black/20">
          {pendingCount > 99 ? '99+' : pendingCount}
        </span>
      )}
    </Link>
  );
}