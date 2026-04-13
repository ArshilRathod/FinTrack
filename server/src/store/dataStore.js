import { prisma } from '../lib/prisma.js';

const nowIso = () => new Date().toISOString();

const normalizeUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt
  };
};

const normalizeExpense = (expense) => {
  if (!expense) return null;

  return {
    _id: expense.id,
    user: expense.userId,
    diaryId: expense.diaryId,
    amount: expense.amount,
    category: expense.category,
    date: expense.date instanceof Date ? expense.date.toISOString() : expense.date,
    paymentMethod: expense.paymentMethod,
    involvedMembers: expense.involvedMembers,
    memberPayments: expense.memberPayments,
    notes: expense.notes || '',
    optionalNote: expense.optionalNote || '',
    createdAt: expense.createdAt instanceof Date ? expense.createdAt.toISOString() : expense.createdAt,
    updatedAt: expense.updatedAt instanceof Date ? expense.updatedAt.toISOString() : expense.updatedAt
  };
};

const normalizeLoan = (loan) => {
  if (!loan) return null;

  return {
    _id: loan.id,
    user: loan.userId,
    type: loan.type || 'loan',
    loanName: loan.loanName,
    loanAmount: loan.loanAmount,
    interestRate: loan.interestRate,
    tenure: loan.tenure,
    emiAmount: loan.emiAmount,
    nextEmiDate: loan.nextEmiDate instanceof Date ? loan.nextEmiDate.toISOString() : loan.nextEmiDate,
    startDate: loan.startDate instanceof Date ? loan.startDate.toISOString() : loan.startDate,
    amountPaid: loan.amountPaid,
    currentValue: loan.currentValue ?? null,
    status: loan.status || 'Active',
    createdAt: loan.createdAt instanceof Date ? loan.createdAt.toISOString() : loan.createdAt,
    updatedAt: loan.updatedAt instanceof Date ? loan.updatedAt.toISOString() : loan.updatedAt
  };
};

const normalizeSetting = (setting) => {
  if (!setting) return null;

  return {
    _id: setting.id,
    user: setting.userId,
    darkMode: setting.darkMode,
    currency: setting.currency,
    region: setting.region,
    notifications: setting.notifications,
    budgetAlerts: setting.budgetAlerts,
    billPaymentReminders: setting.billPaymentReminders,
    largeTransactionAlerts: setting.largeTransactionAlerts,
    weeklySpendingSummary: setting.weeklySpendingSummary,
    monthlyFinancialReport: setting.monthlyFinancialReport,
    automaticCategorizationRules: setting.automaticCategorizationRules,
    recurringTransactionSetup: setting.recurringTransactionSetup,
    autoBudgetAllocation: setting.autoBudgetAllocation,
    exportFormat: setting.exportFormat,
    createdAt: setting.createdAt instanceof Date ? setting.createdAt.toISOString() : setting.createdAt,
    updatedAt: setting.updatedAt instanceof Date ? setting.updatedAt.toISOString() : setting.updatedAt
  };
};

const normalizeRecurringPayment = (payment) => {
  if (!payment) return null;

  return {
    _id: payment.id,
    user: payment.userId,
    title: payment.title,
    category: payment.category,
    amount: payment.amount,
    frequency: payment.frequency,
    nextPaymentDate: payment.nextPaymentDate instanceof Date ? payment.nextPaymentDate.toISOString() : payment.nextPaymentDate,
    autopay: payment.autopay,
    reminderDaysBefore: payment.reminderDaysBefore,
    notes: payment.notes || '',
    showOnHome: payment.showOnHome,
    createdAt: payment.createdAt instanceof Date ? payment.createdAt.toISOString() : payment.createdAt,
    updatedAt: payment.updatedAt instanceof Date ? payment.updatedAt.toISOString() : payment.updatedAt
  };
};

const normalizeDiary = (diary) => {
  if (!diary) return null;

  return {
    _id: diary.id,
    user: diary.userId,
    name: diary.name,
    members: diary.members || [],
    expenses: diary.expenses ? diary.expenses.map(normalizeExpense) : [],
    createdAt: diary.createdAt instanceof Date ? diary.createdAt.toISOString() : diary.createdAt,
    updatedAt: diary.updatedAt instanceof Date ? diary.updatedAt.toISOString() : diary.updatedAt
  };
};

const omitUndefined = (payload) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

const editableSettingKeys = [
  'darkMode',
  'currency',
  'region',
  'notifications',
  'budgetAlerts',
  'billPaymentReminders',
  'largeTransactionAlerts',
  'weeklySpendingSummary',
  'monthlyFinancialReport',
  'automaticCategorizationRules',
  'recurringTransactionSetup',
  'autoBudgetAllocation',
  'exportFormat'
];


const sanitizeSettingUpdates = (updates = {}) =>
  omitUndefined(Object.fromEntries(editableSettingKeys.map((key) => [key, updates[key]])));

