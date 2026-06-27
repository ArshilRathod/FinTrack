import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const storePath = fileURLToPath(new URL('../../data/store.json', import.meta.url));

const nowIso = () => new Date().toISOString();

const defaultSettings = (userId) => ({
  _id: randomUUID(),
  user: userId,
  darkMode: false,
  currency: 'INR',
  region: 'India',
  notifications: true,
  budgetAlerts: true,
  billPaymentReminders: true,
  largeTransactionAlerts: false,
  weeklySpendingSummary: true,
  monthlyFinancialReport: true,
  automaticCategorizationRules: true,
  recurringTransactionSetup: true,
  autoBudgetAllocation: false,
  exportFormat: 'CSV',
  createdAt: nowIso(),
  updatedAt: nowIso()
});

const emptyStore = () => ({
  users: [],
  expenses: [],
  loans: [],
  settings: [],
  recurringPayments: [],
  diaries: []
});

const ensureShape = (store) => ({
  ...emptyStore(),
  ...store,
  users: store.users || [],
  expenses: store.expenses || [],
  loans: store.loans || [],
  settings: store.settings || [],
  recurringPayments: store.recurringPayments || [],
  diaries: store.diaries || []
});

const readStore = () => {
  if (!fs.existsSync(storePath)) {
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(emptyStore(), null, 2));
  }

  return ensureShape(JSON.parse(fs.readFileSync(storePath, 'utf8')));
};

const writeStore = (store) => {
  fs.writeFileSync(storePath, JSON.stringify(ensureShape(store), null, 2));
};

const omitUndefined = (payload) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');
const normalizeId = (item) => item?._id || item?.id;

const byUser = (userId) => (item) => (item.user || item.userId) === userId;

const normalizeUser = (user) => {
  if (!user) return null;
  return { ...user, id: user.id || user._id };
};

const normalizeExpense = (expense) => {
  if (!expense) return null;
  const id = normalizeId(expense);
  return {
    ...expense,
    _id: id,
    id,
    user: expense.user || expense.userId,
    amount: Number(expense.amount || 0),
    notes: expense.notes || '',
    optionalNote: expense.optionalNote || '',
    date: expense.date || nowIso(),
    involvedMembers: expense.involvedMembers ?? [],
    memberPayments: expense.memberPayments
  };
};

const normalizeLoan = (loan) => {
  if (!loan) return null;
  const id = normalizeId(loan);
  return {
    ...loan,
    _id: id,
    id,
    user: loan.user || loan.userId,
    type: loan.type || 'loan',
    loanAmount: Number(loan.loanAmount || 0),
    interestRate: Number(loan.interestRate || 0),
    tenure: Number(loan.tenure || 0),
    emiAmount: Number(loan.emiAmount || 0),
    amountPaid: Number(loan.amountPaid || 0),
    currentValue: loan.currentValue ?? null,
    status: loan.status || 'Active'
  };
};

const normalizeRecurringPayment = (payment) => {
  if (!payment) return null;
  const id = normalizeId(payment);
  return {
    ...payment,
    _id: id,
    id,
    user: payment.user || payment.userId,
    amount: Number(payment.amount || 0),
    category: payment.category || 'Other',
    frequency: payment.frequency || 'Monthly',
    autopay: Boolean(payment.autopay),
    reminderDaysBefore: Number(payment.reminderDaysBefore || 3),
    notes: payment.notes || '',
    showOnHome: Boolean(payment.showOnHome)
  };
};

const normalizeSetting = (setting) => {
  if (!setting) return null;
  const id = normalizeId(setting);
  return {
    ...defaultSettings(setting.user || setting.userId),
    ...setting,
    _id: id,
    id,
    user: setting.user || setting.userId
  };
};

const normalizeDiary = (diary, expenses = []) => {
  if (!diary) return null;
  const id = normalizeId(diary);
  return {
    ...diary,
    _id: id,
    id,
    user: diary.user || diary.userId,
    members: diary.members || [],
    expenses: expenses.filter((expense) => expense.diaryId === id).map(normalizeExpense)
  };
};

export const sanitizeUser = (user) => {
  const normalized = normalizeUser(user);
  if (!normalized) return null;
  const { password, ...safeUser } = normalized;
  return safeUser;
};

export const findUserByEmail = async (email) => {
  const store = readStore();
  return normalizeUser(store.users.find((user) => normalizeEmail(user.email) === normalizeEmail(email)));
};

export const findUserById = async (id) => {
  const store = readStore();
  return normalizeUser(store.users.find((user) => (user.id || user._id) === id));
};

export const createUser = async ({ name, email, password = null, photoUrl = '' }) => {
  const store = readStore();
  const [firstName = '', ...lastNameParts] = name.trim().split(/\s+/);
  const timestamp = nowIso();
  const user = {
    id: randomUUID(),
    name,
    email: normalizeEmail(email),
    password,
    firstName,
    lastName: lastNameParts.join(' '),
    phone: '',
    bio: '',
    gender: 'Prefer not to say',
    dob: '',
    city: '',
    state: '',
    country: '',
    photoUrl,
    monthlyIncome: 0,
    savingsGoal: 0,
    riskPreference: 'Balanced',
    createdAt: timestamp,
    updatedAt: timestamp
  };
  store.users.push(user);
  store.settings.push(defaultSettings(user.id));
  writeStore(store);
  return normalizeUser(user);
};

