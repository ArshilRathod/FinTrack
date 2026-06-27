export type User = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  gender: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say';
  dob: string;
  city: string;
  state: string;
  country: string;
  photoUrl: string;
  monthlyIncome: number;
  savingsGoal: number;
  riskPreference: 'Conservative' | 'Balanced' | 'Growth';
};

export type StandardExpenseCategory = 'Food' | 'Travel' | 'Shopping' | 'Bills' | 'Others' | 'Hotel' | 'Sightseeing';
export type ExpenseCategory = StandardExpenseCategory | (string & {});

export type Expense = {
  _id: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  paymentMethod: 'UPI' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Net Banking' | 'Diary Entry' | 'Imported';
  notes: string;
  optionalNote?: string;
  involvedMembers?: any;
  memberPayments?: Record<string, boolean>;
  diaryId?: string;
};

export type FinancialItemType = 'loan' | 'fd' | 'insurance' | 'investment';

export type Loan = {
  _id: string;
  type: FinancialItemType;
  typeLabel: string;
  loanName: string;
  loanAmount: number;
  interestRate: number;
  tenure: number;
  emiAmount: number;
  nextEmiDate: string;
  startDate?: string | null;
  amountPaid: number;
  currentValue: number | null;
  status: string;
  dateLabel: string;
  actionStatus: string;
  reminderMessage: string | null;
  daysUntilAction: number;
  repaymentProgress: number;
  totalInterest: number;
};

export type RecurringPayment = {
  _id: string;
  title: string;
  category?: 'Insurance' | 'Policy' | 'Subscription' | 'Rent' | 'Utilities' | 'Investment' | 'Other';
  amount: number;
  frequency: string;
  nextPaymentDate: string;
  autopay?: boolean;
  reminderDaysBefore?: number;
  notes?: string;
  showOnHome: boolean;
};

export type Setting = {
  darkMode: boolean;
  currency: string;
  region: string;
  notifications: boolean;
  budgetAlerts: boolean;
  billPaymentReminders: boolean;
  largeTransactionAlerts: boolean;
  weeklySpendingSummary: boolean;
  monthlyFinancialReport: boolean;
  automaticCategorizationRules: boolean;
  recurringTransactionSetup: boolean;
  autoBudgetAllocation: boolean;
  exportFormat: 'CSV' | 'PDF';
};

export type Insight = {
  title: string;
  description: string;
  tone: 'critical' | 'warning' | 'positive' | 'info';
};

export type Topic = {
  section: string;
  title: string;
  description: string;
  example: string;
  chartHint: string;
  keyTakeaway: string;
  practicalTip: string;
};

export type DashboardData = {
  welcome: {
    name: string;
    monthlyIncome: number;
    savingsGoal: number;
  };
  summary: {
    monthlyExpense: number;
    activeLoans: number;
    savingsProgress: number;
    totalEmi: number;
    recurringCommitment: number;
    recurringCount: number;
  };
  healthScore: number;
  insights: Insight[];
  charts: {
    categoryTotals: { category: string; amount: number }[];
    monthlyTrend: { month: string; amount: number }[];
  };
  recurringPayments: RecurringPayment[];
  recentExpenses: Expense[];
  loans: Loan[];
};
