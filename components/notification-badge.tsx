"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

export function NotificationBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchPendingApplications() {
      const supabase = createClient();
      
      const { data: applications } = await supabase
        .from("professional_applications")
        .select("id")
        .eq("status", "pending");

      setCount(applications?.length || 0);
    }

    fetchPendingApplications();
    
    // Set up real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel("professional_applications_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "professional_applications",
        },
        () => {
          fetchPendingApplications();
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
      {count}
    </Badge>
  );
}