export const updateUser = async (userId, updates = {}) => {
  const store = readStore();
  const index = store.users.findIndex((user) => (user.id || user._id) === userId);
  if (index === -1) return null;

  const data = omitUndefined({
    ...updates,
    email: updates.email !== undefined ? normalizeEmail(updates.email) : undefined,
    updatedAt: nowIso()
  });
  store.users[index] = { ...store.users[index], ...data };
  writeStore(store);
  return normalizeUser(store.users[index]);
};

export const createExpense = async (payload) => {
  const store = readStore();
  const timestamp = nowIso();
  const expense = normalizeExpense({
    _id: randomUUID(),
    user: payload.user || payload.userId,
    amount: Number(payload.amount || 0),
    category: payload.category || 'Others',
    date: payload.date ? new Date(payload.date).toISOString() : timestamp,
    paymentMethod: payload.paymentMethod || 'Cash',
    notes: payload.notes || '',
    optionalNote: payload.optionalNote || '',
    diaryId: payload.diaryId || null,
    involvedMembers: payload.involvedMembers ?? [],
    memberPayments: payload.memberPayments,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  store.expenses.push(expense);
  writeStore(store);
  return expense;
};

export const updateExpense = async (userId, id, updates = {}) => {
  const store = readStore();
  const index = store.expenses.findIndex((expense) => normalizeId(expense) === id && byUser(userId)(expense));
  if (index === -1) return null;

  const data = omitUndefined({
    ...updates,
    amount: updates.amount !== undefined ? Number(updates.amount) : undefined,
    date: updates.date ? new Date(updates.date).toISOString() : undefined,
    updatedAt: nowIso()
  });
  store.expenses[index] = normalizeExpense({ ...store.expenses[index], ...data });
  writeStore(store);
  return store.expenses[index];
};

export const deleteExpense = async (userId, expenseId) => {
  const store = readStore();
  const before = store.expenses.length;
  store.expenses = store.expenses.filter((expense) => !(normalizeId(expense) === expenseId && byUser(userId)(expense)));
  writeStore(store);
  return store.expenses.length !== before;
};

export const listExpenses = async (userId, filters = {}) => {
  const limit = filters.limit ? Math.min(Number(filters.limit) || 0, 500) : undefined;
  const page = Number(filters.page) || 1;
  const includeDiary = filters.includeDiary === true || filters.includeDiary === 'true';

  let items = readStore().expenses.map(normalizeExpense).filter(byUser(userId));
  if (filters.category) items = items.filter((expense) => expense.category === filters.category);
  if (filters.from) items = items.filter((expense) => new Date(expense.date) >= new Date(filters.from));
  if (filters.to) items = items.filter((expense) => new Date(expense.date) <= new Date(filters.to));
  if (filters.diaryId) items = items.filter((expense) => expense.diaryId === filters.diaryId);
  if (filters.untracked) items = items.filter((expense) => !expense.diaryId);
  if (!includeDiary && !filters.diaryId) {
    items = items.filter((expense) => !expense.diaryId && expense.paymentMethod !== 'Diary Entry');
  }

  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  const total = items.length;
  if (limit) {
    items = items.slice((page - 1) * limit, page * limit);
  }

  return {
    items,
    pagination: limit ? { page, limit, total, totalPages: Math.ceil(total / limit) } : null
  };
};

export const countExpenses = async (userId) => readStore().expenses.filter(byUser(userId)).length;

export const createLoan = async (payload) => {
  const store = readStore();
  const timestamp = nowIso();
  const loan = normalizeLoan({
    _id: randomUUID(),
    user: payload.user || payload.userId,
    type: payload.type || 'loan',
    loanName: payload.loanName,
    loanAmount: payload.loanAmount,
    interestRate: payload.interestRate,
    tenure: payload.tenure,
    emiAmount: payload.emiAmount,
    nextEmiDate: payload.nextEmiDate,
    startDate: payload.startDate || null,
    amountPaid: payload.amountPaid,
    currentValue: payload.currentValue === '' ? null : payload.currentValue,
    status: payload.status || 'Active',
    createdAt: timestamp,
    updatedAt: timestamp
  });
  store.loans.push(loan);
  writeStore(store);
  return loan;
};

export const updateLoan = async (userId, loanId, updates = {}) => {
  const store = readStore();
  const index = store.loans.findIndex((loan) => normalizeId(loan) === loanId && byUser(userId)(loan));
  if (index === -1) return null;
  store.loans[index] = normalizeLoan({ ...store.loans[index], ...omitUndefined(updates), updatedAt: nowIso() });
  writeStore(store);
  return store.loans[index];
};

export const listLoans = async (userId) =>
  readStore().loans.map(normalizeLoan).filter(byUser(userId)).sort((a, b) => new Date(a.nextEmiDate) - new Date(b.nextEmiDate));

export const countLoans = async (userId) => readStore().loans.filter(byUser(userId)).length;

export const deleteLoan = async (userId, loanId) => {
  const store = readStore();
  const before = store.loans.length;
  store.loans = store.loans.filter((loan) => !(normalizeId(loan) === loanId && byUser(userId)(loan)));
  writeStore(store);
  return store.loans.length !== before;
};

export const listRecurringPayments = async (userId) =>
  readStore().recurringPayments.map(normalizeRecurringPayment).filter(byUser(userId)).sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate));

