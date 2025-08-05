"use client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FaArrowUp, FaArrowDown, FaEllipsisH } from "react-icons/fa";

export function RecentTransactions() {
  const transactions = [
    {
      id: 1,
      title: "Grocery Shopping",
      amount: -45.20,
      category: "Food & Dining",
      date: "Today",
      type: "expense"
    },
    {
      id: 2,
      title: "Salary Deposit",
      amount: 2500.00,
      category: "Income",
      date: "Yesterday",
      type: "income"
    },
    {
      id: 3,
      title: "Netflix Subscription",
      amount: -15.99,
      category: "Entertainment",
      date: "2 days ago",
      type: "expense"
    },
    {
      id: 4,
      title: "Coffee Shop",
      amount: -8.50,
      category: "Food & Dining",
      date: "3 days ago",
      type: "expense"
    },
    {
      id: 5,
      title: "Freelance Project",
      amount: 500.00,
      category: "Income",
      date: "1 week ago",
      type: "income"
    }
  ];

  return (
    <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">Recent Transactions</CardTitle>
          <button className="text-gray-400 hover:text-white transition-colors">
            <FaEllipsisH className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/10 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                transaction.type === 'income' 
                  ? 'bg-emerald-500 text-white shadow-lg' 
                  : 'bg-red-500 text-white shadow-lg'
              }`}>
                {transaction.type === 'income' ? (
                  <FaArrowDown className="w-4 h-4" />
                ) : (
                  <FaArrowUp className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="font-medium text-white">{transaction.title}</p>
                <p className="text-sm text-gray-300">{transaction.category}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${
                transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}RM {Math.abs(transaction.amount).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">{transaction.date}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 