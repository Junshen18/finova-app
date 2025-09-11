import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LeaderRow = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  current_streak: number;
  last_active: string | null;
  rank: number;
};

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    redirect("/auth/login");
  }

  const { data: rows, error } = await supabase.rpc("get_streak_leaderboard", { limit_count: 50 });

  if (error) {
    // Fallback: show empty state on error
    return (
      <div className="flex min-h-screen bg-background text-foreground pt-6 px-4">
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Streak Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm opacity-70">Unable to load leaderboard right now.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const leaderboard: LeaderRow[] = (rows || []).map((r: any, idx: number) => ({
    user_id: r.user_id,
    display_name: r.display_name,
    avatar_url: r.avatar_url ?? null,
    current_streak: Number(r.current_streak || 0),
    last_active: r.last_active ?? null,
    rank: idx + 1,
  }));

  return (
    <div className="flex min-h-screen bg-background text-foreground pt-6 px-4">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Streak Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border rounded-md overflow-hidden">
              {leaderboard.length === 0 && (
                <div className="text-sm opacity-70 py-6">No activity yet. Add a transaction to start your streak!</div>
              )}
              {leaderboard.map((row) => (
                <div key={row.user_id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-right font-semibold tabular-nums">{row.rank}</div>
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-black/10 bg-white/5 flex items-center justify-center">
                      {row.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.avatar_url} alt={row.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="font-medium">{row.display_name || "Anonymous"}</div>
                      <div className="text-xs opacity-70">
                        {row.last_active ? `Last active ${new Date(row.last_active).toLocaleDateString()}` : "No activity"}
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-1 rounded-md bg-white/10 border border-black/10 text-sm font-semibold tabular-nums">
                    {row.current_streak} {row.current_streak === 1 ? "day" : "days"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


