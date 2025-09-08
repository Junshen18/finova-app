"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ArrowDownCircle, ArrowLeftRight, ArrowUpCircle, Pencil, Trash2, Wallet } from "lucide-react";

type TransactionType = "income" | "expense" | "transfer";

export type TransactionRef = { id: number; type: TransactionType };

type Props = {
  open: boolean;
  transaction: TransactionRef | null;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
};

type ExpenseRow = {
  id: number;
  date: string;
  amount: number;
  category: number | null;
  account_id: number | null;
  description: string | null;
};

type IncomeRow = {
  id: number;
  date: string;
  amount: number;
  category_id: number | null;
  account_id: number | null;
  description: string | null;
};

type TransferRow = {
  id: number;
  date: string;
  amount: number;
  from_account_id: number | null;
  to_account_id: number | null;
  description: string | null;
};

export function TransactionDetailsDialog({ open, transaction, onOpenChange, onUpdated, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [expense, setExpense] = useState<ExpenseRow | null>(null);
  const [income, setIncome] = useState<IncomeRow | null>(null);
  const [transfer, setTransfer] = useState<TransferRow | null>(null);
  const [initialExpense, setInitialExpense] = useState<ExpenseRow | null>(null);
  const [initialIncome, setInitialIncome] = useState<IncomeRow | null>(null);
  const [initialTransfer, setInitialTransfer] = useState<TransferRow | null>(null);

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<{ id: number; name: string }[]>([]);
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!open || !transaction) return;
    setLoading(true);
    setEditMode(false);
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) {
          toast.error("You are not signed in.");
          return;
        }

        // Preload select options
        const preload: any[] = [];
        preload.push(
          supabase
            .from("account_categories")
            .select("id, name, is_default")
            .or(`user_id.eq.${user.id},is_default.eq.true`)
            .order("name", { ascending: true }) as any
        );
        preload.push(
          supabase
            .from("expense_categories")
            .select("id, name, is_default")
            .or(`user_id.eq.${user.id},is_default.eq.true`)
            .order("name", { ascending: true }) as any
        );
        preload.push(
          supabase
            .from("income_categories")
            .select("id, name, is_default")
            .or(`user_id.eq.${user.id},is_default.eq.true`)
            .order("name", { ascending: true }) as any
        );

        const [acctRes, expCatRes, incCatRes] = await Promise.all(preload);
        setAccounts((acctRes.data || []).map((a: any) => ({ id: a.id, name: a.name })));
        setCategories((expCatRes.data || []).map((c: any) => ({ id: c.id, name: c.name })));
        setIncomeCategories((incCatRes.data || []).map((c: any) => ({ id: c.id, name: c.name })));

        // Load row
        if (transaction.type === "expense") {
          const { data } = await supabase
            .from("expense_transactions")
            .select("id, date, amount, category, account_id, description")
            .eq("id", transaction.id)
            .single();
          if (data) { setExpense(data as ExpenseRow); setInitialExpense(data as ExpenseRow); }
          setIncome(null); setTransfer(null);
        } else if (transaction.type === "income") {
          const { data } = await supabase
            .from("income_transactions")
            .select("id, date, amount, category_id, account_id, description")
            .eq("id", transaction.id)
            .single();
          if (data) { setIncome(data as IncomeRow); setInitialIncome(data as IncomeRow); }
          setExpense(null); setTransfer(null);
        } else if (transaction.type === "transfer") {
          const { data } = await supabase
            .from("transfer_transactions")
            .select("id, date, amount, from_account_id, to_account_id, description")
            .eq("id", transaction.id)
            .single();
          if (data) { setTransfer(data as TransferRow); setInitialTransfer(data as TransferRow); }
          setExpense(null); setIncome(null);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load transaction.");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, transaction, supabase]);

  const close = () => onOpenChange(false);

  const resetEdits = () => {
    if (initialExpense && transaction?.type === "expense") setExpense({ ...initialExpense });
    if (initialIncome && transaction?.type === "income") setIncome({ ...initialIncome });
    if (initialTransfer && transaction?.type === "transfer") setTransfer({ ...initialTransfer });
  };

  const handleSave = async () => {
    if (!transaction) return;
    setSaving(true);
    try {
      if (transaction.type === "expense" && expense) {
        const { error } = await supabase
          .from("expense_transactions")
          .update({
            date: expense.date,
            amount: expense.amount,
            category: expense.category,
            account_id: expense.account_id,
            description: expense.description,
          })
          .eq("id", transaction.id);
        if (error) throw new Error(error.message);
      } else if (transaction.type === "income" && income) {
        const { error } = await supabase
          .from("income_transactions")
          .update({
            date: income.date,
            amount: income.amount,
            category_id: income.category_id,
            account_id: income.account_id,
            description: income.description,
          })
          .eq("id", transaction.id);
        if (error) throw new Error(error.message);
      } else if (transaction.type === "transfer" && transfer) {
        const { error } = await supabase
          .from("transfer_transactions")
          .update({
            date: transfer.date,
            amount: transfer.amount,
            from_account_id: transfer.from_account_id,
            to_account_id: transfer.to_account_id,
            description: transfer.description,
          })
          .eq("id", transaction.id);
        if (error) throw new Error(error.message);
      }
      toast.success("Transaction updated.");
      onUpdated?.();
      setEditMode(false);
      // refresh initial snapshot to new values
      if (transaction.type === "expense" && expense) setInitialExpense({ ...expense });
      if (transaction.type === "income" && income) setInitialIncome({ ...income });
      if (transaction.type === "transfer" && transfer) setInitialTransfer({ ...transfer });
      close();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;
    if (!confirm("Delete this transaction? This cannot be undone.")) return;
    setDeleting(true);
    try {
      if (transaction.type === "expense") {
        const { error } = await supabase.from("expense_transactions").delete().eq("id", transaction.id);
        if (error) throw new Error(error.message);
      } else if (transaction.type === "income") {
        const { error } = await supabase.from("income_transactions").delete().eq("id", transaction.id);
        if (error) throw new Error(error.message);
      } else if (transaction.type === "transfer") {
        const { error } = await supabase.from("transfer_transactions").delete().eq("id", transaction.id);
        if (error) throw new Error(error.message);
      }
      toast.success("Transaction deleted.");
      onDeleted?.();
      close();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  const title = transaction ? `${transaction.type[0].toUpperCase()}${transaction.type.slice(1)} Details` : "Transaction Details";

  const getNameById = (arr: { id: number; name: string }[], id: number | null | undefined) => {
    if (id == null) return "—";
    return arr.find((a) => a.id === id)?.name ?? "—";
  };

  const formatAmount = (value: number | null | undefined) => {
    const v = Number(value || 0);
    return `RM ${Math.abs(v).toFixed(2)}`;
  };

  const AmountIcon = ({ type }: { type: TransactionType }) => {
    if (type === "income") {
      return (
        <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
          <ArrowDownCircle className="w-8 h-8" />
        </div>
      );
    }
    if (type === "expense") {
      return (
        <div className="w-14 h-14 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center">
          <ArrowUpCircle className="w-8 h-8" />
        </div>
      );
    }
    return (
      <div className="w-14 h-14 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center">
        <ArrowLeftRight className="w-8 h-8" />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-4">
            {/* Read-only, clean summary view */}
            {!editMode && transaction && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditMode(true)}
                      className="h-9 w-9 bg-form-bg text-foreground border-form-border hover:bg-form-hover"
                      aria-label="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="h-9 w-9 bg-form-bg text-red-500 border-red-500/40 hover:bg-red-500/10"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col items-center text-center gap-3">
                  <AmountIcon type={transaction.type} />
                  <div className="text-3xl font-bold tracking-tight text-foreground">
                    {transaction.type === "income" && "+"}{transaction.type === "expense" && "-"}{formatAmount(
                      transaction.type === "expense" ? expense?.amount : transaction.type === "income" ? income?.amount : transfer?.amount
                    )}
                  </div>
                  <div className="text-base font-medium text-foreground">
                    {(() => {
                      if (transaction.type === "income") return "You received";
                      if (transaction.type === "expense") return "You spent";
                      return "Transfer";
                    })()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(() => {
                      const d = transaction.type === "expense" ? expense?.date : transaction.type === "income" ? income?.date : transfer?.date;
                      return d ? new Date(d).toLocaleDateString() : "";
                    })()}
                  </div>

                  {/* Meta pills */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                    {transaction.type !== "transfer" && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-white/10 text-xs text-muted-foreground">
                        <Wallet className="w-3.5 h-3.5" />
                        {transaction.type === "expense" ? getNameById(categories, expense?.category ?? null) : getNameById(incomeCategories, income?.category_id ?? null)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-white/10 text-xs text-muted-foreground">
                      Account: {getNameById(accounts, transaction.type === "transfer" ? transfer?.from_account_id ?? null : (transaction.type === "expense" ? expense?.account_id ?? null : income?.account_id ?? null))}
                    </span>
                  </div>

                  {/* Description */}
                  {(() => {
                    const desc = transaction.type === "expense" ? expense?.description : transaction.type === "income" ? income?.description : transfer?.description;
                    return desc ? (
                      <div className="text-sm text-muted-foreground max-w-md leading-relaxed">{desc}</div>
                    ) : null;
                  })()}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => close()} className="bg-form-bg text-foreground border-form-border hover:bg-form-hover">Close</Button>
                </div>
              </div>
            )}

            {/* Edit mode detailed form */}
            {editMode && transaction?.type === "expense" && expense && (
              <div className="space-y-4">
                {/* Date & Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Date</div>
                    {editMode ? (
                      <Input
                        type="date"
                        value={expense.date ? expense.date.slice(0, 10) : ""}
                        onChange={(e) => setExpense({ ...expense, date: new Date(e.target.value).toISOString() })}
                        className="bg-form-bg text-foreground border-form-border"
                      />
                    ) : (
                      <div className="text-sm text-foreground">{expense.date ? new Date(expense.date).toLocaleDateString() : "—"}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Amount</div>
                    {editMode ? (
                      <Input
                        type="number"
                        value={expense.amount}
                        onChange={(e) => setExpense({ ...expense, amount: Number(e.target.value) })}
                        className="bg-form-bg text-foreground border-form-border"
                        placeholder="Amount"
                      />
                    ) : (
                      <div className="text-sm text-foreground">RM {Number(expense.amount ?? 0).toFixed(2)}</div>
                    )}
                  </div>
                </div>
                {/* Category & Account */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Category</div>
                    {editMode ? (
                      <Select
                        value={expense.category != null ? String(expense.category) : ""}
                        onValueChange={(v) => setExpense({ ...expense, category: v ? Number(v) : null })}
                      >
                        <SelectTrigger className="bg-form-bg text-foreground border-form-border"><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-foreground">{getNameById(categories, expense.category)}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Account</div>
                    {editMode ? (
                      <Select
                        value={expense.account_id != null ? String(expense.account_id) : ""}
                        onValueChange={(v) => setExpense({ ...expense, account_id: v ? Number(v) : null })}
                      >
                        <SelectTrigger className="bg-form-bg text-foreground border-form-border"><SelectValue placeholder="Account" /></SelectTrigger>
                        <SelectContent>
                          {accounts.map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-foreground">{getNameById(accounts, expense.account_id)}</div>
                    )}
                  </div>
                </div>
                {/* Notes */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Notes</div>
                  {editMode ? (
                    <Input
                      type="text"
                      value={expense.description ?? ""}
                      onChange={(e) => setExpense({ ...expense, description: e.target.value })}
                      className="bg-form-bg text-foreground border-form-border"
                      placeholder="Notes"
                    />
                  ) : (
                    <div className="text-sm text-foreground">{expense.description || "—"}</div>
                  )}
                </div>
              </div>
            )}

            {editMode && transaction?.type === "income" && income && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Date</div>
                    {editMode ? (
                      <Input
                        type="date"
                        value={income.date ? income.date.slice(0, 10) : ""}
                        onChange={(e) => setIncome({ ...income, date: new Date(e.target.value).toISOString() })}
                        className="bg-form-bg text-foreground border-form-border"
                      />
                    ) : (
                      <div className="text-sm text-foreground">{income.date ? new Date(income.date).toLocaleDateString() : "—"}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Amount</div>
                    {editMode ? (
                      <Input
                        type="number"
                        value={income.amount}
                        onChange={(e) => setIncome({ ...income, amount: Number(e.target.value) })}
                        className="bg-form-bg text-foreground border-form-border"
                        placeholder="Amount"
                      />
                    ) : (
                      <div className="text-sm text-foreground">RM {Number(income.amount ?? 0).toFixed(2)}</div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Category</div>
                    {editMode ? (
                      <Select
                        value={income.category_id != null ? String(income.category_id) : ""}
                        onValueChange={(v) => setIncome({ ...income, category_id: v ? Number(v) : null })}
                      >
                        <SelectTrigger className="bg-form-bg text-foreground border-form-border"><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                          {incomeCategories.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-foreground">{getNameById(incomeCategories, income.category_id)}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Account</div>
                    {editMode ? (
                      <Select
                        value={income.account_id != null ? String(income.account_id) : ""}
                        onValueChange={(v) => setIncome({ ...income, account_id: v ? Number(v) : null })}
                      >
                        <SelectTrigger className="bg-form-bg text-foreground border-form-border"><SelectValue placeholder="Account" /></SelectTrigger>
                        <SelectContent>
                          {accounts.map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-foreground">{getNameById(accounts, income.account_id)}</div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Notes</div>
                  {editMode ? (
                    <Input
                      type="text"
                      value={income.description ?? ""}
                      onChange={(e) => setIncome({ ...income, description: e.target.value })}
                      className="bg-form-bg text-foreground border-form-border"
                      placeholder="Notes"
                    />
                  ) : (
                    <div className="text-sm text-foreground">{income.description || "—"}</div>
                  )}
                </div>
              </div>
            )}

            {editMode && transaction?.type === "transfer" && transfer && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Date</div>
                    {editMode ? (
                      <Input
                        type="date"
                        value={transfer.date ? transfer.date.slice(0, 10) : ""}
                        onChange={(e) => setTransfer({ ...transfer, date: new Date(e.target.value).toISOString() })}
                        className="bg-form-bg text-foreground border-form-border"
                      />
                    ) : (
                      <div className="text-sm text-foreground">{transfer.date ? new Date(transfer.date).toLocaleDateString() : "—"}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Amount</div>
                    {editMode ? (
                      <Input
                        type="number"
                        value={transfer.amount}
                        onChange={(e) => setTransfer({ ...transfer, amount: Number(e.target.value) })}
                        className="bg-form-bg text-foreground border-form-border"
                        placeholder="Amount"
                      />
                    ) : (
                      <div className="text-sm text-foreground">RM {Number(transfer.amount ?? 0).toFixed(2)}</div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">From account</div>
                    {editMode ? (
                      <Select
                        value={transfer.from_account_id != null ? String(transfer.from_account_id) : ""}
                        onValueChange={(v) => setTransfer({ ...transfer, from_account_id: v ? Number(v) : null })}
                      >
                        <SelectTrigger className="bg-form-bg text-foreground border-form-border"><SelectValue placeholder="From Account" /></SelectTrigger>
                        <SelectContent>
                          {accounts.map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-foreground">{getNameById(accounts, transfer.from_account_id)}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">To account</div>
                    {editMode ? (
                      <Select
                        value={transfer.to_account_id != null ? String(transfer.to_account_id) : ""}
                        onValueChange={(v) => setTransfer({ ...transfer, to_account_id: v ? Number(v) : null })}
                      >
                        <SelectTrigger className="bg-form-bg text-foreground border-form-border"><SelectValue placeholder="To Account" /></SelectTrigger>
                        <SelectContent>
                          {accounts.map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-foreground">{getNameById(accounts, transfer.to_account_id)}</div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Notes</div>
                  {editMode ? (
                    <Input
                      type="text"
                      value={transfer.description ?? ""}
                      onChange={(e) => setTransfer({ ...transfer, description: e.target.value })}
                      className="bg-form-bg text-foreground border-form-border"
                      placeholder="Notes"
                    />
                  ) : (
                    <div className="text-sm text-foreground">{transfer.description || "—"}</div>
                  )}
                </div>
              </div>
            )}

            {editMode && (
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => { resetEdits(); setEditMode(false); }}
                  className="bg-form-bg text-foreground border-form-border hover:bg-form-hover"
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-[#E9FE52] text-black hover:bg-[#E9FE52]/90">{saving ? "Saving…" : "Save"}</Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default TransactionDetailsDialog;