export const createRecurringPayment = async (payload) => {
  const store = readStore();
  const timestamp = nowIso();
  const recurringPayment = normalizeRecurringPayment({
    _id: randomUUID(),
    user: payload.user || payload.userId,
    title: payload.title,
    category: payload.category,
    amount: payload.amount,
    frequency: payload.frequency,
    nextPaymentDate: payload.nextPaymentDate,
    autopay: payload.autopay,
    reminderDaysBefore: payload.reminderDaysBefore,
    notes: payload.notes,
    showOnHome: payload.showOnHome,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  store.recurringPayments.push(recurringPayment);
  writeStore(store);
  return recurringPayment;
};

export const updateRecurringPayment = async (userId, paymentId, updates = {}) => {
  const store = readStore();
  const index = store.recurringPayments.findIndex((payment) => normalizeId(payment) === paymentId && byUser(userId)(payment));
  if (index === -1) return null;
  store.recurringPayments[index] = normalizeRecurringPayment({ ...store.recurringPayments[index], ...omitUndefined(updates), updatedAt: nowIso() });
  writeStore(store);
  return store.recurringPayments[index];
};

export const deleteRecurringPayment = async (userId, paymentId) => {
  const store = readStore();
  const before = store.recurringPayments.length;
  store.recurringPayments = store.recurringPayments.filter((payment) => !(normalizeId(payment) === paymentId && byUser(userId)(payment)));
  writeStore(store);
  return store.recurringPayments.length !== before;
};

export const getSettings = async (userId) => {
  const store = readStore();
  let setting = store.settings.find(byUser(userId));
  if (!setting) {
    setting = defaultSettings(userId);
    store.settings.push(setting);
    writeStore(store);
  }
  return normalizeSetting(setting);
};

export const upsertSettings = async (userId, updates = {}) => {
  const store = readStore();
  const index = store.settings.findIndex(byUser(userId));
  const next = normalizeSetting({
    ...(index === -1 ? defaultSettings(userId) : store.settings[index]),
    ...omitUndefined(updates),
    user: userId,
    updatedAt: nowIso()
  });
  if (index === -1) store.settings.push(next);
  else store.settings[index] = next;
  writeStore(store);
  return next;
};

export const createDiary = async (payload) => {
  const store = readStore();
  const timestamp = nowIso();
  const diary = {
    _id: randomUUID(),
    user: payload.user || payload.userId,
    name: payload.name,
    members: payload.members || [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
  store.diaries.push(diary);
  writeStore(store);
  return normalizeDiary(diary, store.expenses);
};

export const listDiaries = async (userId, filters = {}) => {
  const store = readStore();
  const limit = filters.limit ? Math.min(Number(filters.limit) || 0, 500) : undefined;
  const page = Number(filters.page) || 1;
  let items = store.diaries.filter(byUser(userId)).map((diary) => normalizeDiary(diary, store.expenses));
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = items.length;
  if (limit) items = items.slice((page - 1) * limit, page * limit);
  return {
    items,
    pagination: limit ? { page, limit, total, totalPages: Math.ceil(total / limit) } : null
  };
};

export const getDiaryById = async (userId, diaryId) => {
  const store = readStore();
  return normalizeDiary(store.diaries.find((diary) => normalizeId(diary) === diaryId && byUser(userId)(diary)), store.expenses);
};

export const updateDiary = async (userId, diaryId, updates = {}) => {
  const store = readStore();
  const index = store.diaries.findIndex((diary) => normalizeId(diary) === diaryId && byUser(userId)(diary));
  if (index === -1) return null;
  store.diaries[index] = { ...store.diaries[index], ...omitUndefined(updates), updatedAt: nowIso() };
  writeStore(store);
  return normalizeDiary(store.diaries[index], store.expenses);
};

export const deleteDiary = async (userId, diaryId) => {
  const store = readStore();
  const before = store.diaries.length;
  store.diaries = store.diaries.filter((diary) => !(normalizeId(diary) === diaryId && byUser(userId)(diary)));
  store.expenses = store.expenses.map((expense) => (expense.diaryId === diaryId ? { ...expense, diaryId: null } : expense));
  writeStore(store);
  return store.diaries.length !== before;
};
