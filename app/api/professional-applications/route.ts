import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reason, experience, portfolio_url } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const sessionUser = auth?.user;
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user already has a pending application
    const { data: existingApplication } = await supabase
      .from("professional_applications")
      .select("*")
      .eq("user_id", sessionUser.id)
      .eq("status", "pending")
      .single();

    if (existingApplication) {
      return NextResponse.json(
        { error: "You already have a pending application." },
        { status: 400 }
      );
    }

    // Create new application
    const { data, error } = await supabase
      .from("professional_applications")
      .insert([
        {
          user_id: sessionUser.id,
          reason,
          experience,
          portfolio_url,
          status: "pending",
          submitted_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const sessionUser = auth?.user;
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load caller role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", sessionUser.id)
      .single();

    const isAdmin = (profile?.role || "") === "admin";

    // Non-admins can only see their own applications
    let query = supabase.from("professional_applications").select("*");
    if (!isAdmin) {
      query = query.eq("user_id", sessionUser.id);
    }

    if (userId) {
      if (!isAdmin && userId !== sessionUser.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      query = query.eq("user_id", userId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const sessionUser = auth?.user;
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", sessionUser.id)
      .single();
    const isAdmin = (profile?.role || "") === "admin";
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body as { id?: string; status?: "approved" | "rejected" };
    if (!id || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { error } = await supabase
      .from("professional_applications")
      .update({ status })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
