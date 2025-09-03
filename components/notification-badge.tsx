"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

export function NotificationBadge() {
  const [count, setCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function fetchPendingApplications() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
      const admin = (profile?.role || "") === "admin";
      setIsAdmin(admin);
      if (!admin) return;

      const res = await fetch("/api/professional-applications?status=pending", { cache: "no-store" });
      if (!res.ok) return;
      const { data: applications } = await res.json();

      setCount(applications?.length || 0);
    }

    fetchPendingApplications();
    
    // Set up real-time subscription
    const supabase = createClient();
    let channel: any;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
      const admin = (profile?.role || "") === "admin";
      if (!admin) return;
      channel = supabase
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
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  if (!isAdmin || count === 0) return null;

  return (
    <Badge variant="destructive" className="ml-2">
      {count}
    </Badge>
  );
}
