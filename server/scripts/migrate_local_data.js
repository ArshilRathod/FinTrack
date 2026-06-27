import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { prisma } from '../src/lib/prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath, override: true });

const storePath = path.resolve(__dirname, '../data/store.json');

async function migrate() {
  console.log('Starting migration from local JSON file to PostgreSQL...');

  if (!fs.existsSync(storePath)) {
    console.error(`Local store file not found at ${storePath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(storePath, 'utf8');
  const data = JSON.parse(rawData);

  console.log('Loaded local store file successfully.');
  console.log(`- Users: ${data.users?.length || 0}`);
  console.log(`- Expenses: ${data.expenses?.length || 0}`);
  console.log(`- Loans: ${data.loans?.length || 0}`);
  console.log(`- Settings: ${data.settings?.length || 0}`);
  console.log(`- Recurring Payments: ${data.recurringPayments?.length || 0}`);
  console.log(`- Diaries: ${data.diaries?.length || 0}`);

  // 1. Migrate Users
  console.log('\nMigrating Users...');
  const userMap = new Map(); // Keep track of migrated user IDs
  if (data.users && Array.isArray(data.users)) {
    for (const u of data.users) {
      const existing = await prisma.user.findUnique({
        where: { email: u.email.trim().toLowerCase() }
      });

      if (existing) {
        console.log(`User already exists: ${u.email} (ID: ${existing.id})`);
        userMap.set(u.id, existing.id);
        continue;
      }

      const created = await prisma.user.create({
        data: {
          id: u.id,
          name: u.name,
          email: u.email.trim().toLowerCase(),
          password: u.password || null,
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          phone: u.phone || '',
          bio: u.bio || '',
          gender: u.gender || 'Prefer not to say',
          dob: u.dob || '',
          city: u.city || '',
          state: u.state || '',
          country: u.country || '',
          photoUrl: u.photoUrl || '',
          monthlyIncome: Number(u.monthlyIncome ?? 85000),
          savingsGoal: Number(u.savingsGoal ?? 20000),
          riskPreference: u.riskPreference || 'Balanced',
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
          updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date()
        }
      });
      console.log(`Migrated user: ${created.email} (ID: ${created.id})`);
      userMap.set(u.id, created.id);
    }
  }

  // 2. Migrate Settings
  console.log('\nMigrating Settings...');
  if (data.settings && Array.isArray(data.settings)) {
    for (const s of data.settings) {
      const localUserId = s.user;
      const dbUserId = userMap.get(localUserId) || localUserId;

      // Check if user exists in the DB (foreign key safety)
      const userExists = await prisma.user.findUnique({ where: { id: dbUserId } });
      if (!userExists) {
        console.warn(`Skipping setting: referenced user ${dbUserId} not found in DB.`);
        continue;
      }

      const existingSetting = await prisma.setting.findUnique({
        where: { userId: dbUserId }
      });

      const settingId = s._id || s.id;

      if (existingSetting) {
        console.log(`Settings already exist for user ID: ${dbUserId}, skipping.`);
        continue;
      }

      await prisma.setting.create({
        data: {
          id: settingId,
          userId: dbUserId,
          darkMode: Boolean(s.darkMode ?? false),
          currency: s.currency || 'INR',
          region: s.region || 'India',
          notifications: Boolean(s.notifications ?? true),
          budgetAlerts: Boolean(s.budgetAlerts ?? true),
          billPaymentReminders: Boolean(s.billPaymentReminders ?? true),
          largeTransactionAlerts: Boolean(s.largeTransactionAlerts ?? true),
          weeklySpendingSummary: Boolean(s.weeklySpendingSummary ?? true),
          monthlyFinancialReport: Boolean(s.monthlyFinancialReport ?? true),
          automaticCategorizationRules: Boolean(s.automaticCategorizationRules ?? true),
          recurringTransactionSetup: Boolean(s.recurringTransactionSetup ?? true),
          autoBudgetAllocation: Boolean(s.autoBudgetAllocation ?? false),
          exportFormat: s.exportFormat || 'CSV',
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date()
        }
      });
      console.log(`Migrated settings for user ID: ${dbUserId}`);
    }
  }

  // 3. Migrate Diaries
  console.log('\nMigrating Diaries...');
  const diaryMap = new Map();
  if (data.diaries && Array.isArray(data.diaries)) {
    for (const d of data.diaries) {
      const localUserId = d.user;
      const dbUserId = userMap.get(localUserId) || localUserId;

      const userExists = await prisma.user.findUnique({ where: { id: dbUserId } });
      if (!userExists) {
        console.warn(`Skipping diary: referenced user ${dbUserId} not found in DB.`);
        continue;
      }

      const diaryId = d._id || d.id;
      const existingDiary = await prisma.financeDiary.findFirst({
        where: { id: diaryId }
      });

      if (existingDiary) {
        console.log(`Diary already exists: ${d.name} (ID: ${existingDiary.id})`);
        diaryMap.set(diaryId, existingDiary.id);
        continue;
      }

      const createdDiary = await prisma.financeDiary.create({
        data: {
          id: diaryId,
          userId: dbUserId,
          name: d.name,
          members: d.members || [],
          createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
          updatedAt: d.updatedAt ? new Date(d.updatedAt) : new Date()
        }
      });
      console.log(`Migrated diary: ${createdDiary.name} (ID: ${createdDiary.id})`);
      diaryMap.set(diaryId, createdDiary.id);
    }
  }

  // 4. Migrate Expenses
  console.log('\nMigrating Expenses...');
  if (data.expenses && Array.isArray(data.expenses)) {
    for (const e of data.expenses) {
      const localUserId = e.user;
      const dbUserId = userMap.get(localUserId) || localUserId;

      const userExists = await prisma.user.findUnique({ where: { id: dbUserId } });
      if (!userExists) {
        console.warn(`Skipping expense: referenced user ${dbUserId} not found in DB.`);
        continue;
      }

      const expenseId = e._id || e.id;
      const existingExpense = await prisma.expense.findFirst({
        where: { id: expenseId }
      });

      if (existingExpense) {
        console.log(`Expense already exists: ${e.notes} (ID: ${existingExpense.id})`);
        continue;
      }

      // Check diaryId foreign key
      let dbDiaryId = null;
      if (e.diaryId) {
        dbDiaryId = diaryMap.get(e.diaryId) || e.diaryId;
        const diaryExists = await prisma.financeDiary.findUnique({ where: { id: dbDiaryId } });
        if (!diaryExists) {
          console.warn(`Expense ${expenseId} references diary ${dbDiaryId} which does not exist. Setting diaryId to null.`);
          dbDiaryId = null;
        }
      }

      await prisma.expense.create({
        data: {
          id: expenseId,
          userId: dbUserId,
          diaryId: dbDiaryId,
          amount: Number(e.amount),
          category: e.category,
          date: e.date ? new Date(e.date) : new Date(),
          paymentMethod: e.paymentMethod,
          notes: e.notes || '',
          optionalNote: e.optionalNote || '',
          involvedMembers: e.involvedMembers || null,
          memberPayments: e.memberPayments || null,
          isPaid: Boolean(e.isPaid ?? false),
          createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
          updatedAt: e.updatedAt ? new Date(e.updatedAt) : new Date()
        }
      });
      console.log(`Migrated expense: ${e.notes || e.category} (${e.amount})`);
    }
  }

  // 5. Migrate Loans
  console.log('\nMigrating Loans...');
  if (data.loans && Array.isArray(data.loans)) {
    for (const l of data.loans) {
      const localUserId = l.user;
      const dbUserId = userMap.get(localUserId) || localUserId;

      const userExists = await prisma.user.findUnique({ where: { id: dbUserId } });
      if (!userExists) {
        console.warn(`Skipping loan: referenced user ${dbUserId} not found in DB.`);
        continue;
      }

      const loanId = l._id || l.id;
      const existingLoan = await prisma.loan.findFirst({
        where: { id: loanId }
      });

      if (existingLoan) {
        console.log(`Loan already exists: ${l.loanName} (ID: ${existingLoan.id})`);
        continue;
      }

      await prisma.loan.create({
        data: {
          id: loanId,
          userId: dbUserId,
          type: l.type || 'loan',
          loanName: l.loanName,
          loanAmount: Number(l.loanAmount),
          interestRate: Number(l.interestRate || 0),
          tenure: Number(l.tenure || 0),
          emiAmount: Number(l.emiAmount || 0),
          nextEmiDate: l.nextEmiDate ? new Date(l.nextEmiDate) : new Date(),
          startDate: l.startDate ? new Date(l.startDate) : null,
          amountPaid: Number(l.amountPaid || 0),
          currentValue: l.currentValue !== undefined && l.currentValue !== '' ? Number(l.currentValue) : null,
          status: l.status || 'Active',
          createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
          updatedAt: l.updatedAt ? new Date(l.updatedAt) : new Date()
        }
      });
      console.log(`Migrated loan: ${l.loanName}`);
    }
  }

  // 6. Migrate Recurring Payments
  console.log('\nMigrating Recurring Payments...');
  if (data.recurringPayments && Array.isArray(data.recurringPayments)) {
    for (const rp of data.recurringPayments) {
      const localUserId = rp.user;
      const dbUserId = userMap.get(localUserId) || localUserId;

      const userExists = await prisma.user.findUnique({ where: { id: dbUserId } });
      if (!userExists) {
        console.warn(`Skipping recurring payment: referenced user ${dbUserId} not found in DB.`);
        continue;
      }

      const rpId = rp._id || rp.id;
      const existingRp = await prisma.recurringPayment.findFirst({
        where: { id: rpId }
      });

      if (existingRp) {
        console.log(`Recurring payment already exists: ${rp.title} (ID: ${existingRp.id})`);
        continue;
      }

      await prisma.recurringPayment.create({
        data: {
          id: rpId,
          userId: dbUserId,
          title: rp.title,
          category: rp.category || 'Other',
          amount: Number(rp.amount),
          frequency: rp.frequency || 'Monthly',
          nextPaymentDate: rp.nextPaymentDate ? new Date(rp.nextPaymentDate) : new Date(),
          autopay: Boolean(rp.autopay ?? false),
          reminderDaysBefore: Number(rp.reminderDaysBefore || 3),
          notes: rp.notes || '',
          showOnHome: Boolean(rp.showOnHome ?? false),
          createdAt: rp.createdAt ? new Date(rp.createdAt) : new Date(),
          updatedAt: rp.updatedAt ? new Date(rp.updatedAt) : new Date()
        }
      });
      console.log(`Migrated recurring payment: ${rp.title}`);
    }
  }

  console.log('\nMigration complete!');
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
