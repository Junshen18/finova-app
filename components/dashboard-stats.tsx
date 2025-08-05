"use client";
import { Card, CardContent } from "./ui/card";
import { FaArrowUp, FaArrowDown, FaCreditCard, FaPiggyBank } from "react-icons/fa";

export function DashboardStats() {
  const stats = [
    {
      title: "This Month",
      amount: "RM 1,840",
      change: "+12.5%",
      trend: "up",
      icon: FaArrowUp,
      color: "bg-emerald-100 text-emerald-700",
      iconBg: "bg-emerald-500"
    },
    {
      title: "Last Month",
      amount: "RM 1,632",
      change: "-8.2%",
      trend: "down",
      icon: FaArrowDown,
      color: "bg-red-100 text-red-700",
      iconBg: "bg-red-500"
    },
    {
      title: "Credit Cards",
      amount: "RM 892",
      change: "2 cards",
      trend: "neutral",
      icon: FaCreditCard,
      color: "bg-blue-100 text-blue-700",
      iconBg: "bg-blue-500"
    },
    {
      title: "Savings",
      amount: "RM 3,240",
      change: "+5.1%",
      trend: "up",
      icon: FaPiggyBank,
      color: "bg-violet-100 text-violet-700",
      iconBg: "bg-violet-500"
    }
  ];

  return (
    <>
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white/5 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-300 mb-1">{stat.title}</p>
                <p className="text-xl font-bold text-white">{stat.amount}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`text-xs font-semibold ${stat.color} px-2 py-1 rounded-full`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-full ${stat.iconBg} text-white shadow-lg`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
} 