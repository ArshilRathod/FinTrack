import { createLoan, deleteLoan, listLoans, updateLoan } from '../store/dataStore.js';
import { calculateLoanInterest, calculateLoanProgress, getDaysUntilDate, getFinancialActionStatus, getFinancialItemDateLabel, getFinancialItemTypeLabel, getFinancialReminderMessage } from '../utils/finance.js';

const enrichFinancialItem = (item) => ({
  ...item,
  type: item.type || 'loan',
  typeLabel: getFinancialItemTypeLabel(item.type || 'loan'),
  dateLabel: getFinancialItemDateLabel(item.type || 'loan'),
  actionStatus: getFinancialActionStatus(item),
  reminderMessage: getFinancialReminderMessage(item),
  daysUntilAction: getDaysUntilDate(item.nextEmiDate),
  repaymentProgress: calculateLoanProgress(item),
  totalInterest: calculateLoanInterest(item)
});

export const createLoanEntry = async (req, res) => {
  const loan = await createLoan({
    ...req.body,
    loanAmount: Number(req.body.loanAmount),
    interestRate: Number(req.body.interestRate || 0),
    tenure: Number(req.body.tenure || 0),
    emiAmount: Number(req.body.emiAmount || 0),
    amountPaid: Number(req.body.amountPaid || 0),
    currentValue: req.body.currentValue,
    user: req.user.id
  });

  return res.status(201).json(enrichFinancialItem(loan));
};

export const getLoans = async (req, res) => {
  const items = (await listLoans(req.user.id)).map(enrichFinancialItem);
  const upcomingActions = [...items].sort((a, b) => new Date(a.nextEmiDate).getTime() - new Date(b.nextEmiDate).getTime());
  const reminders = items
    .filter((item) => item.reminderMessage)
    .map((item) => ({
      id: item._id,
      message: item.reminderMessage,
      type: item.type
    }));

  return res.json({
    items,
    loans: items,
    upcomingActions,
    reminders
  });
};

export const updateLoanEntry = async (req, res) => {
  const loan = await updateLoan(req.user.id, req.params.id, {
    ...req.body,
    loanAmount: Number(req.body.loanAmount),
    interestRate: Number(req.body.interestRate || 0),
    tenure: Number(req.body.tenure || 0),
    emiAmount: Number(req.body.emiAmount || 0),
    amountPaid: Number(req.body.amountPaid || 0),
    currentValue: req.body.currentValue
  });

  if (!loan) {
    return res.status(404).json({ message: 'Loan not found' });
  }

  return res.json(enrichFinancialItem(loan));
};

export const deleteLoanEntry = async (req, res) => {
  const deleted = await deleteLoan(req.user.id, req.params.id);

  if (!deleted) {
    return res.status(404).json({ message: 'Loan not found' });
  }

  return res.json({ success: true });
};