export const sanitizeUser = (user) => {
  if (!user) return null;
  const normalized = normalizeUser(user);
  const { password, ...safeUser } = normalized;
  return safeUser;
};

export const findUserByEmail = async (email) => normalizeUser(await prisma.user.findUnique({ where: { email: email.toLowerCase() } }));

export const findUserById = async (id) => normalizeUser(await prisma.user.findUnique({ where: { id } }));

export const createUser = async ({ name, email, password = null, photoUrl = '' }) => {
  const [firstName = '', ...lastNameParts] = name.trim().split(/\s+/);
  const lastName = lastNameParts.join(' ');

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      photoUrl
    }
  });

  return normalizeUser(user);
};

export const updateUser = async (userId, updates) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: omitUndefined(updates)
  });

  return normalizeUser(user);
};

export const createExpense = async ({ userId, user, amount, category, date, paymentMethod, notes = '', optionalNote = '', diaryId = null, involvedMembers = [], memberPayments }) => {
  const finalUserId = userId || user;
  const expense = await prisma.expense.create({
    data: {
      userId: finalUserId,
      amount: Number(amount),
      category,
      date: new Date(date || nowIso()),
      paymentMethod,
      notes,
      optionalNote,
      diaryId,
      involvedMembers,
      memberPayments
    }
  });
  return normalizeExpense(expense);
};

export const updateExpense = async (userId, id, { amount, category, date, paymentMethod, notes, optionalNote, diaryId, involvedMembers, memberPayments }) => {
  const expense = await prisma.expense.update({
    where: { id, userId },
    data: omitUndefined({
      amount: amount !== undefined ? Number(amount) : undefined,
      category,
      date: date ? new Date(date) : undefined,
      paymentMethod,
      notes,
      optionalNote,
      diaryId,
      involvedMembers,
      memberPayments
    })
  });
  return normalizeExpense(expense);
};

export const deleteExpense = async (userId, expenseId) => {
  const result = await prisma.expense.deleteMany({
    where: { id: expenseId, userId }
  });

  return result.count > 0;
};

export const listExpenses = async (userId, filters = {}) => {
  const limit = filters.limit ? Math.min(Number(filters.limit) || 0, 500) : undefined;
  const page = Number(filters.page) || 1;
  const skip = limit ? Math.max(0, (page - 1) * limit) : undefined;
  const includeDiary = filters.includeDiary === true || filters.includeDiary === 'true';

  const where = {
    userId,
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.from || filters.to
      ? {
        date: omitUndefined({
          gte: filters.from ? new Date(filters.from) : undefined,
          lte: filters.to ? new Date(filters.to) : undefined
        })
      }
      : {}),
    ...(filters.diaryId ? { diaryId: filters.diaryId } : {}),
    ...(filters.untracked ? { diaryId: null } : {}),
    ...(!includeDiary && !filters.diaryId
      ? {
        diaryId: null,
        paymentMethod: { not: 'Diary Entry' }
      }
      : {})
  };

  const expenses = await prisma.expense.findMany({
    where: {
      ...where
    },
    orderBy: {
      date: 'desc'
    },
    ...(limit ? { take: limit, skip } : {})
  });

  const totalCount = limit ? await prisma.expense.count({ where }) : expenses.length;

  return {
    items: expenses.map(normalizeExpense),
    pagination: limit
      ? {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
      : null
  };
};

export const countExpenses = async (userId) => prisma.expense.count({ where: { userId } });

export const createLoan = async (payload) => {
  const loan = await prisma.loan.create({
    data: {
      userId: payload.user || payload.userId,
      type: payload.type || 'loan',
      loanName: payload.loanName,
      loanAmount: Number(payload.loanAmount),
      interestRate: Number(payload.interestRate || 0),
      tenure: Number(payload.tenure || 0),
      emiAmount: Number(payload.emiAmount || 0),
      nextEmiDate: new Date(payload.nextEmiDate),
      startDate: payload.startDate ? new Date(payload.startDate) : null,
      amountPaid: Number(payload.amountPaid || 0),
      currentValue: payload.currentValue !== undefined && payload.currentValue !== '' ? Number(payload.currentValue) : null,
      status: payload.status || 'Active'
    }
  });

  return normalizeLoan(loan);
};

export const updateLoan = async (userId, loanId, updates) => {
  const existing = await prisma.loan.findFirst({
    where: { id: loanId, userId }
  });

  if (!existing) return null;

  const loan = await prisma.loan.update({
    where: { id: loanId },
    data: omitUndefined({
      type: updates.type,
      loanName: updates.loanName,
      loanAmount: updates.loanAmount !== undefined ? Number(updates.loanAmount) : undefined,
      interestRate: updates.interestRate !== undefined ? Number(updates.interestRate) : undefined,
      tenure: updates.tenure !== undefined ? Number(updates.tenure) : undefined,
      emiAmount: updates.emiAmount !== undefined ? Number(updates.emiAmount) : undefined,
      nextEmiDate: updates.nextEmiDate ? new Date(updates.nextEmiDate) : undefined,
      startDate: updates.startDate !== undefined ? (updates.startDate ? new Date(updates.startDate) : null) : undefined,
      amountPaid: updates.amountPaid !== undefined ? Number(updates.amountPaid) : undefined,
      currentValue: updates.currentValue !== undefined ? (updates.currentValue === '' || updates.currentValue === null ? null : Number(updates.currentValue)) : undefined,
      status: updates.status
    })
  });

  return normalizeLoan(loan);
};

