"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

type AuditLog = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  target_user_id: string | null;
  target_name: string | null;
  action: string;
  details: any;
  created_at: string;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/audit-logs", { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Failed to load logs (${res.status})`);
        }
        const { data } = await res.json();
        setLogs(data || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load logs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Audit Logs</h1>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : error ? (
            <div className="p-6 text-sm text-red-500">{error}</div>
          ) : logs.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No logs yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-white/10">
                    <th className="py-2 px-4">When</th>
                    <th className="py-2 px-4">Actor</th>
                    <th className="py-2 px-4">Action</th>
                    <th className="py-2 px-4">Target</th>
                    <th className="py-2 px-4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => {
                    const when = new Date(l.created_at).toLocaleString();
                    const actor = l.actor_name || l.actor_id || "-";
                    const target = l.target_name || l.target_user_id || "-";
                    const details = l.details ? JSON.stringify(l.details) : "";
                    const prettyAction = l.action.replace(/_/g, " ");
                    return (
                      <tr key={l.id} className="border-b border-white/5">
                        <td className="py-2 px-4 whitespace-nowrap">{when}</td>
                        <td className="py-2 px-4">{actor}</td>
                        <td className="py-2 px-4 capitalize">{prettyAction}</td>
                        <td className="py-2 px-4">{target}</td>
                        <td className="py-2 px-4 text-xs text-muted-foreground max-w-[420px] truncate" title={details}>{details}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


