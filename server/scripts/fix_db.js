import { prisma } from '../src/lib/prisma.js';

async function main() {
  console.log('Starting manual database sync...');
  try {
    // Check if columns exist and add them if not
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Loan" 
      ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'loan',
      ADD COLUMN IF NOT EXISTS "currentValue" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'Active';
    `);
    console.log('Loan table updated successfully.');

    // Create FinanceDiary table if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FinanceDiary" (
        "id" UUID NOT NULL,
        "userId" UUID NOT NULL,
        "name" TEXT NOT NULL,
        "members" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "FinanceDiary_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('FinanceDiary table verified/created.');

    // Add forum and diary related columns to Expense
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Expense" 
      ADD COLUMN IF NOT EXISTS "diaryId" UUID,
      ADD COLUMN IF NOT EXISTS "optionalNote" TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS "involvedMembers" JSONB,
      ADD COLUMN IF NOT EXISTS "memberPayments" JSONB,
      ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN DEFAULT false;
    `);
    console.log('Expense table updated successfully.');

    // Add foreign key if not exists
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "FinanceDiary" 
        ADD CONSTRAINT "FinanceDiary_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log('Foreign key added to FinanceDiary.');
    } catch (e) {
      console.log('Foreign key might already exist, skipping...');
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Expense" 
        ADD CONSTRAINT "Expense_diaryId_fkey" 
        FOREIGN KEY ("diaryId") REFERENCES "FinanceDiary"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
      `);
      console.log('Foreign key added to Expense for diaryId.');
    } catch (e) {
      console.log('Diary foreign key might already exist, skipping...');
    }

  } catch (error) {
    console.error('Error during manual sync:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
