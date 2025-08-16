"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoCircledIcon } from "@radix-ui/react-icons";

export function PendingApplicationBanner() {
  const [hasPendingApplication, setHasPendingApplication] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkPendingApplication() {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check for pending applications
      const { data: applications } = await supabase
        .from("professional_applications")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .single();

      setHasPendingApplication(!!applications);
      setIsLoading(false);
    }

    checkPendingApplication();
  }, []);

  if (isLoading || !hasPendingApplication) return null;

  return (
    <Alert className="mb-4 bg-muted border-muted">
      <InfoCircledIcon className="h-4 w-4" />
      <AlertTitle>Application Under Review</AlertTitle>
      <AlertDescription>
        Your professional role application is currently being reviewed. We&apos;ll notify you once a decision has been made.
      </AlertDescription>
    </Alert>
  );
}
