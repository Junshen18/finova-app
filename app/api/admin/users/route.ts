import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { adminListUsers, adminCreateUser, adminVerifyUser } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false, reason: "unauthorized" } as const;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if ((profile?.role || "") !== "admin") return { allowed: false, reason: "forbidden" } as const;
  return { allowed: true } as const;
}

async function getAdminsCount() {
  const supabase = await createServerClient();
  const { count } = await supabase
    .from("profiles")
    .select("role", { count: "exact", head: true })
    .eq("role", "admin");
  return count || 0;
}

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.allowed) return NextResponse.json({ error: guard.reason }, { status: guard.reason === "unauthorized" ? 401 : 403 });

  const supabase = await createServerClient();
  // Join auth users with profiles
  // We cannot directly list auth users from anon; use admin client for auth list and join with profiles
  const usersData = await adminListUsers(1, 1000);
  const ids = usersData.users.map((u: any) => u.id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, role, avatar_url, email")
    .in("user_id", ids);
  const profileById = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));

  const result = usersData.users.map((u: any) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    email_confirmed_at: (u as any).email_confirmed_at,
    phone: u.phone,
    app_metadata: u.app_metadata,
    user_metadata: u.user_metadata,
    factors: (u as any).factors,
    profile: profileById[u.id] || null,
  }));

  return NextResponse.json({ data: result });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.allowed) return NextResponse.json({ error: guard.reason }, { status: guard.reason === "unauthorized" ? 401 : 403 });

  const body = await req.json().catch(() => ({}));
  const { email, password, display_name, role } = body || {};
  if (!email || !password) return NextResponse.json({ error: "email and password required" }, { status: 400 });

  const created = await adminCreateUser({ email, password, email_confirm: false, user_metadata: {} });
  if (!created?.user) return NextResponse.json({ error: "failed to create" }, { status: 500 });

  const supabase = await createServerClient();
  const { error: profileErr } = await supabase
    .from("profiles")
    .insert({
      user_id: created.user.id,
      email,
      display_name: display_name || email.split("@")[0],
      role: role === "admin" ? "admin" : (role || "user"),
    });
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });

  return NextResponse.json({ data: { id: created.user.id } }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.allowed) return NextResponse.json({ error: guard.reason }, { status: guard.reason === "unauthorized" ? 401 : 403 });

  const body = await req.json().catch(() => ({}));
  const { id, action, updates } = body || {} as { id: string; action: "update_role" | "update_profile" | "verify"; updates?: any };
  if (!id || !action) return NextResponse.json({ error: "id and action required" }, { status: 400 });

  if (action === "update_role") {
    const newRole = (updates?.role || "").trim();
    if (!newRole) return NextResponse.json({ error: "role required" }, { status: 400 });

    const supabase = await createServerClient();
    // Prevent removing the last admin
    if (newRole !== "admin") {
      const adminsCount = await getAdminsCount();
      const { data: target } = await supabase.from("profiles").select("role").eq("user_id", id).single();
      const targetIsAdmin = (target?.role || "") === "admin";
      if (targetIsAdmin && adminsCount <= 1) {
        return NextResponse.json({ error: "at_least_one_admin_required" }, { status: 400 });
      }
    }

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("user_id", id);
    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "update_profile") {
    const supabase = await createServerClient();
    const allowed = { display_name: true, avatar_url: true, email: true } as Record<string, boolean>;
    const payload = Object.fromEntries(Object.entries(updates || {}).filter(([k]) => allowed[k]));
    if (Object.keys(payload).length === 0) return NextResponse.json({ error: "no valid fields" }, { status: 400 });
    const { error } = await supabase.from("profiles").update(payload).eq("user_id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "verify") {
    const updated = await adminVerifyUser(id);
    return NextResponse.json({ ok: true, data: { email_confirmed_at: (updated?.user as any)?.email_confirmed_at } });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

