const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'BusRound' 
      ORDER BY column_name;
    `;
    console.log('BusRound columns:');
    result.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
