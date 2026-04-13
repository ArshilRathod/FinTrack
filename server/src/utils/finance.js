export const isLoanItem = (item) => (item.type || 'loan') === 'loan';

export const getFinancialItemTypeLabel = (type) => {
  switch (type) {
    case 'fd':
      return 'Fixed Deposit';
    case 'insurance':
      return 'Insurance';
    case 'investment':
      return 'Investment';
    default:
      return 'Loan / EMI';
  }
};

export const getFinancialItemDateLabel = (type) => {
  switch (type) {
    case 'fd':
      return 'Maturity Date';
    case 'insurance':
      return 'Premium Due Date';
    case 'investment':
      return 'Review Date';
    default:
      return 'Next EMI Date';
  }
};

export const getFinancialActionStatus = (item) => {
  switch (item.type) {
    case 'fd':
      return 'Maturing';
    case 'investment':
      return 'Review';
    default:
      return 'Due soon';
  }
};

export const getDaysUntilDate = (dateValue) => {
  const now = new Date();
  const target = new Date(dateValue);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
};

export const getFinancialReminderMessage = (item) => {
  const amount = item.currentValue ?? item.loanAmount;
  const daysUntil = getDaysUntilDate(item.nextEmiDate);

  if (![3, 1, 0].includes(daysUntil)) {
    return null;
  }

  const amountLabel = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);

  if (item.type === 'fd') {
    if (daysUntil === 0) return `FD of ${amountLabel} is maturing today`;
    if (daysUntil === 1) return `FD of ${amountLabel} is maturing tomorrow`;
    return `FD of ${amountLabel} is maturing in 3 days`;
  }

  if (item.type === 'investment') {
    if (daysUntil === 0) return `Investment review for ${amountLabel} is due today`;
    if (daysUntil === 1) return `Investment review for ${amountLabel} is due tomorrow`;
    return `Investment review for ${amountLabel} is due in 3 days`;
  }

  if (item.type === 'insurance') {
    if (daysUntil === 0) return `Insurance premium of ${amountLabel} is due today`;
    if (daysUntil === 1) return `Insurance premium of ${amountLabel} is due tomorrow`;
    return `Insurance premium of ${amountLabel} is due in 3 days`;
  }

  if (daysUntil === 0) return `EMI of ${amountLabel} is due today`;
  if (daysUntil === 1) return `EMI of ${amountLabel} is due tomorrow`;
  return `EMI of ${amountLabel} is due in 3 days`;
};

export const calculateLoanProgress = (loan) => {
  if (!isLoanItem(loan)) return 0;
  const totalPayable = loan.emiAmount * loan.tenure;
  if (!totalPayable) return 0;
  return Math.min(100, Math.round((loan.amountPaid / totalPayable) * 100));
};

export const calculateLoanInterest = (loan) => {
  if (!isLoanItem(loan)) return 0;
  const totalPayable = loan.emiAmount * loan.tenure;
  return Math.max(0, Math.round(totalPayable - loan.loanAmount));
};

export const groupExpensesByCategory = (expenses) => {
  const defaultCategories = ['Food', 'Travel', 'Shopping', 'Bills', 'Others'];
  const dataCategories = [...new Set(expenses.map((e) => e.category))];
  
  // Combine defaults and data categories, removing duplicates
  const allCategories = [...new Set([...defaultCategories, ...dataCategories])];
  const totals = allCategories.map((category) => ({ category, amount: 0 }));

  expenses.forEach((expense) => {
    const bucket = totals.find((item) => item.category === expense.category);
    if (bucket) bucket.amount += expense.amount;
  });

  return totals.sort((a, b) => b.amount - a.amount);
};

export const groupExpensesByMonth = (expenses) => {
  const monthMap = new Map();

  expenses.forEach((expense) => {
    const date = new Date(expense.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const label = date.toLocaleString('en-US', { month: 'short' });
    monthMap.set(key, (monthMap.get(key) || { month: label, amount: 0 }));
    monthMap.get(key).amount += expense.amount;
  });

  return Array.from(monthMap.values()).slice(-6);
};

export const calculateHealthScore = ({ monthlyIncome, monthlyExpense, totalEmi }) => {
  const savingsRate = monthlyIncome > 0 ? Math.max(0, (monthlyIncome - monthlyExpense) / monthlyIncome) : 0;
  const spendingControl = monthlyIncome > 0 ? Math.max(0, 1 - monthlyExpense / monthlyIncome) : 0;
  const debtRatio = monthlyIncome > 0 ? Math.max(0, 1 - totalEmi / monthlyIncome) : 0;

  const score = Math.round((savingsRate * 40 + spendingControl * 35 + debtRatio * 25) * 100);
  return Math.max(0, Math.min(100, score));
};

export const generateInsights = ({ monthlyIncome, monthlyExpense, categoryTotals, loans }) => {
  const insights = [];
  const activeLoans = loans.filter(isLoanItem);
  const totalEmi = activeLoans.reduce((sum, loan) => sum + loan.emiAmount, 0);
  const topCategory = [...categoryTotals].sort((a, b) => b.amount - a.amount)[0];

  if (topCategory && topCategory.amount > monthlyIncome * 0.18) {
    insights.push({
      title: 'Overspending Alert',
      tone: 'critical',
      description: `${topCategory.category} spending is consuming a large share of this month’s income.`
    });
  }

  if (monthlyExpense > monthlyIncome * 0.8) {
    insights.push({
      title: 'Savings Suggestion',
      tone: 'warning',
      description: 'Your spending is above 80% of income. Tighten discretionary categories to protect savings.'
    });
  } else {
    insights.push({
      title: '50/30/20 Budget Check',
      tone: 'positive',
      description: 'You are within a workable range. Push at least 20% of income toward savings and debt prepayment.'
    });
  }

  if (totalEmi > monthlyIncome * 0.35) {
    insights.push({
      title: 'Loan Optimization',
      tone: 'critical',
      description: 'Your EMI burden is high. Consider refinancing or prepaying the highest-interest loan first.'
    });
  } else if (activeLoans.length) {
    insights.push({
      title: 'Debt Strategy',
      tone: 'info',
      description: 'Your EMI load looks manageable. A small recurring prepayment can reduce total interest meaningfully.'
    });
  }

  insights.push({
    title: 'Weekly Focus',
    tone: 'info',
    description: 'Set a weekly cap for discretionary spending and review it every Sunday to stay on budget.'
  });

  return insights;
};
