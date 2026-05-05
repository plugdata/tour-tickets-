require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Fixing BusRound and DraftBusRound null returnDate using raw SQL...')
  
  // Set returnDate to departDate where it's null
  const busRoundFix = await prisma.$executeRaw`UPDATE "BusRound" SET "returnDate" = "departDate" WHERE "returnDate" IS NULL`
  console.log(`Updated ${busRoundFix} BusRound records.`)

  const draftFix = await prisma.$executeRaw`UPDATE "DraftBusRound" SET "returnDate" = "departDate" WHERE "returnDate" IS NULL`
  console.log(`Updated ${draftFix} DraftBusRound records.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
