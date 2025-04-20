import { useState } from "react";

export default function Dashboard() {
  // Format current date and time
  const now = new Date();
  const formattedTime = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const formattedDate = now.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-16 sm:w-64 bg-white shadow-md hidden sm:block">
        <div className="p-4 flex justify-center sm:justify-start">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">F</div>
          <span className="ml-2 font-semibold text-lg hidden sm:block">Finova</span>
        </div>
        <nav className="mt-8">
          <ul>
            <li className="mb-2">
              <a href="#" className="flex items-center p-3 text-blue-500 bg-blue-50 rounded-lg mx-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 16a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"></path>
                </svg>
                <span className="ml-2 hidden sm:block">Dashboard</span>
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg mx-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-2 hidden sm:block">Transactions</span>
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg mx-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-2 hidden sm:block">Budgets</span>
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg mx-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-2 hidden sm:block">Reports</span>
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg mx-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-2 hidden sm:block">Settings</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      
      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-2 border-t sm:hidden z-50">
        <div className="grid grid-cols-5 gap-1">
          <a href="#" className="flex flex-col items-center p-2 text-blue-500 bg-blue-50 rounded">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 16a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"></path>
            </svg>
          </a>
          <a href="#" className="flex flex-col items-center p-2 text-gray-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
            </svg>
          </a>
          <a href="#" className="flex flex-col items-center p-2 text-gray-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd"></path>
            </svg>
          </a>
          <a href="#" className="flex flex-col items-center p-2 text-gray-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
            </svg>
          </a>
          <a href="#" className="flex flex-col items-center p-2 text-gray-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
            </svg>
          </a>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 sm:p-8 pb-20 sm:pb-8 overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">{formattedTime} ({timeZone})</p>
            <p className="text-xs text-gray-500">{formattedDate}</p>
          </div>
        </header>

        {/* Main financial summary card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="flex flex-col md:flex-row">
            <div className="p-6 md:w-2/3">
              <h2 className="text-xl font-semibold mb-2">Financial Summary</h2>
              <p className="text-gray-600 mb-6">Connect your accounts to personalize your dashboard, track expenses, and analyze your spending habits.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <span className="text-xs text-gray-500">Total Balance</span>
                  <p className="text-xl font-bold text-blue-600">$12,458.33</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <span className="text-xs text-gray-500">Income (Monthly)</span>
                  <p className="text-xl font-bold text-green-600">$4,285.00</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <span className="text-xs text-gray-500">Expenses (Monthly)</span>
                  <p className="text-xl font-bold text-red-600">$2,873.45</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-400 to-indigo-600 p-6 text-white md:w-1/3 flex flex-col justify-center">
              <h3 className="font-bold mb-2">Link your accounts</h3>
              <p className="mb-4 text-sm">Connect your bank accounts for seamless expense tracking and financial insights.</p>
              <button className="bg-white text-blue-600 rounded-lg py-2 px-4 font-medium hover:bg-blue-50 transition-colors">
                Connect
              </button>
            </div>
          </div>
        </div>

        {/* Categories / Recent Transactions section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Expense Categories</h2>
            <a href="#" className="text-blue-500 text-sm hover:underline">View All</a>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-400">
              <h3 className="font-semibold mb-2">Food & Dining</h3>
              <p className="text-gray-500 text-sm mb-2">Monthly spending on restaurants and groceries</p>
              <div className="flex justify-between items-end">
                <span className="text-xl font-bold">$843.55</span>
                <span className="text-xs text-red-500">+12% from last month</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-400">
              <h3 className="font-semibold mb-2">Housing</h3>
              <p className="text-gray-500 text-sm mb-2">Rent, utilities, and home maintenance</p>
              <div className="flex justify-between items-end">
                <span className="text-xl font-bold">$1,200.00</span>
                <span className="text-xs text-gray-500">Same as last month</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-400">
              <h3 className="font-semibold mb-2">Transportation</h3>
              <p className="text-gray-500 text-sm mb-2">Gas, public transit, and car maintenance</p>
              <div className="flex justify-between items-end">
                <span className="text-xl font-bold">$312.75</span>
                <span className="text-xs text-green-500">-5% from last month</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-400">
              <h3 className="font-semibold mb-2">Entertainment</h3>
              <p className="text-gray-500 text-sm mb-2">Movies, events, and subscriptions</p>
              <div className="flex justify-between items-end">
                <span className="text-xl font-bold">$187.33</span>
                <span className="text-xs text-red-500">+8% from last month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Notifications</h2>
            <a href="#" className="text-blue-500 text-sm hover:underline">See all</a>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b p-4 flex items-start">
              <div className="bg-yellow-100 p-2 rounded-full mr-3">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold">Upcoming Bill: Electricity</h3>
                  <span className="text-xs text-gray-500">2 days ago</span>
                </div>
                <p className="text-sm text-gray-600">Your electricity bill of $145.28 is due in 3 days. Set up auto-pay to avoid late fees.</p>
              </div>
            </div>
            
            <div className="border-b p-4 flex items-start">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold">Budget Goal Achieved</h3>
                  <span className="text-xs text-gray-500">1 week ago</span>
                </div>
                <p className="text-sm text-gray-600">Congratulations! You've met your savings goal for the month. Keep up the good work!</p>
              </div>
            </div>
            
            <div className="p-4 flex items-start">
              <div className="bg-red-100 p-2 rounded-full mr-3">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold">Unusual Spending Detected</h3>
                  <span className="text-xs text-gray-500">2 weeks ago</span>
                </div>
                <p className="text-sm text-gray-600">We've noticed higher than usual spending in the "Shopping" category this month. Review your transactions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Insights section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Financial Insights</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-blue-800 mb-2">Spending Analysis</h3>
              <p className="text-sm text-gray-600 mb-2">See where your money is going and identify opportunities to save.</p>
              <button className="text-blue-500 text-sm font-medium hover:underline">View Report →</button>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-blue-800 mb-2">Financial Goals</h3>
              <p className="text-sm text-gray-600 mb-2">Track progress towards your savings and debt payoff goals.</p>
              <button className="text-blue-500 text-sm font-medium hover:underline">Set Goals →</button>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-blue-800 mb-2">Investment Tracker</h3>
              <p className="text-sm text-gray-600 mb-2">Monitor your investments and track portfolio performance.</p>
              <button className="text-blue-500 text-sm font-medium hover:underline">Connect Accounts →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
