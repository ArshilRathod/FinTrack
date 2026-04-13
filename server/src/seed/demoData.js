import { countExpenses, countLoans, createExpense, createLoan, getSettings, upsertSettings } from '../store/dataStore.js';

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const daysAhead = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export const seedDemoData = async (userId) => {
  const [expenseCount, loanCount, settings] = await Promise.all([
    countExpenses(userId),
    countLoans(userId),
    getSettings(userId)
  ]);

  if (!expenseCount) {
    await Promise.all([
      createExpense({ user: userId, amount: 420, category: 'Food', date: daysAgo(1), paymentMethod: 'UPI', notes: 'Lunch and coffee' }),
      createExpense({ user: userId, amount: 1850, category: 'Bills', date: daysAgo(3), paymentMethod: 'Net Banking', notes: 'Electricity bill' }),
      createExpense({ user: userId, amount: 760, category: 'Travel', date: daysAgo(4), paymentMethod: 'UPI', notes: 'Cab rides' }),
      createExpense({ user: userId, amount: 2600, category: 'Shopping', date: daysAgo(7), paymentMethod: 'Credit Card', notes: 'Work essentials' }),
      createExpense({ user: userId, amount: 980, category: 'Food', date: daysAgo(10), paymentMethod: 'Debit Card', notes: 'Dinner outing' }),
      createExpense({ user: userId, amount: 540, category: 'Others', date: daysAgo(12), paymentMethod: 'Cash', notes: 'Subscriptions' }),
      createExpense({ user: userId, amount: 2200, category: 'Bills', date: daysAgo(17), paymentMethod: 'Net Banking', notes: 'Internet + mobile' }),
      createExpense({ user: userId, amount: 1300, category: 'Travel', date: daysAgo(22), paymentMethod: 'UPI', notes: 'Weekend trip fuel' })
    ]);
  }

  if (!loanCount) {
    await Promise.all([
      createLoan({
        user: userId,
        type: 'loan',
        loanName: 'Car Loan',
        loanAmount: 450000,
        interestRate: 9.2,
        tenure: 60,
        emiAmount: 9350,
        nextEmiDate: daysAhead(6),
        amountPaid: 112200
      }),
      createLoan({
        user: userId,
        type: 'loan',
        loanName: 'Laptop EMI',
        loanAmount: 120000,
        interestRate: 13.4,
        tenure: 18,
        emiAmount: 7600,
        nextEmiDate: daysAhead(12),
        amountPaid: 45600
      }),
      createLoan({
        user: userId,
        type: 'fd',
        loanName: 'Emergency Fund FD',
        loanAmount: 50000,
        interestRate: 7.1,
        tenure: 0,
        emiAmount: 0,
        nextEmiDate: daysAhead(3),
        currentValue: 52400
      }),
      createLoan({
        user: userId,
        type: 'insurance',
        loanName: 'Health Insurance',
        loanAmount: 5000,
        interestRate: 0,
        tenure: 0,
        emiAmount: 0,
        nextEmiDate: daysAhead(1),
        currentValue: 5000
      }),
      createLoan({
        user: userId,
        type: 'investment',
        loanName: 'Equity Mutual Fund',
        loanAmount: 25000,
        interestRate: 0,
        tenure: 0,
        emiAmount: 0,
        nextEmiDate: daysAhead(8),
        currentValue: 28600
      })
    ]);
  }

  if (!settings) {
    await upsertSettings(userId, {
      darkMode: false,
      currency: 'INR',
      region: 'India',
      notifications: true,
      budgetAlerts: true,
      billPaymentReminders: true,
      largeTransactionAlerts: true,
      weeklySpendingSummary: true,
      monthlyFinancialReport: true,
      automaticCategorizationRules: true,
      recurringTransactionSetup: true,
      autoBudgetAllocation: false,
      exportFormat: 'CSV'
    });
  }

};
