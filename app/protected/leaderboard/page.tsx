import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LeaderboardTabs from "@/components/leaderboard-tabs";
import type { LeaderRow } from "@/components/leaderboard-tabs";

// use imported LeaderRow type

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    redirect("/auth/login");
  }

  // Read streaks from user_streaks (source of truth)
  const { data: tableRows } = await supabase
    .from("user_streaks")
    .select("user_id, current_streak, last_active");
  const streakByUser: Record<string, { current_streak: number; last_active: string | null }> = Object.fromEntries(
    (tableRows || []).map((r: any) => [r.user_id, { current_streak: Number(r.current_streak || 0), last_active: r.last_active ?? null }])
  );

  // Fetch all profiles to include users with 0 streaks as well
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url")
    .order("display_name", { ascending: true })
    .limit(1000);
  const selfProfile = (profiles || []).find((p: any) => p.user_id === user.id) || null;

  // Get your current streak early so we can use it in both tabs consistently
  const { data: headerStreakData } = await supabase.rpc("get_user_current_streak");
  const headerStreak = typeof headerStreakData === "number" ? headerStreakData : (streakByUser[user.id]?.current_streak ?? 0);

  // No fallback compute here; authority is user_streaks maintained by triggers

  const globalLeaderboard = (profiles || []).map((p: any) => {
    const isSelf = p.user_id === user.id;
    return {
      user_id: p.user_id,
      display_name: isSelf ? "You" : (p.display_name || "Anonymous"),
      avatar_url: p.avatar_url ?? null,
      current_streak: isSelf ? headerStreak : (streakByUser[p.user_id]?.current_streak ?? 0),
      last_active: streakByUser[p.user_id]?.last_active ?? null,
      rank: 0,
    } as LeaderRow;
  })
  .sort((a, b) => b.current_streak - a.current_streak || a.display_name.localeCompare(b.display_name))
  .map((row, idx) => ({ ...row, rank: idx + 1 }));

  // Friends list and merge streaks; include "You" at the top
  const { data: friendsData } = await supabase.rpc("get_friends_list");
  const friends = (friendsData || []).map((f: any) => ({
    user_id: f.friend_id as string,
    display_name: f.friend_name as string,
    avatar_url: f.friend_avatar ?? null,
  }));

  const youRow = {
    user_id: user.id,
    display_name: "You",
    avatar_url: selfProfile?.avatar_url ?? null,
    current_streak: headerStreak,
    last_active: streakByUser[user.id]?.last_active ?? null,
    rank: 0,
  };

  const friendRows = [youRow, ...friends.map((f: any) => ({
    user_id: f.user_id,
    display_name: f.user_id === user.id ? "You" : f.display_name,
    avatar_url: f.avatar_url,
    current_streak: (streakByUser[f.user_id]?.current_streak ?? 0),
    last_active: streakByUser[f.user_id]?.last_active ?? null,
    rank: 0,
  }))]
    .filter((row, idx, arr) => arr.findIndex((r) => r.user_id === row.user_id) === idx)
    .sort((a, b) => b.current_streak - a.current_streak || a.display_name.localeCompare(b.display_name))
    .map((row, idx) => ({ ...row, rank: idx + 1 }));

  return (
    <div className="flex min-h-screen bg-background text-foreground pt-6 px-4">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Streak Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <LeaderboardTabs globalRows={globalLeaderboard} friendRows={friendRows} noFriends={friendRows.length <= 1} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



