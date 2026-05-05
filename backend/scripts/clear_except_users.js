require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🧹 Clearing all data except User table...')

  try {
    // Disable foreign key constraints temporarily (PostgreSQL specific)
    await prisma.$executeRaw`SET session_replication_role = replica;`

    // Delete in order of dependencies (child tables first)
    const deleteOrder = [
      'bookingAddon',
      'insuranceForm',
      'seatBooking',
      'payment',
      'booking',
      'galleryImage',
      'galleryAlbum',
      'upload',
      'insuranceCondition',
      'insurancePolicyContent',
      'bookingSession',
      'cancelLog',
      'expense',
      'content',
      'addon',
      'busRound',
      'draftBusRound',
      'trip',
      'bankAccount',
      'siteSetting'
    ]

    for (const table of deleteOrder) {
      try {
        const model = prisma[table]
        if (model && typeof model.deleteMany === 'function') {
          const result = await model.deleteMany()
          console.log(`  🗑️  Deleted ${result.count} records from ${table}`)
        }
      } catch (error) {
        console.log(`  ⚠️  Could not delete ${table}: ${error.message}`)
      }
    }

    // Reset auto-increment sequences (PostgreSQL specific)
    console.log('\n🔄 Resetting auto-increment sequences...')
    const sequences = [
        'Trip_id_seq', 
        'BusRound_id_seq', 
        'DraftBusRound_id_seq', 
        'Booking_id_seq', 
        'Payment_id_seq', 
        'Addon_id_seq', 
        'BookingAddon_id_seq', 
        'Content_id_seq', 
        'Expense_id_seq', 
        'InsuranceForm_id_seq', 
        'GalleryAlbum_id_seq', 
        'GalleryImage_id_seq', 
        'Upload_id_seq'
    ]

    for (const seq of sequences) {
      try {
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${seq}" RESTART WITH 1;`)
        console.log(`  📝 Reset ${seq}`)
      } catch (error) {
        // Sequence might not exist or name might be different
      }
    }

    // Re-enable foreign key constraints
    await prisma.$executeRaw`SET session_replication_role = DEFAULT;`

    console.log('\n✅ Data cleared. User table preserved!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