export const listLoans = async (userId) => {
  const loans = await prisma.loan.findMany({
    where: { userId },
    orderBy: {
      nextEmiDate: 'asc'
    }
  });

  return loans.map(normalizeLoan);
};

export const countLoans = async (userId) => prisma.loan.count({ where: { userId } });

export const deleteLoan = async (userId, loanId) => {
  const result = await prisma.loan.deleteMany({
    where: { id: loanId, userId }
  });

  return result.count > 0;
};

export const listRecurringPayments = async (userId) => {
  const payments = await prisma.recurringPayment.findMany({
    where: { userId },
    orderBy: {
      nextPaymentDate: 'asc'
    }
  });

  return payments.map(normalizeRecurringPayment);
};

export const createRecurringPayment = async (payload) => {
  const recurringPayment = await prisma.recurringPayment.create({
    data: {
      userId: payload.user || payload.userId,
      title: payload.title,
      category: payload.category || 'Other',
      amount: Number(payload.amount),
      frequency: payload.frequency || 'Monthly',
      nextPaymentDate: new Date(payload.nextPaymentDate),
      autopay: Boolean(payload.autopay),
      reminderDaysBefore: Number(payload.reminderDaysBefore || 3),
      notes: payload.notes || '',
      showOnHome: Boolean(payload.showOnHome)
    }
  });

  return normalizeRecurringPayment(recurringPayment);
};

export const deleteRecurringPayment = async (userId, paymentId) => {
  const result = await prisma.recurringPayment.deleteMany({
    where: { id: paymentId, userId }
  });

  return result.count > 0;
};

export const updateRecurringPayment = async (userId, paymentId, updates) => {
  const existing = await prisma.recurringPayment.findFirst({
    where: { id: paymentId, userId }
  });

  if (!existing) return null;

  const recurringPayment = await prisma.recurringPayment.update({
    where: { id: paymentId },
    data: omitUndefined({
      title: updates.title,
      category: updates.category,
      amount: updates.amount !== undefined ? Number(updates.amount) : undefined,
      frequency: updates.frequency,
      nextPaymentDate: updates.nextPaymentDate ? new Date(updates.nextPaymentDate) : undefined,
      autopay: updates.autopay,
      reminderDaysBefore: updates.reminderDaysBefore !== undefined ? Number(updates.reminderDaysBefore) : undefined,
      notes: updates.notes,
      showOnHome: updates.showOnHome
    })
  });

  return normalizeRecurringPayment(recurringPayment);
};

export const getSettings = async (userId) => normalizeSetting(await prisma.setting.findUnique({ where: { userId } }));

export const upsertSettings = async (userId, updates) => {
  const sanitizedUpdates = sanitizeSettingUpdates(updates);

  const settings = await prisma.setting.upsert({
    where: { userId },
    update: sanitizedUpdates,
    create: {
      userId,
      ...sanitizedUpdates
    }
  });

  return normalizeSetting(settings);
};

export const createDiary = async (payload) => {
  const diary = await prisma.financeDiary.create({
    data: {
      userId: payload.user || payload.userId,
      name: payload.name,
      members: payload.members || []
    }
  });

  return normalizeDiary(diary);
};

export const listDiaries = async (userId, filters = {}) => {
  const limit = filters.limit ? Math.min(Number(filters.limit) || 0, 500) : undefined;
  const page = Number(filters.page) || 1;
  const skip = limit ? Math.max(0, (page - 1) * limit) : undefined;

  const where = { userId };

  const diaries = await prisma.financeDiary.findMany({
    where: { userId },
    include: {
      expenses: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    ...(limit ? { take: limit, skip } : {})
  });

  const totalCount = limit ? await prisma.financeDiary.count({ where }) : diaries.length;

  return {
    items: diaries.map(normalizeDiary),
    pagination: limit
      ? {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
      : null
  };
};

export const getDiaryById = async (userId, diaryId) => {
  const diary = await prisma.financeDiary.findFirst({
    where: { id: diaryId, userId },
    include: {
      expenses: true
    }
  });

  return normalizeDiary(diary);
};

export const updateDiary = async (userId, diaryId, updates) => {
  const diary = await prisma.financeDiary.update({
    where: { id: diaryId, userId },
    data: omitUndefined({
      name: updates.name,
      members: updates.members
    })
  });

  return normalizeDiary(diary);
};

export const deleteDiary = async (userId, diaryId) => {
  const result = await prisma.financeDiary.deleteMany({
    where: { id: diaryId, userId }
  });

  return result.count > 0;
};
