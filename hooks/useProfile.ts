"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useProfile() {
  const [profile, setProfile] = useState<{
    display_name: string;
    email: string;
    avatar_url?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const PROFILE_CACHE_KEY = "finova:profile";
  const CACHE_TTL_MS = 5 * 60 * 1000;

  useEffect(() => {
    const supabase = createClient();

    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(PROFILE_CACHE_KEY) : null;
      if (raw) {
        const cached = JSON.parse(raw) as { display_name: string; email: string; avatar_url?: string | null; cachedAt: number };
        if (cached?.display_name) {
          setProfile({ display_name: cached.display_name, email: cached.email, avatar_url: cached.avatar_url });
        }
      }
    } catch {}

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("No session");
        setLoading(false);
        try { localStorage.removeItem(PROFILE_CACHE_KEY); } catch {}
        return;
      }

      const userId = session.user.id;
      const email = session.user.email || "";

      let cacheFresh = false;
      try {
        const raw = localStorage.getItem(PROFILE_CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw) as { cachedAt: number; email: string };
          cacheFresh = Date.now() - (cached.cachedAt || 0) < CACHE_TTL_MS && cached.email === email;
          if (cacheFresh) setLoading(false);
        }
      } catch {}

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name,avatar_url")
        .eq("user_id", userId)
        .single();

      if (error) {
        setError(error.message);
      } else {
        console.log(data);
        const fresh = { display_name: data.display_name, email, avatar_url: data.avatar_url };
        setProfile(fresh);
        try {
          localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ ...fresh, cachedAt: Date.now() }));
        } catch {}
      }

      setLoading(false);
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        try { localStorage.removeItem(PROFILE_CACHE_KEY); } catch {}
        setProfile(null);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return { profile, loading, error };
}
