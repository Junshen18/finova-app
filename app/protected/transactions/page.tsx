"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaArrowUp, FaArrowDown, FaExchangeAlt, FaFilter, FaSearch, FaWallet } from "react-icons/fa";
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

    const all = [...expTx, ...incTx, ...trfTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
    const source = filterType === "all" ? transactions : transactions.filter(t => t.type === filterType);
    return Array.from(new Set(source.map(t => t.category)));
  }, [transactions, filterType]);

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

      const matchesType = typeFilter === "all" || tType === typeFilter;
      const matchesCategory = categoryFilter === "all" || tCat === categoryFilter;
      const matchesSearch = query === "" || tTitle.includes(query) || tDesc.includes(query);

      return matchesType && matchesCategory && matchesSearch;
    });
  }, [transactions, filterType, filterCategory, searchQuery]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
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

  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0), [transactions]);
  const totalExpenses = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0), [transactions]);
  const totalBalance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  return (
    <div className="flex min-h-screen bg-background text-foreground pt-6 px-4">
      <div className="flex flex-col items-start justify-start w-full h-full gap-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-row items-center justify-between w-full">
          <h1 className="text-2xl font-bold">Transactions History</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <FaFilter className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Balance</p>
                  <p className="text-2xl font-bold text-white">RM {totalBalance.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/20">
                  <FaWallet className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Income</p>
                  <p className="text-2xl font-bold text-emerald-400">RM {totalIncome.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-full bg-emerald-500/20">
                  <FaArrowDown className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-400">RM {totalExpenses.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-full bg-red-500/20">
                  <FaArrowUp className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm w-full">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center gap-2 flex-1">
                <FaSearch className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-white placeholder-gray-400 flex-1"
                />
              </div>
              
              <Select value={filterType} onValueChange={(v) => setFilterType(v)}>
                <SelectTrigger className="w-32">
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
                <SelectTrigger className="w-40">
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
              className="max-h-[400px] md:max-h-[600px] overflow-y-auto scroll-smooth custom-scrollbar" 
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#4b5563 rgba(55, 65, 81, 0.3)'
              }}
            >
              <div className="space-y-4 p-6">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No transactions found matching your filters.</p>
                  </div>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
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
                        <p className="text-xs text-gray-400">{formatDate(transaction.date)}</p>
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