"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";

type Category = { id: string; name: string; is_default?: boolean };

function getAvatarObjectPath(input: string): string | null {
  if (!input) return null;
  // If it's already a relative path, normalize and return
  if (!/^https?:\/\//i.test(input)) {
    return input.replace(/^avatars\//, "");
  }
  try {
    const url = new URL(input);
    // Matches: /storage/v1/object/{public|sign|}/avatars/<path>
    const match = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign)?\/?avatars\/(.+)$/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch {}
  return null;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [plan, setPlan] = useState<string>("free");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [currency, setCurrency] = useState<string>("MYR");

  // categories
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [newExpenseCategory, setNewExpenseCategory] = useState("");
  const [newIncomeCategory, setNewIncomeCategory] = useState("");
  const [currencyOptions, setCurrencyOptions] = useState<string[]>([]);

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
          .select("display_name, plan, currency, avatar_url")
          .eq("user_id", user.id)
          .single();

        setDisplayName(profile?.display_name || "");
        setPlan(profile?.plan || "free");

        // Public bucket: use stored public URL directly
        setAvatarUrl((profile?.avatar_url as string | null) || null);

        // currency priority: profile.currency -> localStorage -> default
        const stored = typeof window !== "undefined" ? localStorage.getItem("preferred_currency") : null;
        setCurrency(profile?.currency || stored || "MYR");

        await Promise.all([fetchExpenseCategories(user.id), fetchIncomeCategories(user.id)]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("currencies")
          .select("code")
          .order("code", { ascending: true });
        if (!error && data) {
          setCurrencyOptions(data.map((c: { code: string }) => c.code));
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (currency) {
      try {
        localStorage.setItem("preferred_currency", currency);
      } catch {}
    }
  }, [currency]);

  async function fetchExpenseCategories(userId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("expense_categories")
      .select("id, name, is_default")
      .or(`user_id.eq.${userId},is_default.eq.true`)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });
    setExpenseCategories((data as any) || []);
  }

  async function fetchIncomeCategories(userId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("income_categories")
      .select("id, name, is_default")
      .or(`user_id.eq.${userId},is_default.eq.true`)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });
    setIncomeCategories((data as any) || []);
  }

  async function handleSaveProfile() {
    if (!userId) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName, currency, avatar_url: avatarUrl })
        .eq("user_id", userId);
      if (error) throw error;
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleCurrencyChange(newCurrency: string) {
    setCurrency(newCurrency);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ currency: newCurrency })
        .eq("user_id", userId as string);
      if (error) throw error;
      try { localStorage.setItem("preferred_currency", newCurrency); } catch {}
      toast.success("Currency updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update currency");
    }
  }

  async function handleAvatarSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setAvatarUploading(true);
    try {
      const supabase = createClient();
      const previousAvatarUrl = avatarUrl;
      const ext = file.name.split(".").pop() || "bin";
      const filePath = `${userId}_avatar/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase
        .storage
        .from("avatars")
        .upload(filePath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      // Get public URL and save/display it
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) throw new Error("Could not get public URL");
      setAvatarUrl(publicUrl);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", userId);
      if (updateError) throw updateError;
      if (previousAvatarUrl) {
        const oldPath = getAvatarObjectPath(previousAvatarUrl);
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      }
      toast.success("Avatar updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
      // reset input value so selecting the same file again triggers change
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  async function addCategory(kind: "expense" | "income") {
    if (!userId) return;
    const name = (kind === "expense" ? newExpenseCategory : newIncomeCategory).trim();
    if (!name) return;
    const table = kind === "expense" ? "expense_categories" : "income_categories";
    const supabase = createClient();
    const { data, error } = await supabase
      .from(table)
      .insert({ name, user_id: userId })
      .select("id, name")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (kind === "expense") {
      setExpenseCategories((prev) => [...prev, data as any]);
      setNewExpenseCategory("");
    } else {
      setIncomeCategories((prev) => [...prev, data as any]);
      setNewIncomeCategory("");
    }
  }

  async function removeCategory(kind: "expense" | "income", id: string) {
    const list = kind === "expense" ? expenseCategories : incomeCategories;
    const toRemove = list.find((c) => c.id === id);
    if (toRemove?.is_default) {
      toast.error("Default categories cannot be removed");
      return;
    }
    const table = kind === "expense" ? "expense_categories" : "income_categories";
    const supabase = createClient();
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (kind === "expense") {
      setExpenseCategories((prev) => prev.filter((c) => c.id !== id));
    } else {
      setIncomeCategories((prev) => prev.filter((c) => c.id !== id));
    }
  }

  return (
    <div className="flex bg-background text-foreground md:pt-10 py-4 md:py-8 px-4">
      <div className="flex flex-col w-full gap-4 max-w-2xl h-full mx-auto">
        <h1 className="text-2xl font-bold">Profile Settings</h1>

        <Card className="bg-white/5 dark:bg-white/5 border-white/10">
          <CardContent className="p-4 md:p-6 space-y-6">
            {/* Profile */}
            <section className="space-y-3">
              <h2 className="text-base font-semibold">Profile</h2>
              <div className="flex items-center gap-4">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-lg font-semibold">
                    {displayName ? displayName[0]?.toUpperCase() : "?"}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground">Avatar</label>
                  <div className="flex items-center gap-2">
                    <input id="avatar-input" ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarSelected} className="hidden" />
                    <label htmlFor="avatar-input" className={`px-3 py-1 rounded-md text-sm cursor-pointer ${avatarUploading ? 'pointer-events-none opacity-50' : ''} bg-white/10 border border-white/20 hover:bg-white/20`}>
                      {avatarUploading ? 'Uploading…' : 'Change photo'}
                    </label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Email</label>
                <Input value={userEmail} disabled className="bg-white/10 border-white/10 text-foreground" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Display name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="bg-white/10 border-white/10 text-foreground"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} disabled={loading || saving} className="bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90">
                  {saving ? "Saving..." : "Save changes"}
                </Button>
                <Link href="/auth/update-password" className="text-sm underline underline-offset-4 self-center">
                  Change password
                </Link>
              </div>
            </section>

            {/* Preferences */}
            <section className="space-y-3">
              <h2 className="text-base font-semibold">Preferences</h2>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeSwitcher />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Currency</label>
                  <Select value={currency} onValueChange={handleCurrencyChange}>
                    <SelectTrigger className="w-full bg-white/10 border-white/10 text-foreground">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Categories */}
            <section className="space-y-3">
              <h2 className="text-base font-semibold">Categories</h2>
              <Tabs defaultValue="expense" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="expense">Expense</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                </TabsList>
                <TabsContent value="expense" className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newExpenseCategory}
                      onChange={(e) => setNewExpenseCategory(e.target.value)}
                      placeholder="New expense category"
                      className="bg-white/10 border-white/10 text-foreground"
                    />
                    <Button size="sm" onClick={() => addCategory("expense")} disabled={!newExpenseCategory.trim()}>Add</Button>
                  </div>
                  <ul className="rounded-md border border-white/10 divide-y divide-white/10">
                    {expenseCategories.map((c) => (
                      <li key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="truncate">{c.name}</span>
                        {!c.is_default && (
                          <Button size="sm" variant="ghost" onClick={() => removeCategory("expense", c.id)}>Remove</Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                <TabsContent value="income" className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newIncomeCategory}
                      onChange={(e) => setNewIncomeCategory(e.target.value)}
                      placeholder="New income category"
                      className="bg-white/10 border-white/10 text-foreground"
                    />
                    <Button size="sm" onClick={() => addCategory("income")} disabled={!newIncomeCategory.trim()}>Add</Button>
                  </div>
                  <ul className="rounded-md border border-white/10 divide-y divide-white/10">
                    {incomeCategories.map((c) => (
                      <li key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="truncate">{c.name}</span>
                        {!c.is_default && (
                          <Button size="sm" variant="ghost" onClick={() => removeCategory("income", c.id)}>Remove</Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              </Tabs>
            </section>

            {/* Subscription */}
            <section className="space-y-2">
              <h2 className="text-base font-semibold">Subscription</h2>
              <p className="text-sm text-zinc-400">Current plan: <span className="text-foreground font-medium capitalize">{plan}</span></p>
              <Link href="/protected/account">
                <Button variant="outline" className="bg-white/10 border-white/20 text-foreground hover:bg-white/20">
                  Manage subscription
                </Button>
              </Link>
            </section>

            {/* Feedback & Support */}
            <section className="space-y-2">
              <h2 className="text-base font-semibold">Support</h2>
              <div className="flex flex-col gap-2">
                <Link href="https://forms.gle" target="_blank" className="underline underline-offset-4 text-sm">Send feedback</Link>
                <Link href="mailto:support@finova.app" className="underline underline-offset-4 text-sm">Contact support</Link>
              </div>
            </section>

            {/* Session */}
            <section className="space-y-2">
              <h2 className="text-base font-semibold">Session</h2>
              <Button variant="outline" onClick={handleLogout} className="bg-white/10 border-white/20 text-foreground hover:bg-white/20">
                Log out
              </Button>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}