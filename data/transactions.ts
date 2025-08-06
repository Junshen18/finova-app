export interface Transaction {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  description?: string;
  status?: 'completed' | 'pending' | 'failed';
}

export const dummyTransactions: Transaction[] = [
  // Income transactions
  {
    id: 1,
    title: "Salary Deposit",
    amount: 3500.00,
    category: "Salary",
    date: "2024-01-15",
    type: "income",
    description: "Monthly salary from TechCorp",
    status: "completed"
  },
  {
    id: 2,
    title: "Freelance Project",
    amount: 800.00,
    category: "Freelance",
    date: "2024-01-12",
    type: "income",
    description: "Web development project for Client XYZ",
    status: "completed"
  },
  {
    id: 3,
    title: "Investment Dividend",
    amount: 150.00,
    category: "Investment",
    date: "2024-01-10",
    type: "income",
    description: "Quarterly dividend from stock portfolio",
    status: "completed"
  },
  {
    id: 4,
    title: "Refund - Online Purchase",
    amount: 89.99,
    category: "Refund",
    date: "2024-01-08",
    type: "income",
    description: "Return of defective electronics",
    status: "completed"
  },

  // Expense transactions
  {
    id: 5,
    title: "Grocery Shopping",
    amount: -120.50,
    category: "Food & Dining",
    date: "2024-01-14",
    type: "expense",
    description: "Weekly groceries from Tesco",
    status: "completed"
  },
  {
    id: 6,
    title: "Netflix Subscription",
    amount: -15.99,
    category: "Entertainment",
    date: "2024-01-13",
    type: "expense",
    description: "Monthly streaming subscription",
    status: "completed"
  },
  {
    id: 7,
    title: "Gas Station",
    amount: -65.00,
    category: "Transportation",
    date: "2024-01-12",
    type: "expense",
    description: "Fuel for car",
    status: "completed"
  },
  {
    id: 8,
    title: "Coffee Shop",
    amount: -8.50,
    category: "Food & Dining",
    date: "2024-01-11",
    type: "expense",
    description: "Morning coffee at Starbucks",
    status: "completed"
  },
  {
    id: 9,
    title: "Electricity Bill",
    amount: -85.30,
    category: "Utilities",
    date: "2024-01-10",
    type: "expense",
    description: "Monthly electricity payment",
    status: "completed"
  },
  {
    id: 10,
    title: "Restaurant Dinner",
    amount: -45.00,
    category: "Food & Dining",
    date: "2024-01-09",
    type: "expense",
    description: "Dinner at Italian restaurant",
    status: "completed"
  },
  {
    id: 11,
    title: "Gym Membership",
    amount: -50.00,
    category: "Health & Fitness",
    date: "2024-01-08",
    type: "expense",
    description: "Monthly gym membership",
    status: "completed"
  },
  {
    id: 12,
    title: "Online Shopping",
    amount: -75.25,
    category: "Shopping",
    date: "2024-01-07",
    type: "expense",
    description: "Clothes from Amazon",
    status: "completed"
  },
  {
    id: 13,
    title: "Phone Bill",
    amount: -35.00,
    category: "Utilities",
    date: "2024-01-06",
    type: "expense",
    description: "Monthly mobile phone bill",
    status: "completed"
  },
  {
    id: 14,
    title: "Movie Tickets",
    amount: -24.00,
    category: "Entertainment",
    date: "2024-01-05",
    type: "expense",
    description: "Cinema tickets for 2 people",
    status: "completed"
  },
  {
    id: 15,
    title: "Pharmacy",
    amount: -18.75,
    category: "Health & Fitness",
    date: "2024-01-04",
    type: "expense",
    description: "Over-the-counter medication",
    status: "completed"
  },

  // Transfer transactions
  {
    id: 16,
    title: "Transfer to Savings",
    amount: -500.00,
    category: "Transfer",
    date: "2024-01-03",
    type: "transfer",
    description: "Monthly savings transfer",
    status: "completed"
  },
  {
    id: 17,
    title: "Transfer from Savings",
    amount: 200.00,
    category: "Transfer",
    date: "2024-01-02",
    type: "transfer",
    description: "Emergency fund withdrawal",
    status: "completed"
  }
];

// Helper function to get transactions by type
export const getTransactionsByType = (type: 'income' | 'expense' | 'transfer') => {
  return dummyTransactions.filter(transaction => transaction.type === type);
};

// Helper function to get transactions by category
export const getTransactionsByCategory = (category: string) => {
  return dummyTransactions.filter(transaction => transaction.category === category);
};

// Helper function to get total balance
export const getTotalBalance = () => {
  return dummyTransactions.reduce((total, transaction) => total + transaction.amount, 0);
};

// Helper function to get total income
export const getTotalIncome = () => {
  return dummyTransactions
    .filter(transaction => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0);
};

// Helper function to get total expenses
export const getTotalExpenses = () => {
  return Math.abs(dummyTransactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0));
}; 