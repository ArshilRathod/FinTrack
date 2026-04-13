import { prisma } from './src/lib/prisma.js';

async function fixInvolvedMembers() {
  console.log('Starting migration to alter column type to jsonb and fix data...');

  try {
    // 1. Drop existing default if it exists
    console.log("Dropping column default...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Expense" ALTER COLUMN "involvedMembers" DROP DEFAULT
    `);

    // 2. Alter the column type using PostgreSQL's to_jsonb function to convert the array
    console.log("Altering column type to jsonb...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Expense" 
      ALTER COLUMN "involvedMembers" TYPE jsonb 
      USING to_jsonb("involvedMembers")
    `);
    
    console.log("Column successfully altered to jsonb.");

    // 3. Set a new default (optional, Prisma usually handles defaults in the app layer or via DB defaults)
    // The Prisma schema doesn't specify a default for involvedMembers in Expense, but if it did, we'd set it here.
    // Let's set it to '[]' if we want it to be an empty array by default.
    // However, looking at schema.prisma, it's Json? (optional), so maybe no default is better.

    // 4. Verify the conversion for the problematic record
    const problematicId = '43d99103-46f1-4e30-b3c2-25acad5ef9e1';
    const verified = await prisma.$queryRawUnsafe(`SELECT id, "involvedMembers" FROM "Expense" WHERE id = $1::uuid`, problematicId);
    console.log("Verified Record:", JSON.stringify(verified, null, 2));

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixInvolvedMembers();
