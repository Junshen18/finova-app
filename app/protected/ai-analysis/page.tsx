"use client";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FaRobot, 
  FaUser, 
  FaPaperPlane, 
  FaChartLine, 
  FaLightbulb, 
  FaExclamationTriangle,
//   FaTrendUp,
//   FaTrendDown,
  FaBalanceScale,
  FaPiggyBank
} from "react-icons/fa";
import { dummyTransactions, getTotalBalance, getTotalIncome, getTotalExpenses } from "@/data/transactions";

interface ChatMessage {
  id: number;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

interface FinancialInsight {
  id: number;
  type: 'tip' | 'warning' | 'achievement' | 'trend';
  title: string;
  description: string;
  value?: string;
  icon: React.ReactNode;
}

export default function AIAnalysisPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'ai',
      message: "Hello! I'm your AI financial assistant. I can help you analyze your spending patterns, suggest budgeting strategies, and answer questions about your finances. What would you like to know about your financial situation?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate AI insights based on transaction data
  const generateInsights = (): FinancialInsight[] => {
    const totalIncome = getTotalIncome();
    const totalExpenses = getTotalExpenses();
    const balance = getTotalBalance();
    const savingsRate = ((totalIncome - totalExpenses) / totalIncome * 100);
    
    // Calculate category spending
    const categorySpending = dummyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);
    
