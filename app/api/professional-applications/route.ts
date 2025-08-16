import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, reason, experience, portfolio_url } = body;

    if (!user_id || !reason) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Check if user already has a pending application
    const { data: existingApplication } = await supabase
      .from("professional_applications")
      .select("*")
      .eq("user_id", user_id)
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
          user_id,
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
    let query = supabase.from("professional_applications").select("*");

    if (userId) {
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
