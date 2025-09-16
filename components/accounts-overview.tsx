"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Pencil, Plus, Trash } from "lucide-react";
import { Input } from "./ui/input";

type Account = { id: number; name: string; is_default?: boolean };

type AccountsOverviewProps = {
  onRequestDelete?: (account: { id: number; name: string }) => void;
};

export default function AccountsOverview({ onRequestDelete }: AccountsOverviewProps) {
  const supabase = useMemo(() => createClient(), []);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Load account list (user's + defaults)
      const { data: accs } = await supabase
        .from("account_categories")
        .select("id, name, is_default, user_id")
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .order("name", { ascending: true });

      const accountList: Account[] = (accs || []).map((a: any) => ({ id: a.id, name: a.name, is_default: a.is_default }));
      setAccounts(accountList);

      // Build balances map
      const balanceById = new Map<number, number>();

      const [expRes, incRes, trfInRes, trfOutRes] = await Promise.all([
        supabase.from("expense_transactions").select("account_id, amount, user_id").eq("user_id", user.id),
        supabase.from("income_transactions").select("account_id, amount, user_id").eq("user_id", user.id),
        supabase.from("transfer_transactions").select("to_account_id, amount, user_id").eq("user_id", user.id),
        supabase.from("transfer_transactions").select("from_account_id, amount, user_id").eq("user_id", user.id),
      ]);

      // Expenses reduce balance
      (expRes.data || []).forEach((r: any) => {
        const id = Number(r.account_id);
        if (!Number.isFinite(id)) return;
        balanceById.set(id, (balanceById.get(id) || 0) - Number(r.amount || 0));
      });
      // Incomes increase balance
      (incRes.data || []).forEach((r: any) => {
        const id = Number(r.account_id);
        if (!Number.isFinite(id)) return;
        balanceById.set(id, (balanceById.get(id) || 0) + Number(r.amount || 0));
      });
      // Transfers in
      (trfInRes.data || []).forEach((r: any) => {
        const id = Number(r.to_account_id);
        if (!Number.isFinite(id)) return;
        balanceById.set(id, (balanceById.get(id) || 0) + Number(r.amount || 0));
      });
      // Transfers out
      (trfOutRes.data || []).forEach((r: any) => {
        const id = Number(r.from_account_id);
        if (!Number.isFinite(id)) return;
        balanceById.set(id, (balanceById.get(id) || 0) - Number(r.amount || 0));
      });

      const obj: Record<number, number> = {};
      for (const [k, v] of balanceById.entries()) obj[k] = v;
      setBalances(obj);
      setLoading(false);
    })();
  }, [supabase]);

  const assets = useMemo(() => Object.values(balances).filter(v => v > 0).reduce((s, v) => s + v, 0), [balances]);
  const liabilities = useMemo(() => Object.values(balances).filter(v => v < 0).reduce((s, v) => s + v, 0), [balances]);
  const total = useMemo(() => assets + liabilities, [assets, liabilities]);

  const groups: { title: string; match: (name: string) => boolean }[] = [
    { title: "Cash", match: (n) => /cash/i.test(n) },
    { title: "Bank Accounts", match: (n) => /bank|maybank|cimb|rhb|hsbc|uob|ambank/i.test(n) },
    { title: "TnG", match: (n) => /tng|touch ?n ?go/i.test(n) },
    { title: "Grab", match: (n) => /grab/i.test(n) },
    { title: "Card", match: (n) => /card/i.test(n) && !/debit/i.test(n) },
    { title: "Debit Card", match: (n) => /debit/i.test(n) },
  ];

  const formatRM = (v: number) => `RM ${Math.abs(v).toFixed(2)}`;

  async function addAccount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newName.trim()) return;
    const { error } = await supabase.from("account_categories").insert({ user_id: user.id, name: newName.trim(), is_default: false });
    if (!error) {
      setNewName("");
      setAdding(false);
      // reload
      const { data } = await supabase
        .from("account_categories")
        .select("id, name, is_default, user_id")
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .order("name", { ascending: true });
      setAccounts((data || []).map((a: any) => ({ id: a.id, name: a.name, is_default: a.is_default })));
    }
  }

  async function renameAccount(id: number) {
    const { error } = await supabase.from("account_categories").update({ name: renameValue.trim() }).eq("id", id);
    if (!error) {
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, name: renameValue.trim() } : a));
      setRenamingId(null);
      setRenameValue("");
    }
  }

  const makeRow = (acc: Account) => {
    const bal = balances[acc.id] || 0;
    return (
      <div key={acc.id} className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          {renamingId === acc.id ? (
            <div className="flex items-center gap-2">
              <Input value={renameValue} onChange={(e)=>setRenameValue(e.target.value)} className="h-8 w-48 bg-form-bg text-foreground border-form-border" />
              <Button size="sm" onClick={()=>renameAccount(acc.id)} className="h-8 bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90">Save</Button>
              <Button size="sm" variant="outline" onClick={()=>{setRenamingId(null); setRenameValue("");}} className="h-8 bg-form-bg text-foreground border-form-border hover:bg-form-hover">Cancel</Button>
            </div>
          ) : (
            <>
              <span className="text-sm text-foreground">{acc.name}</span>
              {!acc.is_default && (
                <>
                  <Button variant="outline" size="icon" onClick={()=>{setRenamingId(acc.id); setRenameValue(acc.name);}} className="h-7 w-7 ml-2 bg-form-bg text-foreground border-form-border hover:bg-form-hover"><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={()=> onRequestDelete?.({ id: acc.id, name: acc.name })}
                    className="h-7 w-7 ml-1 bg-form-bg text-foreground border-form-border hover:bg-form-hover"
                    aria-label={`Delete ${acc.name}`}
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </>
          )}
        </div>
        <div className={`text-sm font-medium ${bal < 0 ? "text-red-400" : "text-emerald-400"}`}>{bal < 0 ? `- ${formatRM(bal)}`.replace("- -","-") : formatRM(bal)}</div>
      </div>
    );
  };

  const grouped = useMemo(() => {
    const remaining = new Set(accounts.map(a => a.id));
    const res: { title: string; rows: Account[]; total: number }[] = [];
    for (const g of groups) {
      const rows = accounts.filter(a => g.match(a.name));
      rows.forEach(r => remaining.delete(r.id));
      if (rows.length > 0) res.push({ title: g.title, rows, total: rows.reduce((s, r) => s + (balances[r.id] || 0), 0) });
    }
    const others = accounts.filter(a => remaining.has(a.id));
    if (others.length > 0) res.push({ title: "Others", rows: others, total: others.reduce((s, r) => s + (balances[r.id] || 0), 0) });
    return res;
  }, [accounts, balances]);

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <div className="flex items-center gap-2">
          {adding ? (
            <div className="flex items-center gap-2">
              <Input placeholder="Account name" value={newName} onChange={(e)=>setNewName(e.target.value)} className="h-9 bg-form-bg text-foreground border-form-border" />
              <Button onClick={addAccount} className="h-9 bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90">Add</Button>
              <Button variant="outline" onClick={()=>{setAdding(false); setNewName("");}} className="h-9 bg-form-bg text-foreground border-form-border hover:bg-form-hover">Cancel</Button>
            </div>
          ) : (
            <Button onClick={()=>setAdding(true)} variant="outline" className="h-9 bg-form-bg text-foreground border-form-border hover:bg-form-hover"><Plus className="w-4 h-4 mr-1" /> Add Account</Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-white/5 border-0">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400">Assets</div>
            <div className="text-xl font-semibold text-emerald-400">{formatRM(assets)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-0">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400">Liabilities</div>
            <div className="text-xl font-semibold text-red-400">- {formatRM(Math.abs(liabilities))}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-0">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400">Total</div>
            <div className={`text-xl font-semibold ${total < 0 ? "text-red-400" : "text-emerald-400"}`}>{total < 0 ? `- ${formatRM(Math.abs(total))}` : formatRM(total)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Groups */}
      <div className="space-y-4">
        {loading ? (
          <Card className="bg-white/5 border-0"><CardContent className="p-6 text-sm text-muted-foreground">Loading accounts…</CardContent></Card>
        ) : (
          grouped.map(g => (
            <Card key={g.title} className="bg-white/5 border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-foreground">{g.title}</div>
                  <div className={`text-sm font-semibold ${g.total < 0 ? "text-red-400" : "text-emerald-400"}`}>{g.total < 0 ? `- ${formatRM(Math.abs(g.total))}` : formatRM(g.total)}</div>
                </div>
                <div className="divide-y divide-white/10">
                  {g.rows.map(makeRow)}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}




