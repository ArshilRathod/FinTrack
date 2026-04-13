import { prisma } from './src/lib/prisma.js';

async function main() {
  console.log(`Current Date: ${new Date().toISOString()}`);

  try {
    console.log("\n--- CHECKING COLUMN TYPE ---");
    const columnInfo = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'Expense' AND column_name = 'involvedMembers'
    `);
    console.log("Column Info:", JSON.stringify(columnInfo, null, 2));

    const rawExpenses = await prisma.$queryRawUnsafe(`SELECT id, "involvedMembers"::text FROM "Expense" LIMIT 5`);
    console.log("\n--- RAW EXPENSES SAMPLE ---");
    rawExpenses.forEach(e => {
      console.log(`ID: ${e.id}, Raw: ${e.involvedMembers}`);
    });

  } catch (error) {
    console.error("Error in debug script:", error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
