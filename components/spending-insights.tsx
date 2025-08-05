"use client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FaUtensils, FaCar, FaShoppingBag, FaHome, FaGamepad } from "react-icons/fa";

export function SpendingInsights() {
  const categories = [
    { name: "Food & Dining", amount: 284.50, percentage: 35, icon: FaUtensils, color: "bg-orange-500" },
    { name: "Transportation", amount: 156.20, percentage: 19, icon: FaCar, color: "bg-blue-500" },
    { name: "Shopping", amount: 142.80, percentage: 18, icon: FaShoppingBag, color: "bg-purple-500" },
    { name: "Housing", amount: 98.40, percentage: 12, icon: FaHome, color: "bg-emerald-500" },
    { name: "Entertainment", amount: 67.30, percentage: 8, icon: FaGamepad, color: "bg-pink-500" },
    { name: "Others", amount: 45.80, percentage: 6, icon: FaGamepad, color: "bg-gray-500" }
  ];

  return (
    <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-white">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${category.color} text-white shadow-lg`}>
                <category.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">{category.name}</p>
                <p className="text-xs text-gray-300">RM {category.amount.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${category.color}`}
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
              <span className="text-xs font-semibold text-gray-300 w-8 text-right">
                {category.percentage}%
              </span>
            </div>
          </div>
        ))}
        
        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Total Spent</span>
            <span className="text-lg font-bold text-white">RM 795.00</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 