    const topCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0];

    return [
      {
        id: 1,
        type: 'achievement',
        title: 'Savings Rate',
        description: `You're saving ${savingsRate.toFixed(1)}% of your income. ${savingsRate > 20 ? 'Excellent work!' : savingsRate > 10 ? 'Good progress!' : 'Consider increasing your savings rate.'}`,
        value: `${savingsRate.toFixed(1)}%`,
        icon: <FaPiggyBank className="w-5 h-5" />
      },
      {
        id: 2,
        type: totalExpenses > totalIncome ? 'warning' : 'tip',
        title: 'Spending Analysis',
        description: totalExpenses > totalIncome 
          ? 'Your expenses exceed your income this period. Consider reviewing your spending habits.'
          : 'Your spending is under control. Keep up the good work!',
        value: `RM ${totalExpenses.toFixed(2)}`,
        icon: totalExpenses > totalIncome ? <FaExclamationTriangle className="w-5 h-5" /> : <FaBalanceScale className="w-5 h-5" />
      },
      {
        id: 3,
        type: 'trend',
        title: 'Top Spending Category',
        description: `Your highest spending category is ${topCategory?.[0] || 'N/A'}. Consider if this aligns with your priorities.`,
        value: topCategory ? `RM ${topCategory[1].toFixed(2)}` : 'N/A',
        icon: <FaChartLine className="w-5 h-5" />
      },
      {
        id: 4,
        type: 'tip',
        title: 'Budget Recommendation',
        description: 'Based on your spending patterns, consider following the 50/30/20 rule: 50% needs, 30% wants, 20% savings.',
        icon: <FaLightbulb className="w-5 h-5" />
      }
    ];
  };

  const insights = generateInsights();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('spending') || lowerMessage.includes('expense')) {
      return `Based on your transaction data, you've spent RM ${getTotalExpenses().toFixed(2)} this period. Your top spending categories are Food & Dining and Utilities. Consider setting spending limits for these categories to better control your budget.`;
    }
    
    if (lowerMessage.includes('income') || lowerMessage.includes('salary')) {
      return `Your total income this period is RM ${getTotalIncome().toFixed(2)}. This includes salary, freelance work, and investment returns. Your income streams look diversified, which is great for financial stability.`;
    }
    
    if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
      const savingsRate = ((getTotalIncome() - getTotalExpenses()) / getTotalIncome() * 100);
      return `You're currently saving ${savingsRate.toFixed(1)}% of your income. Financial experts recommend saving at least 20% of your income. ${savingsRate >= 20 ? 'You\'re doing great!' : 'Consider reducing discretionary spending to increase your savings rate.'}`;
    }
    
    if (lowerMessage.includes('budget') || lowerMessage.includes('plan')) {
      return `I recommend the 50/30/20 budgeting rule: 50% for needs (rent, utilities, groceries), 30% for wants (entertainment, dining out), and 20% for savings and debt repayment. Based on your current spending, you might want to focus on the "wants" category to optimize your budget.`;
    }
    
    if (lowerMessage.includes('investment') || lowerMessage.includes('invest')) {
      return `I see you have some investment income! That's excellent. Consider diversifying your portfolio and investing consistently. With your current savings rate, you could potentially increase your investment contributions by 10-15%.`;
    }
    
    return `I understand you're asking about "${userMessage}". Based on your financial data, I'd recommend focusing on tracking your expenses more closely and setting specific financial goals. Your current balance is RM ${getTotalBalance().toFixed(2)}. Is there a specific aspect of your finances you'd like me to analyze further?`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      type: 'user',
      message: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: messages.length + 2,
        type: 'ai',
        message: simulateAIResponse(inputMessage),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'border-emerald-500/20 bg-emerald-500/10';
      case 'warning':
        return 'border-red-500/20 bg-red-500/10';
      case 'tip':
        return 'border-blue-500/20 bg-blue-500/10';
      case 'trend':
        return 'border-purple-500/20 bg-purple-500/10';
      default:
        return 'border-gray-500/20 bg-gray-500/10';
    }
  };

  const getInsightIconColor = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'text-emerald-400';
      case 'warning':
        return 'text-red-400';
      case 'tip':
        return 'text-blue-400';
      case 'trend':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground pt-6 px-4 md:ml-64">
      <div className="flex flex-col items-start justify-start w-full h-full gap-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
              <FaRobot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Financial Analysis</h1>
              <p className="text-gray-400 text-sm">Get personalized insights and chat about your finances</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            AI Powered
          </Badge>
        </div>

        {/* Financial Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {insights.map((insight) => (
            <Card key={insight.id} className={`border-0 shadow-sm bg-white/5 backdrop-blur-sm ${getInsightColor(insight.type)}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-full ${getInsightIconColor(insight.type)}`}>
                    {insight.icon}
                  </div>
                  {insight.value && (
                    <span className="text-lg font-bold text-white">{insight.value}</span>
                  )}
                </div>
                <h3 className="font-semibold text-white mb-1">{insight.title}</h3>
                <p className="text-xs text-gray-300 leading-relaxed">{insight.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Main Chat */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm h-[500px] md:h-[600px] flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <FaRobot className="w-5 h-5 text-purple-400" />
                  AI Finance Assistant
                </CardTitle>
              </CardHeader>
              
              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.type === 'ai' && (
                      <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 h-8 w-8 flex items-center justify-center">
                        <FaRobot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div className={`max-w-[70%] p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-white/10 text-gray-100'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.message}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    {message.type === 'user' && (
                      <div className="p-2 rounded-full bg-gray-600 h-8 w-8 flex items-center justify-center">
                        <FaUser className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 h-8 w-8 flex items-center justify-center">
                      <FaRobot className="w-4 h-4 text-white" />
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
              
              {/* Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about your finances..."
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <FaPaperPlane className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Questions Sidebar */}
          <div className="space-y-4">
            <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-white">Quick Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "How much am I spending on food?",
                  "What's my savings rate?",
                  "How can I budget better?",
                  "Should I invest more?",
                  "Analyze my spending trends"
                ].map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="w-full text-left p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm text-gray-200 hover:text-white"
                  >
                    {question}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/5 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-white">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Balance</span>
                  <span className="text-white font-semibold">RM {getTotalBalance().toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Income</span>
                  <span className="text-emerald-400 font-semibold">+RM {getTotalIncome().toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Expenses</span>
                  <span className="text-red-400 font-semibold">-RM {getTotalExpenses().toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-gray-400 text-sm">Transactions</span>
                  <span className="text-white font-semibold">{dummyTransactions.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}