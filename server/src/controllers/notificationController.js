import { listExpenses, listLoans, listRecurringPayments } from '../store/dataStore.js';
import { getDaysUntilDate } from '../utils/finance.js';

const DEBUG_NOTIFICATIONS = process.env.DEBUG_NOTIFICATIONS === 'true';

export const getNotifications = async (req, res) => {
  try {
    const notifications = [];
    const userId = req.user.id;
    const { monthlyIncome, savingsGoal } = req.user;

    // 1. Budget Alerts (based on monthlyIncome - savingsGoal)
    const expenseResult = await listExpenses(userId);
    const expenses = expenseResult.items;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });

    const monthlyExpenseTotal = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const budgetLimit = Math.max(0, monthlyIncome - savingsGoal);

    if (budgetLimit > 0 && monthlyExpenseTotal >= 0.9 * budgetLimit) {
      notifications.push({
        id: `budget-${currentMonth}-${currentYear}`,
        title: 'Budget Alert',
        message: `You are within 10% of your monthly budget limit. Spending: ₹${monthlyExpenseTotal.toLocaleString()} / ₹${budgetLimit.toLocaleString()}.`,
        type: 'budget',
        severity: 'warning'
      });
    }

    // 2. Subscription / Recurring Payment Alerts (1-2 days before)
    const recurringPayments = await listRecurringPayments(userId);
    recurringPayments.forEach((payment) => {
      const dateField = payment.nextPaymentDate;
      const daysUntil = getDaysUntilDate(dateField);
      if (DEBUG_NOTIFICATIONS) {
        console.log(`[Notifications] Recurring: ${payment.title}, nextPaymentDate: ${dateField}, daysUntil: ${daysUntil}`);
      }
      if (daysUntil >= 0 && daysUntil <= 2) {
        let timeLabel = `in ${daysUntil} days`;
        if (daysUntil === 1) timeLabel = 'tomorrow';
        if (daysUntil === 0) timeLabel = 'today';

        notifications.push({
          id: `sub-${payment._id}`,
          title: 'Subscription Reminder',
          message: `${payment.title} of ₹${payment.amount} is due ${timeLabel}.`,
          type: 'subscription',
          severity: daysUntil === 0 ? 'warning' : 'info'
        });
      }
    });

    // 3. Loans / EMIs / FDs / Insurance Alerts (0-2 days before)
    const allItems = await listLoans(userId);
    allItems.forEach((item) => {
      const dateField = item.nextEmiDate;
      const daysUntil = getDaysUntilDate(dateField);
      if (DEBUG_NOTIFICATIONS) {
        console.log(`[Notifications] Loan: ${item.loanName}, type: ${item.type}, nextEmiDate: ${dateField}, daysUntil: ${daysUntil}`);
      }
      if (daysUntil >= 0 && daysUntil <= 2) {
        let title = 'Loan EMI Reminder';
        const amount = item.emiAmount || item.currentValue || item.loanAmount;

        if (item.type === 'fd') title = 'FD Maturing';
        else if (item.type === 'insurance') title = 'Insurance Premium';
        else if (item.type === 'investment') title = 'Investment Review';

        let timeLabel = `in ${daysUntil} days`;
        if (daysUntil === 1) timeLabel = 'tomorrow';
        if (daysUntil === 0) timeLabel = 'today';

        notifications.push({
          id: `item-${item._id}`,
          title,
          message: `${item.loanName || title} of ₹${amount} is due ${timeLabel}.`,
          type: 'loan',
          severity: daysUntil === 0 ? 'warning' : 'info'
        });
      }
    });

    if (DEBUG_NOTIFICATIONS) {
      console.log(`[Notifications] Total generated: ${notifications.length}`);
    }
    return res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};
