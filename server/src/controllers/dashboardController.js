import { listExpenses, listLoans, listRecurringPayments } from '../store/dataStore.js';
import { calculateHealthScore, calculateLoanInterest, calculateLoanProgress, generateInsights, groupExpensesByCategory, groupExpensesByMonth, isLoanItem } from '../utils/finance.js';

export const getDashboard = async (req, res) => {
  const [expenseResult, allItems, recurringPayments] = await Promise.all([
    listExpenses(req.user.id),
    listLoans(req.user.id),
    listRecurringPayments(req.user.id)
  ]);
  const expenses = expenseResult.items;
  const loans = allItems.filter(isLoanItem);
  const homeRecurringPayments = recurringPayments.filter((payment) => payment.showOnHome);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });

  const monthlyExpense = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryTotals = groupExpensesByCategory(monthlyExpenses);
  const monthlyTrend = groupExpensesByMonth(expenses);
  const totalEmi = loans.reduce((sum, loan) => sum + loan.emiAmount, 0);
  const recurringCommitment = homeRecurringPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const healthScore = calculateHealthScore({
    monthlyIncome: req.user.monthlyIncome,
    monthlyExpense: monthlyExpense + recurringCommitment,
    totalEmi
  });
  const savingsProgress = Math.max(0, Math.min(100, Math.round(((req.user.monthlyIncome - monthlyExpense - recurringCommitment) / req.user.savingsGoal) * 100)));

  return res.json({
    welcome: {
      name: req.user.name,
      monthlyIncome: req.user.monthlyIncome,
      savingsGoal: req.user.savingsGoal
    },
    summary: {
      monthlyExpense,
      activeLoans: loans.length,
      savingsProgress,
      totalEmi,
      recurringCommitment,
      recurringCount: homeRecurringPayments.length
    },
    healthScore,
    insights: generateInsights({
      monthlyIncome: req.user.monthlyIncome,
      monthlyExpense,
      categoryTotals,
      loans
    }),
    charts: {
      categoryTotals,
      monthlyTrend
    },
    recurringPayments: homeRecurringPayments,
    recentExpenses: expenses.slice(0, 5),
    loans: loans.map((loan) => ({
      ...loan,
      repaymentProgress: calculateLoanProgress(loan),
      totalInterest: calculateLoanInterest(loan)
    }))
  });
};
