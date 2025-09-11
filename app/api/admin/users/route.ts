import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { adminListUsers, adminCreateUser, adminVerifyUser, adminDeleteUser, adminBanUser, adminUnbanUser } from "@/lib/supabase/admin";
import { createAdminDbClient } from "@/lib/supabase/adminDb";

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

async function actorName(supa: any) {
  try {
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return null;
    const { data: p } = await supa.from("profiles").select("display_name, email").eq("user_id", user.id).single();
    return p?.display_name || user.email || user.id;
  } catch {
    return null;
  }
}

async function getDisplayNameByUserId(supa: any, userId: string) {
  try {
    const { data: p } = await supa
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", userId)
      .single();
    return p?.display_name || p?.email || null;
  } catch {
    return null;
  }
}

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.allowed) return NextResponse.json({ error: guard.reason }, { status: guard.reason === "unauthorized" ? 401 : 403 });

  const supabase = await createServerClient();
  // Fetch all profiles first, then join in auth details for verification/info
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, display_name, role, avatar_url, is_locked");
  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  // List auth users once and map by id (limited to 1000 per current usage)
  let usersData: { users: any[] } = { users: [] };
  try {
    usersData = await adminListUsers(1, 1000);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown_error";
    console.error("/api/admin/users GET adminListUsers failed:", message);
    // Continue without auth data so at least profiles are returned
  }
  const authById = Object.fromEntries((usersData.users || []).map((u: any) => [u.id, u]));

  const result = (profiles || []).map((p: any) => {
    const u = authById[p.user_id];
    return {
      id: p.user_id,
      email: u?.email || null,
      created_at: u?.created_at ?? null,
      email_confirmed_at: u ? (u as any).email_confirmed_at : null,
      banned_until: u ? (u as any).banned_until : null,
      phone: u?.phone ?? null,
      app_metadata: u?.app_metadata ?? null,
      user_metadata: u?.user_metadata ?? null,
      factors: u ? (u as any).factors : null,
      profile: p,
    };
  });

  return NextResponse.json({ data: result });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.allowed) return NextResponse.json({ error: guard.reason }, { status: guard.reason === "unauthorized" ? 401 : 403 });

  const body = await req.json().catch(() => ({}));
  const { email, password, role } = body || {};
  if (!email || !password) return NextResponse.json({ error: "email and password required" }, { status: 400 });

  let created: any;
  try {
    created = await adminCreateUser({ email, password, email_confirm: false, user_metadata: {} });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown_error";
    console.error("/api/admin/users POST adminCreateUser failed:", message);
    return NextResponse.json({ error: "failed_to_create", message }, { status: 500 });
  }

  const newUserId: string | undefined = (created as any)?.user?.id ?? (created as any)?.id;
  if (!newUserId) {
    console.error("/api/admin/users POST unexpected create response:", created);
    return NextResponse.json({ error: "failed_to_create", message: "Create returned no user id" }, { status: 500 });
  }

  // Use admin DB client to bypass RLS and avoid 500s if policies are not present
  const adminDb = createAdminDbClient();
  // Avoid duplicate key errors if a profile row is created elsewhere (e.g., triggers)
  const { data: existingProfile } = await adminDb
    .from("profiles")
    .select("user_id")
    .eq("user_id", newUserId)
    .maybeSingle();
  if (!existingProfile) {
    const { error: profileErr } = await adminDb
      .from("profiles")
      .insert({
        user_id: newUserId,
        email,
        display_name: email.split("@")[0],
        role: role === "admin" ? "admin" : "user", // restrict to user/admin only
      });
    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  // Log audit
  try {
    const supa = await createServerClient();
    await createAdminDbClient().from("audit_logs").insert({
      actor_id: (await supa.auth.getUser()).data.user?.id || null,
      actor_name: await actorName(supa),
      target_user_id: newUserId,
      target_name: await getDisplayNameByUserId(supa, newUserId),
      action: "create_user",
      details: { role: role === "admin" ? "admin" : "user" },
    });
  } catch {}

  return NextResponse.json({ data: { id: newUserId } }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.allowed) return NextResponse.json({ error: guard.reason }, { status: guard.reason === "unauthorized" ? 401 : 403 });

  const body = await req.json().catch(() => ({}));
  const { id, action, updates } = body || {} as { id: string; action: "update_role" | "update_profile" | "verify" | "delete" | "set_locked"; updates?: any };
  if (!id || !action) return NextResponse.json({ error: "id and action required" }, { status: 400 });

  // Prevent admins from performing destructive actions on themselves
  const supabaseSelf = await createServerClient();
  const { data: { user: actingUser } } = await supabaseSelf.auth.getUser();

  if (action === "update_role") {
    if (actingUser?.id === id) {
      return NextResponse.json({ error: "self_action_not_allowed" }, { status: 400 });
    }
    const newRole = (updates?.role || "").trim();
    if (!newRole) return NextResponse.json({ error: "role required" }, { status: 400 });
    if (!["admin", "user"].includes(newRole)) {
      return NextResponse.json({ error: "invalid_role" }, { status: 400 });
    }

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

    // Audit
    try {
      const supa2 = await createServerClient();
      await createAdminDbClient().from("audit_logs").insert({
        actor_id: actingUser?.id,
        actor_name: await actorName(supa2),
        target_user_id: id,
        target_name: await getDisplayNameByUserId(supa2, id),
        action: "update_role",
        details: { role: newRole },
      });
    } catch {}
    return NextResponse.json({ ok: true });
  }

  if (action === "update_profile") {
    if (actingUser?.id === id) {
      return NextResponse.json({ error: "self_action_not_allowed" }, { status: 400 });
    }
    const supabase = await createServerClient();
    const allowed = { display_name: true, avatar_url: true, email: true } as Record<string, boolean>;
    const payload = Object.fromEntries(Object.entries(updates || {}).filter(([k]) => allowed[k]));
    if (Object.keys(payload).length === 0) return NextResponse.json({ error: "no valid fields" }, { status: 400 });
    const { error } = await supabase.from("profiles").update(payload).eq("user_id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    try {
      const supa3 = await createServerClient();
      await createAdminDbClient().from("audit_logs").insert({
        actor_id: actingUser?.id,
        actor_name: await actorName(supa3),
        target_user_id: id,
        target_name: await getDisplayNameByUserId(supa3, id),
        action: "update_profile",
        details: payload,
      });
    } catch {}
    return NextResponse.json({ ok: true });
  }

  if (action === "verify") {
    if (actingUser?.id === id) {
      return NextResponse.json({ error: "self_action_not_allowed" }, { status: 400 });
    }
    let updated: { user: any } | null = null;
    try {
      updated = await adminVerifyUser(id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "unknown_error";
      console.error("/api/admin/users PATCH verify failed:", message);
      return NextResponse.json({ error: "failed_to_verify", message }, { status: 500 });
    }
    try {
      const supa4 = await createServerClient();
      await createAdminDbClient().from("audit_logs").insert({
        actor_id: actingUser?.id,
        actor_name: await actorName(supa4),
        target_user_id: id,
        target_name: await getDisplayNameByUserId(supa4, id),
        action: "verify_user",
        details: {},
      });
    } catch {}
    return NextResponse.json({ ok: true, data: { email_confirmed_at: (updated?.user as any)?.email_confirmed_at } });
  }

  if (action === "delete") {
    if (actingUser?.id === id) {
      return NextResponse.json({ error: "self_action_not_allowed" }, { status: 400 });
    }
    const supabase = await createServerClient();
    // Capture name before deletion for accurate logging
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", id)
      .single();
    const targetNameSnapshot = targetProfile?.display_name || targetProfile?.email || null;
    // Delete from auth and cleanup profile
    try {
      await adminDeleteUser(id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "unknown_error";
      console.error("/api/admin/users PATCH delete failed:", message);
      return NextResponse.json({ error: "failed_to_delete", message }, { status: 500 });
    }
    await supabase.from("profiles").delete().eq("user_id", id);
    try {
      const supa5 = await createServerClient();
      await createAdminDbClient().from("audit_logs").insert({
        actor_id: actingUser?.id,
        actor_name: await actorName(supa5),
        target_user_id: null,
        target_name: targetNameSnapshot,
        action: "delete_user",
        details: {},
      });
    } catch {}
    return NextResponse.json({ ok: true });
  }

  if (action === "set_locked") {
    if (actingUser?.id === id) {
      return NextResponse.json({ error: "self_action_not_allowed" }, { status: 400 });
    }
    const supabase = await createServerClient();
    const isLocked = Boolean(updates?.is_locked);
    // Update profiles flag
    await supabase.from("profiles").update({ is_locked: isLocked }).eq("user_id", id);
    // Update auth banned_until
    try {
      if (isLocked) {
        // set a far future date
        const farFuture = new Date("2999-12-31T23:59:59.000Z").toISOString();
        await adminBanUser(id, farFuture);
      } else {
        await adminUnbanUser(id);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "unknown_error";
      console.error("/api/admin/users PATCH set_locked failed:", message);
      return NextResponse.json({ error: "failed_to_update_lock", message }, { status: 500 });
    }
    try {
      const supa6 = await createServerClient();
      await createAdminDbClient().from("audit_logs").insert({
        actor_id: actingUser?.id,
        actor_name: await actorName(supa6),
        target_user_id: id,
        target_name: await getDisplayNameByUserId(supa6, id),
        action: isLocked ? "lock_user" : "unlock_user",
        details: {},
      });
    } catch {}
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

