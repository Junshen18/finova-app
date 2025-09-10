"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

export function FriendNotificationBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchPendingFriendRequests() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabase.rpc("get_received_friend_requests");
        if (!error) {
          setCount((data || []).length || 0);
        }
      } catch {
        // ignore silently
      }
    }

    fetchPendingFriendRequests();
    
    // Set up real-time subscription for friend requests
    const supabase = createClient();
    const channel = supabase
      .channel("friend_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
        },
        () => {
          fetchPendingFriendRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (count === 0) return null;

  return (
    <Badge variant="destructive" className="ml-2">
      {count > 99 ? '99+' : count}
    </Badge>
  );
}