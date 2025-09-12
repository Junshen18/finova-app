import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  if (sessionId) {
    const { data, error } = await supabase
      .from("ai_chat_turns")
      .select("id, prompt, response, preferences, time_range, created_at")
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ turns: data });
  }

  const { data, error } = await supabase
    .from("ai_chat_sessions")
    .select("id, title, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, prompt, response, preferences, timeRange } = body as {
      sessionId?: string | null;
      prompt: string;
      response: string;
      preferences?: any;
      timeRange?: any;
    };

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let sid = sessionId || null;
    if (!sid) {
      const title = (prompt || "New chat").slice(0, 80);
      const { data, error } = await supabase
        .from("ai_chat_sessions")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      sid = data.id;
    }

    const { error: insertError } = await supabase
      .from("ai_chat_turns")
      .insert({
        session_id: sid,
        user_id: user.id,
        prompt,
        response,
        preferences,
        time_range: timeRange ?? null,
      });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    // bump session updated_at
    await supabase
      .from("ai_chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sid)
      .eq("user_id", user.id);

    return NextResponse.json({ sessionId: sid });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save turn" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (sessionId) {
      // Delete turns then session
      const { error: delTurnsErr } = await supabase
        .from("ai_chat_turns")
        .delete()
        .eq("user_id", user.id)
        .eq("session_id", sessionId);
      if (delTurnsErr) return NextResponse.json({ error: delTurnsErr.message }, { status: 500 });

      const { error: delSessErr } = await supabase
        .from("ai_chat_sessions")
        .delete()
        .eq("user_id", user.id)
        .eq("id", sessionId);
      if (delSessErr) return NextResponse.json({ error: delSessErr.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    // Clear all sessions for this user
    const { data: sess, error: fetchErr } = await supabase
      .from("ai_chat_sessions")
      .select("id")
      .eq("user_id", user.id);
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    const ids = (sess || []).map((s: any) => s.id);
    if (ids.length > 0) {
      const { error: delAllTurnsErr } = await supabase
        .from("ai_chat_turns")
        .delete()
        .eq("user_id", user.id)
        .in("session_id", ids);
      if (delAllTurnsErr) return NextResponse.json({ error: delAllTurnsErr.message }, { status: 500 });
      const { error: delAllSessErr } = await supabase
        .from("ai_chat_sessions")
        .delete()
        .eq("user_id", user.id);
      if (delAllSessErr) return NextResponse.json({ error: delAllSessErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to delete" }, { status: 500 });
  }
}


