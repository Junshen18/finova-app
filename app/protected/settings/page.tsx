"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [plan, setPlan] = useState<string>("free");

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);
        setUserEmail(user.email || "");

        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, plan")
          .eq("user_id", user.id)
          .single();

        setDisplayName(profile?.display_name || "");
        setPlan(profile?.plan || "free");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("user_id", userId);
      if (error) throw error;
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Settings</h1>

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6 md:p-8 space-y-6">
          {/* Profile */}
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Email</label>
                <Input value={userEmail} disabled className="bg-white/10 border-white/10 text-foreground" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Display name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="bg-white/10 border-white/10 text-foreground"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading || saving} className="bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90">
                {saving ? "Saving..." : "Save changes"}
              </Button>
              <Link href="/auth/update-password" className="text-sm underline underline-offset-4 self-center">
                Change password
              </Link>
            </div>
          </section>

          {/* Subscription */}
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Subscription</h2>
            <p className="text-sm text-zinc-400">Current plan: <span className="text-foreground font-medium capitalize">{plan}</span></p>
            <Link href="/protected/account">
              <Button variant="outline" className="bg-white/10 border-white/20 text-foreground hover:bg-white/20">
                Manage subscription
              </Button>
            </Link>
          </section>

          {/* Session */}
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Session</h2>
            <Button variant="outline" onClick={handleLogout} className="bg-white/10 border-white/20 text-foreground hover:bg-white/20">
              Log out
            </Button>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}


