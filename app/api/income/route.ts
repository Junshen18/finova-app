import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, date, amount, category_id, account_id, description, client_request_id } = body;

    if (!user_id || !date || !amount || !category_id) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const supabase = await createClient();

    if (client_request_id) {
      const since = new Date(Date.now() - 10_000).toISOString();
      const { data: dup } = await supabase
        .from("income_transactions")
        .select("id")
        .eq("user_id", user_id)
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
          user_id,
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


