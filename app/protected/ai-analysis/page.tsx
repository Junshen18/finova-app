"use client";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  FaRobot, 
  FaUser, 
  FaPaperPlane,
  FaCog,
  FaHistory,
  FaRegEdit
} from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";

interface ChatMessage {
  id: number;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

type Verbosity = 'terse' | 'normal' | 'detailed';
type TimeRange = { preset: 'last_30_days' | 'this_month' | 'custom'; from?: string; to?: string };
type PreferencesState = {
  timeRange: TimeRange;
  includeReceipts: boolean;
  redactMerchants: boolean;
  verbosity: Verbosity;
};

export default function AIAnalysisPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'model',
      content: "Hi! I'm your AI finance assistant. Ask anything about spending, savings, budgeting, or investments.",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [preferences, setPreferences] = useState<PreferencesState>({
    timeRange: { preset: 'last_30_days' },
    includeReceipts: false,
    redactMerchants: true,
    verbosity: 'normal',
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessions, setSessions] = useState<{ id: string; title: string; created_at: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [totalIncomeAll, setTotalIncomeAll] = useState<number>(0);
  const [totalExpenseAll, setTotalExpenseAll] = useState<number>(0);
  const [monthIncomeTotal, setMonthIncomeTotal] = useState<number>(0);
  const [monthExpenses, setMonthExpenses] = useState<{ id: number; date: string; amount: number; description: string | null }[]>([]);
  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/ai/history', { credentials: 'include' as RequestCredentials });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {}
  };

  const fetchTurns = async (sid: string) => {
    try {
      const r = await fetch(`/api/ai/history?session_id=${sid}`, { credentials: 'include' as RequestCredentials });
      if (r.ok) {
        const d = await r.json();
        const turns = (d.turns || []) as { prompt: string; response: string; created_at: string }[];
        const rebuilt: ChatMessage[] = [];
        turns.forEach((t, idx) => {
          rebuilt.push({ id: idx * 2 + 1, role: 'user', content: t.prompt, timestamp: new Date(t.created_at) });
          rebuilt.push({ id: idx * 2 + 2, role: 'model', content: t.response, timestamp: new Date(t.created_at) });
        });
        if (rebuilt.length > 0) setMessages(rebuilt);
        setSessionId(sid);
      }
    } catch {}
  };

  // Simple suggestion chips
  const suggestions = [
    "Summarize my spending this month",
    "What's my savings rate?",
    "Create a simple 50/30/20 budget",
    "How can I save more next month?",
  ];

  useEffect(() => {
    // messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load saved preferences on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/ai/preferences');
        if (res.ok) {
          const data = await res.json();
          const p = data?.preferences;
          if (p) {
            setPreferences({
              timeRange: p.time_range ?? { preset: "last_30_days" },
              includeReceipts: !!p.include_receipts,
              redactMerchants: p.redact_merchants !== false,
              verbosity: (p.verbosity ?? 'normal') as 'terse' | 'normal' | 'detailed',
            });
          }
        }
      } catch {}
    })();
  }, []);

  // Load financial context on mount
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id || null;
        setUserId(uid);
        if (!uid) return;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [incAllRes, expAllRes, incMonthRes, expMonthRes] = await Promise.all([
          supabase.from("income_transactions").select("amount").eq("user_id", uid),
          supabase.from("expense_transactions").select("amount").eq("user_id", uid),
          supabase.from("income_transactions").select("amount").eq("user_id", uid).gte("date", startOfMonth),
          supabase
            .from("expense_transactions")
            .select("id, date, amount, description")
            .eq("user_id", uid)
            .gte("date", startOfMonth)
            .order("date", { ascending: false })
        ]);

        const sum = (rows: any[] | null | undefined) => (rows || []).reduce((a, r) => a + Number(r.amount || 0), 0);
        setTotalIncomeAll(sum((incAllRes.data as any[]) || []));
        setTotalExpenseAll(sum((expAllRes.data as any[]) || []));
        setMonthIncomeTotal(sum((incMonthRes.data as any[]) || []));
        setMonthExpenses(((expMonthRes.data as any[]) || []).map((e) => ({ id: e.id, date: e.date, amount: Number(e.amount || 0), description: e.description ?? null })));
      } catch (_) {}
    })();
  }, []);

  // Initial load: fetch sessions and auto-load latest session turns (if any)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/ai/history', { credentials: 'include' as RequestCredentials });
        if (res.ok) {
          const data = await res.json();
          const sess = (data.sessions || []) as { id: string }[];
          setSessions(sess as any);
          if (sess.length > 0) {
            await fetchTurns(sess[0].id);
          }
        }
      } catch {}
    })();
  }, []);

  const sendMessage = async (text: string, displayText?: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      role: 'user',
      content: displayText ?? text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const payload = {
        messages: [
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: text }
        ],
        preferences,
      };

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status === 429) {
        const data = await res.json();
        const retryMs = data?.retryAfterMs ?? 30_000;
        const aiMessage: ChatMessage = {
          id: userMessage.id + 1,
          role: 'model',
          content: `Rate limit exceeded. Try again in ~${Math.ceil(retryMs/1000)}s.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
      }
      if (!res.ok || !res.body) throw new Error('Failed to get AI response');

      // Stream reader
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          accumulated += decoder.decode(value, { stream: true });
          // progressively update last AI message
          setMessages(prev => {
            const existing = prev[prev.length - 1];
            if (existing && existing.role === 'model' && existing.id === userMessage.id + 1) {
              const updated = [...prev];
              updated[updated.length - 1] = { ...existing, content: accumulated };
              return updated;
            } else {
              return [
                ...prev,
                { id: userMessage.id + 1, role: 'model', content: accumulated, timestamp: new Date() }
              ];
            }
          });
        }
      }

      // Persist turn
      try {
        const save = await fetch('/api/ai/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            prompt: (displayText ?? text),
            response: accumulated,
            preferences,
            timeRange: preferences.timeRange,
          }),
          credentials: 'include' as RequestCredentials,
        });
        if (save.ok) {
          const data = await save.json();
          if (!sessionId && data?.sessionId) setSessionId(data.sessionId as string);
        }
      } catch {}
    } catch (e) {
      const errMessage: ChatMessage = {
        id: messages.length + 2,
        role: 'model',
        content: 'Something went wrong. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Send typed input with hidden context
  const handleSendMessage = () => {
    const text = inputMessage;
    if (!text.trim()) return;
    const currency = (n: number) => `RM${n.toFixed(2)}`;
    const lines: string[] = [];
    lines.push(`Total income (all time): ${currency(totalIncomeAll)}`);
    lines.push(`Total expense (all time): ${currency(totalExpenseAll)}`);
    lines.push(`This month income: ${currency(monthIncomeTotal)}`);
    const txLines = monthExpenses.slice(0, 100).map((e) => `${new Date(e.date).toLocaleDateString()}: ${currency(Number(e.amount || 0))}${e.description ? ` • ${e.description}` : ""}`);
    lines.push(`This month expenses (${monthExpenses.length}):`);
    if (txLines.length) lines.push(...txLines);
    const contextBlock = `\n\nContext (auto-provided):\n${lines.join("\n")}`;
    const combined = `${text}${contextBlock}`;
    return sendMessage(combined, text);
  };

  // Autofill and auto-send suggestion with context
  const handleSuggestionClick = async (template: string) => {
    // Fill known placeholders, leave goal/fill-in ones untouched
    const currency = (n: number) => `RM${n.toFixed(2)}`;
    let filled = template;
    // Replace [amount] with this month's income total if present
    if (filled.includes("[amount]")) {
      filled = filled.replace("[amount]", monthIncomeTotal > 0 ? monthIncomeTotal.toFixed(2) : "0.00");
    }
    // Build context block
    const lines: string[] = [];
    lines.push(`Total income (all time): ${currency(totalIncomeAll)}`);
    lines.push(`Total expense (all time): ${currency(totalExpenseAll)}`);
    lines.push(`This month income: ${currency(monthIncomeTotal)}`);
    const txLines = monthExpenses.slice(0, 100).map((e) => `${new Date(e.date).toLocaleDateString()}: ${currency(Number(e.amount || 0))}${e.description ? ` • ${e.description}` : ""}`);
    lines.push(`This month expenses (${monthExpenses.length}):`);
    if (txLines.length) lines.push(...txLines);
    const contextBlock = `\n\nContext (auto-provided):\n${lines.join("\n")}`;
    const combined = `${filled}${contextBlock}`;
    await sendMessage(combined, filled);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground pt-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
        <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
              <FaRobot className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">AI Financial Analysis</h1>
              <p className="text-gray-400 text-[10px] md:text-sm">Get personalized insights and chat about your finances</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                setSessionId(null);
                setInputMessage("");
                setMessages([
                  {
                    id: 1,
                    role: 'model',
                    content: "Hi! I'm your AI finance assistant. Ask anything about spending, savings, budgeting, or investments.",
                    timestamp: new Date()
                  }
                ]);
              }}
            >
              <FaRegEdit className="w-4 h-4" /> 
            </Button>
            <Button variant="secondary" size="icon" onClick={() => setHistoryOpen(true)}>
              <FaHistory className="w-4 h-4" />
            </Button>
            <Dialog open={openSettings} onOpenChange={setOpenSettings}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="icon">
                  <FaCog className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>AI Chat Preferences</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">Default time range</label>
                    <select
                      className="bg-white/10 border-white/20 text-foreground rounded p-2 w-full"
                      value={preferences.timeRange.preset}
                      onChange={(e) => setPreferences(p => ({ ...p, timeRange: { preset: e.target.value as any } }))}
                    >
                      <option value="last_30_days">Last 30 days</option>
                      <option value="this_month">This month</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="redact"
                      type="checkbox"
                      checked={preferences.redactMerchants}
                      onChange={(e) => setPreferences(p => ({ ...p, redactMerchants: e.target.checked }))}
                    />
                    <label htmlFor="redact" className="text-sm">Redact merchant names/notes</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="receipts"
                      type="checkbox"
                      checked={preferences.includeReceipts}
                      onChange={(e) => setPreferences(p => ({ ...p, includeReceipts: e.target.checked }))}
                    />
                    <label htmlFor="receipts" className="text-sm">Include receipts/OCR text</label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">Response verbosity</label>
                    <select
                      className="bg-white/10 border-white/20 text-foreground rounded p-2 w-full"
                      value={preferences.verbosity}
                      onChange={(e) => setPreferences(p => ({ ...p, verbosity: e.target.value as any }))}
                    >
                      <option value="terse">Terse</option>
                      <option value="normal">Normal</option>
                      <option value="detailed">Detailed</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/ai/preferences', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            time_range: preferences.timeRange,
                            include_receipts: preferences.includeReceipts,
                            redact_merchants: preferences.redactMerchants,
                            verbosity: preferences.verbosity,
                          })
                        });
                        if (!res.ok) {
                          const err = await res.json().catch(() => ({}));
                          throw new Error(err?.error || 'Failed to save preferences');
                        }
                        toast.success('Preferences saved');
                        setOpenSettings(false);
                      } catch (e: any) {
                        toast.error(e?.message || 'Failed to save preferences');
                      }
                    }}
                  >
                    Save
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Suggestions moved near input inside the chat card */}

        {/* Chat */}
        <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm h-[540px] md:h-[640px] flex flex-col w-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FaRobot className="w-5 h-5 text-purple-400" />
              AI Finance Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'model' && (
                  <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 h-8 w-8 flex items-center justify-center">
                    <FaRobot className="w-4 h-4 text-foreground" />
                  </div>
                )}
                
                <div className={`max-w-[75%] p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-purple-600 text-foreground' 
                    : 'bg-white/10 text-gray-100'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                {message.role === 'user' && (
                  <div className="p-2 rounded-full bg-gray-600 h-8 w-8 flex items-center justify-center">
                    <FaUser className="w-4 h-4 text-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 h-8 w-8 flex items-center justify-center">
                  <FaRobot className="w-4 h-4 text-foreground" />
                </div>
                <div className="bg-white/10 text-gray-100 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me about your finances..."
                className="flex-1 bg-white/10 border-white/20 text-foreground placeholder-gray-400"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <FaPaperPlane className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  className="text-xs md:text-sm px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 hover:text-foreground transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </Card>
        {/* History Dialog */}
        <Dialog open={historyOpen} onOpenChange={(o) => { setHistoryOpen(o); if (o) fetchSessions(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chat History</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400 dark:text-gray-300">{sessions.length} session{sessions.length===1?'':'s'}</div>
              {sessions.length > 0 && (
                <button
                  className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                  onClick={async () => {
                    if (!confirm('Delete all chat sessions? This cannot be undone.')) return;
                    const res = await fetch('/api/ai/history', { method: 'DELETE', credentials: 'include' as RequestCredentials });
                    if (res.ok) {
                      setSessions([]);
                      setMessages([
                        {
                          id: 1,
                          role: 'model',
                          content: "Hi! I'm your AI finance assistant. Ask anything about spending, savings, budgeting, or investments.",
                          timestamp: new Date()
                        }
                      ]);
                      setSessionId(null);
                      toast.success('All sessions deleted');
                    } else {
                      const d = await res.json().catch(()=>({}));
                      toast.error(d?.error || 'Failed to delete');
                    }
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              <ul className="space-y-1">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <div className="flex items-center gap-2">
                      <button
                        className="flex-1 text-left p-2 rounded bg-white/10 hover:bg-white/20"
                        onClick={async () => {
                          await fetchTurns(s.id);
                          setHistoryOpen(false);
                        }}
                      >
                        {s.title}
                      </button>
                      <button
                        className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm('Delete this session?')) return;
                          const res = await fetch(`/api/ai/history?session_id=${s.id}`, { method: 'DELETE', credentials: 'include' as RequestCredentials });
                          if (res.ok) {
                            setSessions(prev => prev.filter(x => x.id !== s.id));
                            if (sessionId === s.id) {
                              setSessionId(null);
                            }
                            toast.success('Session deleted');
                          } else {
                            const d = await res.json().catch(()=>({}));
                            toast.error(d?.error || 'Failed to delete');
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </DialogContent>
        </Dialog>
        </div>
        {/* Coaching suggestions (right side) */}
        <div className="flex flex-col gap-4">
          <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-base">Coaching suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-200">
              <button onClick={() => setInputMessage("You are my personal finance coach. My monthly income is RM[amount]. Please create a budget that lets me cover bills, save money, and still have room to enjoy life. Do not tell me to give up happiness.")} className="block text-left w-full p-2 rounded bg-white/10 hover:bg-white/20">Budget that saves but still allows joy</button>
              <button onClick={() => setInputMessage("These are my spending categories: [enter your expenses]. Please label each as 'necessary', 'optional', or 'cuttable', and suggest at least one change that saves RM100.")} className="block text-left w-full p-2 rounded bg-white/10 hover:bg-white/20">Classify expenses + save RM100</button>
              <button onClick={() => setInputMessage("I want to save RM[goal amount] in [X months]. Based on my income, create a weekly savings plan I can actually execute. If a week is missed, tell me how to catch up.")} className="block text-left w-full p-2 rounded bg-white/10 hover:bg-white/20">Weekly plan to reach savings goal</button>
              <button onClick={() => setInputMessage("Outline my typical monthly income and fixed expenses, highlight which weeks might be tight, and give 1-2 adjustment suggestions. No table—just help me understand where my money goes.")} className="block text-left w-full p-2 rounded bg-white/10 hover:bg-white/20">Monthly inflow/outflow overview</button>
              <button onClick={() => setInputMessage("Here are 5 purchases I regret: [fill in]. Analyze why I bought them at the time, why I regret them, what I can learn, and suggest alternatives to avoid impulse buys next time.")} className="block text-left w-full p-2 rounded bg-white/10 hover:bg-white/20">Analyze 5 regretted purchases</button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}