"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaArrowUp, FaArrowDown, FaExchangeAlt, FaFilter, FaSearch, FaWallet } from "react-icons/fa";
import { dummyTransactions, getTotalBalance, getTotalIncome, getTotalExpenses, type Transaction } from "@/data/transactions";

export default function TransactionsPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Get unique categories for filter
  const categories = Array.from(new Set(dummyTransactions.map(t => t.category)));

  // Filter transactions based on current filters
  const filteredTransactions = dummyTransactions.filter(transaction => {
    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesCategory = filterCategory === "all" || transaction.category === filterCategory;
    const matchesSearch = transaction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesCategory && matchesSearch;
  });

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

  return (
    <div className="flex min-h-screen bg-background text-foreground pt-6 px-4 ml-64">
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
                  <p className="text-2xl font-bold text-white">RM {getTotalBalance().toFixed(2)}</p>
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
                  <p className="text-2xl font-bold text-emerald-400">RM {getTotalIncome().toFixed(2)}</p>
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
                  <p className="text-2xl font-bold text-red-400">RM {getTotalExpenses().toFixed(2)}</p>
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
              
              <Select value={filterType} onValueChange={setFilterType}>
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

              <Select value={filterCategory} onValueChange={setFilterCategory}>
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
                All Transactions ({filteredTransactions.length})
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
                          <p className="text-sm text-gray-300">{transaction.category}</p>
                          {transaction.description && (
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