export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Turn OCR text into a structured expense object using Gemini
// Request: { text: string }
// Response: { expense: { merchant?: string; amount?: number; date?: string; notes?: string } }
export async function POST(req: Request) {
  try {
    const { text }: { text?: string } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const system = `Extract fields from receipt OCR text and return strict JSON.
Return ONLY a JSON object with keys: merchant, amount, date, notes.
- merchant: string best-guess merchant or issuer
- amount: number total paid (prefer currency lines with keywords like total, amount)
- date: ISO 8601 like 2025-09-15 if found; else empty string
- notes: short free-text summary if helpful
If a field is unknown, use empty string or null appropriately.`;

    const prompt = `${system}\n\n--- OCR TEXT START ---\n${text}\n--- OCR TEXT END ---`;

    const res = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
    const raw = res.response.text();

    let expense = { merchant: "", amount: null as number | null, date: "", notes: "" };
    try {
      const parsed = JSON.parse(raw);
      // Normalize
      if (parsed && typeof parsed === "object") {
        expense.merchant = typeof parsed.merchant === "string" ? parsed.merchant : "";
        const amt = typeof parsed.amount === "number" ? parsed.amount : Number(parsed.amount);
        expense.amount = Number.isFinite(amt) ? amt : null;
        expense.date = typeof parsed.date === "string" ? parsed.date : "";
        expense.notes = typeof parsed.notes === "string" ? parsed.notes : "";
      }
    } catch {
      // If model returned non-JSON, try to salvage via regex
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          const parsed = JSON.parse(m[0]);
          expense.merchant = typeof parsed.merchant === "string" ? parsed.merchant : "";
          const amt = typeof parsed.amount === "number" ? parsed.amount : Number(parsed.amount);
          expense.amount = Number.isFinite(amt) ? amt : null;
          expense.date = typeof parsed.date === "string" ? parsed.date : "";
          expense.notes = typeof parsed.notes === "string" ? parsed.notes : "";
        } catch {}
      }
    }

    return NextResponse.json({ expense, raw });
  } catch (error: any) {
    console.error("/api/ocr/parse error", error?.message || error);
    return NextResponse.json({ error: "Failed to parse OCR text" }, { status: 500 });
  }
}


