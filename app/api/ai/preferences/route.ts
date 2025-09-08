import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("ai_chat_preferences")
    .select("time_range, include_receipts, redact_merchants, verbosity")
    .eq("user_id", user.id)
    .single();
  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    preferences: data || null,
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { time_range, include_receipts, redact_merchants, verbosity } = body ?? {};

  const upsert = {
    user_id: user.id,
    time_range: time_range ?? null,
    include_receipts: !!include_receipts,
    redact_merchants: redact_merchants !== false,
    verbosity: verbosity ?? 'normal',
    updated_at: new Date().toISOString(),
  } as const;

  const { error } = await supabase
    .from("ai_chat_preferences")
    .upsert(upsert, { onConflict: 'user_id' })
    .select("user_id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}


