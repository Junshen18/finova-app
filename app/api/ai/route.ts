import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { dummyTransactions } from "@/data/transactions";

type ChatMessage = {
  role: "user" | "model";
  content: string;
};

type Preferences = {
  timeRange?: {
    preset: "last_30_days" | "this_month" | "custom";
    from?: string;
    to?: string;
  };
  includeReceipts?: boolean;
  redactMerchants?: boolean;
  verbosity?: "terse" | "normal" | "detailed";
};

// Simple in-memory per-IP rate limiter (dev-friendly). Resets every minute.
const rateBucket = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_PER_MINUTE = 10;

function takeRate(ip: string): { ok: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const bucket = rateBucket.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBucket.set(ip, { count: 1, resetAt: now + 60_000 });
    return { ok: true };
  }
  if (bucket.count < RATE_LIMIT_PER_MINUTE) {
    bucket.count += 1;
    return { ok: true };
  }
  return { ok: false, retryAfterMs: bucket.resetAt - now };
}

function getClientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return "local";
}

function filterByTimeRange(pref?: Preferences["timeRange"]) {
  if (!pref) return dummyTransactions;
  const now = new Date();
  let from: Date | undefined;
  let to: Date | undefined;
  if (pref.preset === "this_month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to = now;
  } else if (pref.preset === "last_30_days") {
    from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    to = now;
  } else if (pref.preset === "custom" && pref.from && pref.to) {
    from = new Date(pref.from);
    to = new Date(pref.to);
  }
  if (!from || !to) return dummyTransactions;
  return dummyTransactions.filter((t) => {
    const d = new Date(t.date);
    return d >= from! && d <= to!;
  });
}

function redact(text: string): string {
  return text.replace(/([A-Za-z][A-Za-z0-9'&-]{2,})/g, "[REDACTED]");
}

function buildContext(pref: Preferences) {
  const txs = filterByTimeRange(pref.timeRange);
  const total = txs.reduce((acc, t) => acc + t.amount, 0);
  const income = txs.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const expenses = Math.abs(
    txs.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0)
  );
  const sample = txs
    .slice(0, 8)
    .map((t) => ({
      title: pref.redactMerchants ? "[REDACTED]" : t.title,
      amount: t.amount,
      category: t.category,
      date: t.date,
    }));
  const contextObj = {
    aggregates: { totalBalance: total, totalIncome: income, totalExpenses: expenses },
    sampleTransactions: sample,
    includeReceipts: !!pref.includeReceipts,
    notes: pref.redactMerchants ? "Merchants redacted" : "Merchants shown",
  };
  return JSON.stringify(contextObj);
}

export async function POST(req: Request) {
  try {
    const { messages, preferences }: { messages: ChatMessage[]; preferences?: Preferences } = await req.json();

    // Rate limit
    const ip = getClientIp(req);
    const rate = takeRate(ip);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfterMs: rate.retryAfterMs },
        { status: 429 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY. Add it to your environment variables." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prefs: Preferences = {
      redactMerchants: true,
      includeReceipts: false,
      verbosity: "normal",
      ...preferences,
    };

    const context = buildContext(prefs);

    const contents = [
      {
        role: "user",
        parts: [
          {
            text:
              `You are an AI finance assistant. Follow rules: 1) Info only, no financial advice claims; 2) Ground answers only in provided user context; 3) When possible, show tiny citations like totals or example transactions; 4) Respect privacy preferences (merchants may be redacted).\n` +
              `User context (JSON): ${context}`,
          },
        ],
      },
      ...((messages || []).map((m) => ({ role: m.role, parts: [{ text: m.content }] }))),
    ];

    const streamResult = await model.generateContentStream({ contents });

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of streamResult.stream) {
            const t = chunk.text();
            if (t) controller.enqueue(encoder.encode(t));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("/api/ai error", error);
    return NextResponse.json(
      { error: "Failed to generate AI response." },
      { status: 500 }
    );
  }
}



