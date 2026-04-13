import { createRecurringPayment, deleteRecurringPayment, listRecurringPayments, updateRecurringPayment } from '../store/dataStore.js';

export const getRecurringPayments = async (req, res) => {
  const recurringPayments = await listRecurringPayments(req.user.id);
  const monthlyCommitment = recurringPayments.reduce((sum, payment) => sum + payment.amount, 0);

  return res.json({
    recurringPayments,
    summary: {
      count: recurringPayments.length,
      monthlyCommitment
    }
  });
};

export const createRecurringPaymentEntry = async (req, res) => {
  const recurringPayment = await createRecurringPayment({
    ...req.body,
    amount: Number(req.body.amount),
    reminderDaysBefore: Number(req.body.reminderDaysBefore || 3),
    showOnHome: Boolean(req.body.showOnHome),
    user: req.user.id
  });

  return res.status(201).json(recurringPayment);
};

export const updateRecurringPaymentEntry = async (req, res) => {
  const updates = {};

  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.amount !== undefined) updates.amount = Number(req.body.amount);
  if (req.body.frequency !== undefined) updates.frequency = req.body.frequency;
  if (req.body.nextPaymentDate !== undefined) updates.nextPaymentDate = req.body.nextPaymentDate;
  if (req.body.category !== undefined) updates.category = req.body.category;
  if (req.body.showOnHome !== undefined) updates.showOnHome = Boolean(req.body.showOnHome);
  if (req.body.autopay !== undefined) updates.autopay = Boolean(req.body.autopay);
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  if (req.body.reminderDaysBefore !== undefined) updates.reminderDaysBefore = Number(req.body.reminderDaysBefore);

  const recurringPayment = await updateRecurringPayment(req.user.id, req.params.id, {
    ...updates
  });

  if (!recurringPayment) {
    return res.status(404).json({ message: 'Recurring payment not found' });
  }

  return res.json(recurringPayment);
};

export const deleteRecurringPaymentEntry = async (req, res) => {
  const removed = await deleteRecurringPayment(req.user.id, req.params.id);

  if (!removed) {
    return res.status(404).json({ message: 'Recurring payment not found' });
  }

  return res.json({ message: 'Recurring payment deleted' });
};
