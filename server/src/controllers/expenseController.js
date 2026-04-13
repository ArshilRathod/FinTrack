import { createExpense, deleteExpense, listExpenses, updateExpense } from '../store/dataStore.js';
import { groupExpensesByCategory } from '../utils/finance.js';
import { normalizeImportRow, parseImportFile } from '../utils/importParser.js';

export const createExpenseEntry = async (req, res) => {
  const expense = await createExpense({
    ...req.body,
    amount: Number(req.body.amount),
    user: req.user.id
  });

  return res.status(201).json(expense);
};

export const getExpenses = async (req, res) => {
  const result = await listExpenses(req.user.id, req.query);
  const expenses = result.items;
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return res.json({
    expenses,
    summary: {
      total,
      count: expenses.length,
      categoryBreakdown: groupExpensesByCategory(expenses)
    },
    pagination: result.pagination
  });
};

export const updateExpenseEntry = async (req, res) => {
  const expense = await updateExpense(req.user.id, req.params.id, {
    ...req.body,
    amount: Number(req.body.amount)
  });

  if (!expense) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  return res.json(expense);
};

export const deleteExpenseEntry = async (req, res) => {
  const removed = await deleteExpense(req.user.id, req.params.id);

  if (!removed) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  return res.json({ message: 'Expense deleted' });
};

export const importExpenses = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const dryRun = req.query.dryRun === '1';
  const parsedRows = await parseImportFile({
    buffer: req.file.buffer,
    filename: req.file.originalname || ''
  });

  const normalized = parsedRows.map(normalizeImportRow).filter((row) => row.date && row.amount);
  const existingResult = await listExpenses(req.user.id);
  const existing = existingResult.items || [];
  const existingKeys = new Set(
    existing.map((expense) =>
      [
        expense.date.slice(0, 10),
        Number(expense.amount || 0).toFixed(2),
        String(expense.category || '').toLowerCase(),
        String(expense.paymentMethod || '').toLowerCase(),
        String(expense.notes || '').trim().toLowerCase()
      ].join('|')
    )
  );

  const seenInFile = new Set();
  const rows = normalized.map((row) => {
    const key = [
      row.date,
      Number(row.amount || 0).toFixed(2),
      String(row.category || '').toLowerCase(),
      String(row.paymentMethod || '').toLowerCase(),
      String(row.notes || '').trim().toLowerCase()
    ].join('|');

    const errors = [];
    if (existingKeys.has(key)) errors.push('Duplicate of existing expense');
    if (seenInFile.has(key)) errors.push('Duplicate within file');
    seenInFile.add(key);

    return {
      ...row,
      valid: errors.length === 0,
      errors
    };
  });

  if (dryRun) {
    return res.json({ rows, summary: { total: rows.length, valid: rows.filter((r) => r.valid).length } });
  }

  const validRows = rows.filter((row) => row.valid);
  for (const row of validRows) {
    await createExpense({
      user: req.user.id,
      amount: Number(row.amount),
      category: row.category,
      date: row.date,
      paymentMethod: row.paymentMethod || 'Imported',
      notes: row.notes || ''
    });
  }

  return res.json({
    message: 'Import completed',
    summary: {
      total: rows.length,
      imported: validRows.length,
      skipped: rows.length - validRows.length
    }
  });
};
