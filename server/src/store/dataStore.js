const requestedStoreMode = process.env.FINTRACK_DATA_STORE || process.env.DATA_STORE;
const storeMode = requestedStoreMode || 'prisma';

if (storeMode !== 'prisma') {
  throw new Error(`Unsupported data store mode "${storeMode}". FinTrack runtime data is stored in Prisma/Postgres.`);
}

const activeStore = await import('./prismaDataStore.js');

if (process.env.NODE_ENV !== 'test') {
  console.log('[Data Store] Prisma/Postgres');
}

export const sanitizeUser = activeStore.sanitizeUser;
export const findUserByEmail = activeStore.findUserByEmail;
export const findUserById = activeStore.findUserById;
export const createUser = activeStore.createUser;
export const updateUser = activeStore.updateUser;
export const createExpense = activeStore.createExpense;
export const updateExpense = activeStore.updateExpense;
export const deleteExpense = activeStore.deleteExpense;
export const listExpenses = activeStore.listExpenses;
export const countExpenses = activeStore.countExpenses;
export const createLoan = activeStore.createLoan;
export const updateLoan = activeStore.updateLoan;
export const listLoans = activeStore.listLoans;
export const countLoans = activeStore.countLoans;
export const deleteLoan = activeStore.deleteLoan;
export const listRecurringPayments = activeStore.listRecurringPayments;
export const createRecurringPayment = activeStore.createRecurringPayment;
export const deleteRecurringPayment = activeStore.deleteRecurringPayment;
export const updateRecurringPayment = activeStore.updateRecurringPayment;
export const getSettings = activeStore.getSettings;
export const upsertSettings = activeStore.upsertSettings;
export const createDiary = activeStore.createDiary;
export const listDiaries = activeStore.listDiaries;
export const getDiaryById = activeStore.getDiaryById;
export const updateDiary = activeStore.updateDiary;
export const deleteDiary = activeStore.deleteDiary;
