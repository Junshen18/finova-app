"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaArrowUp, FaArrowDown, FaExchangeAlt, FaFilter, FaSearch, FaWallet, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";

type Transaction = {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: "income" | "expense" | "transfer";
  description?: string;
  status?: "completed" | "pending" | "failed";
};

export default function TransactionsPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Parse a date string safely:
  // - If it's a date-only string (YYYY-MM-DD), interpret as local calendar date (avoid UTC shift)
  // - Otherwise, let Date parse (respects timezone offsets/tz in the string)
  const parseDateAsLocalIfDateOnly = (value: string) => {
    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (dateOnlyPattern.test(value)) {
      const [yearStr, monthStr, dayStr] = value.split("-");
      const year = Number(yearStr);
      const monthIndex = Number(monthStr) - 1;
      const day = Number(dayStr);
      return new Date(year, monthIndex, day);
    }
    return new Date(value);
  };

  // Get a yyyy-mm-dd key from a date string using local timezone
  const getLocalDateKeyFromString = (value: string) => {
    const d = parseDateAsLocalIfDateOnly(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  };

  const fetchTransactions = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    // Fetch categories for mapping
    const [expCatsRes, incCatsRes] = await Promise.all([
      supabase.from("expense_categories").select("id, name, is_default").or(`user_id.eq.${user.id},is_default.eq.true`),
      supabase.from("income_categories").select("id, name, is_default").or(`user_id.eq.${user.id},is_default.eq.true`),
    ]);
    const expCatMap = new Map<number, string>((expCatsRes.data || []).map((c: any) => [c.id, c.name]));
    const incCatMap = new Map<number, string>((incCatsRes.data || []).map((c: any) => [c.id, c.name]));

    // Fetch transactions
    const [expensesRes, incomesRes, transfersRes] = await Promise.all([
      supabase.from("expense_transactions").select("id, amount, category, date, description, is_split_bill, group_id").eq("user_id", user.id).order("date", { ascending: false }),
      supabase.from("income_transactions").select("id, amount, category_id, date, description").eq("user_id", user.id).order("date", { ascending: false }),
      supabase.from("transfer_transactions").select("id, amount, date, description").eq("user_id", user.id).order("date", { ascending: false }),
    ]);

    // Split-bill: replace amount with user's own share when applicable
    let splitAmountByExpenseId: Record<number, number> = {};
    const splitExpenseIds = (expensesRes.data || []).filter((e: any) => e.is_split_bill).map((e: any) => e.id);
    if (splitExpenseIds.length > 0) {
      const { data: splits } = await supabase
        .from("expense_splits")
        .select("expense_id, amount")
        .in("expense_id", splitExpenseIds)
        .eq("user_id", user.id);
      (splits || []).forEach((s: any) => { splitAmountByExpenseId[s.expense_id] = Number(s.amount || 0); });
    }

    // If there are split-bill expenses, load their group names
    let groupNameById: Record<number, string> = {};
    const groupIds = Array.from(new Set((expensesRes.data || [])
      .filter((e: any) => e.is_split_bill && e.group_id)
      .map((e: any) => Number(e.group_id))));
    if (groupIds.length > 0) {
      const { data: groups } = await supabase
        .from("split_groups")
        .select("id, name")
        .in("id", groupIds);
      (groups || []).forEach((g: any) => { groupNameById[g.id] = g.name; });
    }

    const expTx: Transaction[] = (expensesRes.data || []).map((e: any) => {
      const name = expCatMap.get(e.category as number) || "Expense";
      const base = Number(e.amount || 0);
      const amt = e.is_split_bill ? (splitAmountByExpenseId[e.id] ?? base) : base;
      const isSplit = !!e.is_split_bill;
      const groupName = isSplit && e.group_id ? (groupNameById[Number(e.group_id)] || "Split bill") : undefined;
      const hasNote = e.description && String(e.description).trim().length > 0;
      const title = isSplit ? (hasNote ? `${String(e.description)} • ${groupName}` : (groupName || name))
                            : (hasNote ? String(e.description) : name);
      return {
        id: e.id,
        title,
        amount: amt,
        category: name,
        date: e.date,
        type: "expense" as const,
        description: isSplit ? undefined : (e.description || undefined),
        status: "completed" as const,
      };
    });

    const incTx: Transaction[] = (incomesRes.data || []).map((i: any) => {
      const name = incCatMap.get(i.category_id as number) || "Income";
      const title = (i.description && String(i.description).trim().length > 0) ? String(i.description) : name;
      return {
        id: i.id,
        title,
        amount: Number(i.amount || 0),
        category: name,
        date: i.date,
        type: "income",
        description: i.description || undefined,
        status: "completed",
      };
    });

    const trfTx: Transaction[] = (transfersRes.data || []).map((t: any) => ({
      id: t.id,
      title: (t.description && String(t.description).trim().length > 0) ? String(t.description) : "Transfer",
      amount: Number(t.amount || 0),
      category: "Transfer",
      date: t.date,
      type: "transfer",
      description: t.description || undefined,
      status: "completed",
    }));

    const all = [...expTx, ...incTx, ...trfTx].sort(
      (a, b) => parseDateAsLocalIfDateOnly(b.date).getTime() - parseDateAsLocalIfDateOnly(a.date).getTime()
    );
    setTransactions(all);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let channel: any;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const refetch = () => { fetchTransactions(); };
      channel = supabase
        .channel('realtime-transactions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_transactions', filter: `user_id=eq.${user.id}` }, refetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'income_transactions', filter: `user_id=eq.${user.id}` }, refetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transfer_transactions', filter: `user_id=eq.${user.id}` }, refetch);
      channel.subscribe();
    })();
    return () => {
      if (channel) {
        try { supabase.removeChannel(channel); } catch { /* noop */ }
      }
    };
  }, []);

  // Reset category when changing type
  useEffect(() => {
    setFilterCategory("all");
  }, [filterType]);

  // Get unique categories for current type
  const categories = useMemo(() => {
    const inMonth = transactions.filter(t => {
      const d = parseDateAsLocalIfDateOnly(t.date);
      return d.getFullYear() === selectedMonth.getFullYear() && d.getMonth() === selectedMonth.getMonth();
    });
    const source = filterType === "all" ? inMonth : inMonth.filter(t => t.type === filterType);
    return Array.from(new Set(source.map(t => t.category)));
  }, [transactions, filterType, selectedMonth]);

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    const typeFilter = (filterType || "all").toLowerCase();
    const categoryFilter = (filterCategory || "all").trim().toLowerCase();
    const query = (searchQuery || "").trim().toLowerCase();

    return transactions.filter((t) => {
      const tType = (t.type || "").toLowerCase();
      const tCat = (t.category || "").trim().toLowerCase();
      const tTitle = (t.title || "").toLowerCase();
      const tDesc = (t.description || "").toLowerCase();
      const d = parseDateAsLocalIfDateOnly(t.date);
      const inMonth = d.getFullYear() === selectedMonth.getFullYear() && d.getMonth() === selectedMonth.getMonth();

      const matchesType = typeFilter === "all" || tType === typeFilter;
      const matchesCategory = categoryFilter === "all" || tCat === categoryFilter;
      const matchesSearch = query === "" || tTitle.includes(query) || tDesc.includes(query);

      return inMonth && matchesType && matchesCategory && matchesSearch;
    });
  }, [transactions, filterType, filterCategory, searchQuery, selectedMonth]);

  // Group filtered transactions by local calendar date key (yyyy-mm-dd)
  const groupedTransactions = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filteredTransactions.forEach((t) => {
      const key = getLocalDateKeyFromString(t.date);
      const arr = map.get(key);
      if (arr) {
        arr.push(t);
      } else {
        map.set(key, [t]);
      }
    });
    // Sort each group by time desc
    map.forEach((arr) => {
      arr.sort((a, b) => parseDateAsLocalIfDateOnly(b.date).getTime() - parseDateAsLocalIfDateOnly(a.date).getTime());
    });
    // Sort group keys by date desc
    const keys = Array.from(map.keys()).sort((a, b) => parseDateAsLocalIfDateOnly(b).getTime() - parseDateAsLocalIfDateOnly(a).getTime());
    return keys.map((key) => ({ key, items: map.get(key)! }));
  }, [filteredTransactions]);

  // Format date for display using local day boundaries
  const formatDate = (dateString: string) => {
    const date = parseDateAsLocalIfDateOnly(dateString);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfThat = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffMs = startOfToday.getTime() - startOfThat.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Get icon for transaction type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "income":
        return <FaArrowDown className="w-4 h-4" />;
      case "expense":
        return <FaArrowUp className="w-4 h-4" />;
      case "transfer":
        return <FaExchangeAlt className="w-4 h-4" />;
      default:
        return <FaArrowUp className="w-4 h-4" />;
    }
  };

  // Get color for transaction type
  const getTransactionColor = (type: string) => {
    switch (type) {
      case "income":
        return "bg-emerald-500 text-white";
      case "expense":
        return "bg-red-500 text-white";
      case "transfer":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Totals reflect selected month only; ignore search and list filters
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = parseDateAsLocalIfDateOnly(t.date);
      return d.getFullYear() === selectedMonth.getFullYear() && d.getMonth() === selectedMonth.getMonth();
    });
  }, [transactions, selectedMonth]);

  const totalIncome = useMemo(() => monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0), [monthTransactions]);
  const totalExpenses = useMemo(() => monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0), [monthTransactions]);
  const totalBalance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  return (
    <div className="flex min-h-screen bg-background text-foreground pt-4 md:pt-10 px-4">
      <div className="flex flex-col items-start justify-start w-full h-full gap-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <h1 className="text-base md:text-2xl font-semibold">Transactions History</h1>
          <div className="md:flex hidden items-center gap-2 bg-white/5 rounded-md px-2 py-1"> {/* Month selector */}

              <button
                aria-label="Previous month"
                className="p-1 rounded hover:bg-white/10"
                onClick={() => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              >
                <FaChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-white/90 min-w-[9rem] text-center">
                {selectedMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
              </span>
              <button
                aria-label="Next month"
                className="p-1 rounded hover:bg-white/10"
                onClick={() => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              >
                <FaChevronRight className="w-4 h-4" />
              </button>
              </div>
          </div>
          <Button variant="outline" size="sm">
            <FaFilter className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Month selector */}
        <div className="md:hidden flex items-center gap-2 bg-white/5 rounded-md px-2 py-1 w-full justify-center">
          <button
            aria-label="Previous month"
            className="p-1 rounded hover:bg-white/10"
            onClick={() => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          >
            <FaChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-white/90 min-w-[9rem] text-center">
            {selectedMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
          </span>
          <button
            aria-label="Next month"
            className="p-1 rounded hover:bg-white/10"
            onClick={() => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          >
            <FaChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-3 w-full">
          <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="hidden md:block text-base text-gray-400">Total Balance</p>
                  <p className="text-[10px] md:hidden text-gray-400">Total (RM)</p>
                  <p className="text-sm md:text-2xl font-bold text-white">{totalBalance.toFixed(2)}</p>
                </div>
                <div className="md:block hidden p-2 rounded-full bg-blue-500/20">
                  <FaWallet className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="hidden md:block text-base text-gray-400">Total Income</p>
                  <p className="text-[10px] md:hidden text-gray-400">Income (RM)</p>
                  <p className="text-sm md:text-2xl font-bold text-emerald-400">{totalIncome.toFixed(2)}</p>
                </div>
                <div className="md:block hidden p-2 rounded-full bg-emerald-500/20">
                  <FaArrowDown className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="hidden md:block text-base text-gray-400">Total Expenses</p>
                  <p className="text-[10px] md:hidden text-gray-400">Expenses (RM)</p>

                  <p className="text-sm md:text-2xl font-bold text-red-400">{totalExpenses.toFixed(2)}</p>
                </div>
                <div className="md:block hidden p-2 rounded-full bg-red-500/20">
                  <FaArrowUp className="w-5 h-5 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm w-full">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 w-full overflow-x-auto">
              <div className="flex items-center gap-2 flex-1 min-w-[40%]">
                <FaSearch className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-white placeholder-gray-400 w-full"
                />
              </div>
              <Select value={filterType} onValueChange={(v) => setFilterType(v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm w-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-white">
                {loading ? 'Loading...' : `All Transactions (${filteredTransactions.length})`}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {filteredTransactions.length} transactions
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div 
              className="max-h-[calc(100vh-320px)] md:max-h-[600px] overflow-y-auto scroll-smooth custom-scrollbar" 
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#4b5563 rgba(55, 65, 81, 0.3)'
              }}
            >
              <div className="space-y-6 p-6 ">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No transactions found matching your filters.</p>
                  </div>
                ) : (
                  groupedTransactions.map((group) => (
                    <div key={group.key} className="space-y-3">
                      <div className="text-xs uppercase tracking-wide text-gray-400">{formatDate(group.key)}</div>
                      {group.items.map((transaction) => (
                        <div 
                          key={`${transaction.type}-${transaction.id}`}
                          className="flex items-center justify-between p-4 rounded-lg hover:bg-white/10 transition-all duration-200 border border-white/5"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${getTransactionColor(transaction.type)}`}>
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div className="flex flex-col">
                              <p className="font-medium text-white">{transaction.title}</p>
                              {transaction.category && transaction.category !== transaction.title && (
                                <p className="text-sm text-gray-300">{transaction.category}</p>
                              )}
                              {transaction.description && transaction.description !== transaction.title && (
                                <p className="text-xs text-gray-400 mt-1">{transaction.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold text-lg ${
                              transaction.type === 'income' ? 'text-emerald-400' : 
                              transaction.type === 'expense' ? 'text-red-400' : 'text-blue-400'
                            }`}>
                              {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}RM {Math.abs(transaction.amount).toFixed(2)}
                            </p>
                            {transaction.status && (
                              <Badge 
                                variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                                className="text-xs mt-1"
                              >
                                {transaction.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}