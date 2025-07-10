import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      user_id,
      date,
      amount,
      category,
      account_id,
      description,
      img_url,
      is_split_bill,
      group_id,
    } = body;

    // Basic validation
    if (!user_id || !date || !amount || !category || !account_id) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.from("expense_transactions").insert([
      {
        user_id,
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
