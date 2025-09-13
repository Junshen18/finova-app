"use client";

import { useState } from "react";
import Link from "next/link";
import { FaCircleUser, FaGlobe, FaUserGroup, FaFire, FaMedal } from "react-icons/fa6";

export type LeaderRow = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  current_streak: number;
  last_active: string | null;
  rank: number;
};

export default function LeaderboardTabs({
  globalRows,
  friendRows,
  noFriends,
}: {
  globalRows: LeaderRow[];
  friendRows: LeaderRow[];
  noFriends: boolean;
}) {
  const [active, setActive] = useState<"global" | "friends">("global");

  const rows = active === "global" ? globalRows : friendRows;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          className={`px-3 py-1.5 rounded-md text-sm border ${
            active === "global" ? "bg-white/10 border-white/20" : "border-white/10 hover:bg-white/5"
          }`}
          onClick={() => setActive("global")}
        >
          <span className="inline-flex items-center gap-1"><FaGlobe aria-hidden className="h-4 w-4" /> Global</span>
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 rounded-md text-sm border ${
            active === "friends" ? "bg-white/10 border-white/20" : "border-white/10 hover:bg-white/5"
          }`}
          onClick={() => setActive("friends")}
        >
          <span className="inline-flex items-center gap-1"><FaUserGroup aria-hidden className="h-4 w-4" /> Friends</span>
        </button>
      </div>

      {active === "friends" && noFriends && (
        <div className="text-sm opacity-70 py-6">
          No friends found. <Link href="/protected/friends" className="underline">Go add some friends</Link>.
        </div>
      )}

      {!((active === "friends" && noFriends)) && (
        <div className="divide-y divide-border rounded-md overflow-hidden">
          {rows.length === 0 && (
            <div className="text-sm opacity-70 py-6">No activity yet. Add a transaction to start your streak!</div>
          )}
          {rows.map((row) => {
            const medal = row.rank === 1 ? "text-yellow-300" : row.rank === 2 ? "text-slate-300" : row.rank === 3 ? "text-amber-600" : "";
            return (
            <div key={row.user_id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 text-right font-semibold tabular-nums flex items-center justify-end gap-1">
                  {row.rank}
                  {medal && <FaMedal aria-hidden className={`h-4 w-4 ${medal}`} />}
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden border border-black/10 bg-white/5 flex items-center justify-center">
                  {row.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.avatar_url} alt={row.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaCircleUser className="text-foreground/70 text-lg" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="font-medium">{row.display_name}</div>
                  <div className="text-xs opacity-70">
                    {row.last_active ? `Last active ${new Date(row.last_active).toLocaleDateString()}` : "No activity"}
                  </div>
                </div>
              </div>

              <div className="px-3 py-1 rounded-md bg-white/10 border border-black/10 text-sm font-semibold tabular-nums inline-flex items-center gap-1">
                <FaFire aria-hidden className="h-4 w-4 text-orange-300" /> {row.current_streak} {row.current_streak === 1 ? "day" : "days"}
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}


