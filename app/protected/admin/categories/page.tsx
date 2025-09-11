"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Category = { id: string; name: string; is_default: boolean };

export default function AdminCategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [expense, setExpense] = useState<Category[]>([]);
  const [income, setIncome] = useState<Category[]>([]);
  const [newExpense, setNewExpense] = useState("");
  const [newIncome, setNewIncome] = useState("");
  const [accounts, setAccounts] = useState<Category[]>([]);
  const [newAccount, setNewAccount] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
        if ((profile?.role || "") !== "admin") { setLoading(false); return; }
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refresh = async () => {
    const supabase = createClient();
    const [exp, inc, acc] = await Promise.all([
      supabase
        .from("expense_categories")
        .select("id, name, is_default")
        .eq("is_default", true)
        .order("name", { ascending: true }),
      supabase
        .from("income_categories")
        .select("id, name, is_default")
        .eq("is_default", true)
        .order("name", { ascending: true }),
      supabase
        .from("account_categories")
        .select("id, name, is_default")
        .eq("is_default", true)
        .order("name", { ascending: true }),
    ]);
    setExpense((exp.data as any) || []);
    setIncome((inc.data as any) || []);
    setAccounts((acc.data as any) || []);
  };

  async function addCategory(kind: "expense" | "income" | "account") {
    const name = (kind === "expense" ? newExpense : kind === "income" ? newIncome : newAccount).trim();
    if (!name) return;
    const table = kind === "expense" ? "expense_categories" : kind === "income" ? "income_categories" : "account_categories";
    const supabase = createClient();
    const { data, error } = await supabase
      .from(table)
      .insert({ name, is_default: true })
      .select("id, name, is_default")
      .single();
    if (error) { toast.error(error.message); return; }
    if (kind === "expense") { setExpense(prev => [...prev, data as any]); setNewExpense(""); }
    else if (kind === "income") { setIncome(prev => [...prev, data as any]); setNewIncome(""); }
    else { setAccounts(prev => [...prev, data as any]); setNewAccount(""); }
    toast.success("Category added");
  }

  async function updateCategory(kind: "expense" | "income" | "account", id: string, updates: Partial<Category>) {
    const table = kind === "expense" ? "expense_categories" : kind === "income" ? "income_categories" : "account_categories";
    const supabase = createClient();
    const { error } = await supabase.from(table).update(updates).eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (kind === "expense") setExpense(prev => prev.map(c => c.id === id ? { ...c, ...updates } as Category : c));
    else if (kind === "income") setIncome(prev => prev.map(c => c.id === id ? { ...c, ...updates } as Category : c));
    else setAccounts(prev => prev.map(c => c.id === id ? { ...c, ...updates } as Category : c));
    toast.success("Category updated");
  }

  async function deleteCategory(kind: "expense" | "income" | "account", id: string) {
    const table = kind === "expense" ? "expense_categories" : kind === "income" ? "income_categories" : "account_categories";
    const supabase = createClient();
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (kind === "expense") setExpense(prev => prev.filter(c => c.id !== id));
    else if (kind === "income") setIncome(prev => prev.filter(c => c.id !== id));
    else setAccounts(prev => prev.filter(c => c.id !== id));
    toast.success("Category removed");
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Manage Categories</h1>
      <Tabs defaultValue="expense" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="expense">Expense</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="account">Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="space-y-3">
          <div className="flex gap-2">
            <Input value={newExpense} onChange={(e) => setNewExpense(e.target.value)} placeholder="New expense category" />
            <Button size="sm" onClick={() => addCategory("expense")} disabled={!newExpense.trim()}>Add</Button>
          </div>
          <ul className="rounded-md border border-white/10 divide-y divide-white/10">
            {expense.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Input className="max-w-xs" defaultValue={c.name} onBlur={(e) => updateCategory("expense", c.id, { name: e.target.value })} />
                  <label className="text-xs flex items-center gap-1">
                    <input type="checkbox" defaultChecked={c.is_default} onChange={(e) => updateCategory("expense", c.id, { is_default: e.target.checked })} />
                    Default
                  </label>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteCategory("expense", c.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="income" className="space-y-3">
          <div className="flex gap-2">
            <Input value={newIncome} onChange={(e) => setNewIncome(e.target.value)} placeholder="New income category" />
            <Button size="sm" onClick={() => addCategory("income")} disabled={!newIncome.trim()}>Add</Button>
          </div>
          <ul className="rounded-md border border-white/10 divide-y divide-white/10">
            {income.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Input className="max-w-xs" defaultValue={c.name} onBlur={(e) => updateCategory("income", c.id, { name: e.target.value })} />
                  <label className="text-xs flex items-center gap-1">
                    <input type="checkbox" defaultChecked={c.is_default} onChange={(e) => updateCategory("income", c.id, { is_default: e.target.checked })} />
                    Default
                  </label>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteCategory("income", c.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="account" className="space-y-3">
          <div className="flex gap-2">
            <Input value={newAccount} onChange={(e) => setNewAccount(e.target.value)} placeholder="New account category" />
            <Button size="sm" onClick={() => addCategory("account")} disabled={!newAccount.trim()}>Add</Button>
          </div>
          <ul className="rounded-md border border-white/10 divide-y divide-white/10">
            {accounts.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Input className="max-w-xs" defaultValue={c.name} onBlur={(e) => updateCategory("account", c.id, { name: e.target.value })} />
                  <label className="text-xs flex items-center gap-1">
                    <input type="checkbox" defaultChecked={c.is_default} onChange={(e) => updateCategory("account", c.id, { is_default: e.target.checked })} />
                    Default
                  </label>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteCategory("account", c.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// (legacy stub removed)
