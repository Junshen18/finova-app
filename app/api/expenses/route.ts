import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      date,
      amount,
      category,
      account_id,
      description,
      img_url,
      is_split_bill,
      group_id,
      client_request_id,
    } = body;

    // Basic validation
    if (!date || !amount || !category || !account_id) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const sessionUser = auth?.user;
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Simple idempotency: reject duplicate requests with same user/date/amount/category/description within 10 seconds
    if (client_request_id) {
      const since = new Date(Date.now() - 10_000).toISOString();
      const { data: dupCheck } = await supabase
        .from("expense_transactions")
        .select("id")
        .eq("user_id", sessionUser.id)
        .gte("date", since)
        .eq("amount", amount)
        .eq("category", category)
        .eq("description", description || null)
        .limit(1);
      if ((dupCheck || []).length > 0) {
        return NextResponse.json({ error: "Duplicate request detected" }, { status: 409 });
      }
    }
    const { data, error } = await supabase.from("expense_transactions").insert([
      {
        user_id: sessionUser.id,
        date,
        amount,
        category,
        account_id,
        description,
        img_url,
        is_split_bill,
        group_id,
      },
    ]).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
