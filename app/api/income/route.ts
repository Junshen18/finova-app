import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, amount, category_id, account_id, description, client_request_id } = body;

    if (!date || !amount || !category_id) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const sessionUser = auth?.user;
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (client_request_id) {
      const since = new Date(Date.now() - 10_000).toISOString();
      const { data: dup } = await supabase
        .from("income_transactions")
        .select("id")
        .eq("user_id", sessionUser.id)
        .gte("date", since)
        .eq("amount", amount)
        .eq("category_id", category_id)
        .eq("description", description || null)
        .limit(1);
      if ((dup || []).length > 0) {
        return NextResponse.json({ error: "Duplicate request detected" }, { status: 409 });
      }
    }
    const { data, error } = await supabase
      .from("income_transactions")
      .insert([
        {
          user_id: sessionUser.id,
          date,
          amount,
          category_id,
          account_id,
          description,
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


