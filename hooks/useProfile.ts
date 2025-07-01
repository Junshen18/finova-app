"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useProfile() {
  const [profile, setProfile] = useState<{
    display_name: string;
    email: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("No session");
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      const email = session.user.email;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) setError(error.message);
      else setProfile({
        display_name: data.display_name,
        email: email || "",
      });

      setLoading(false);
    };

    fetchProfile();
  }, []);

  return { profile, loading, error };
}
