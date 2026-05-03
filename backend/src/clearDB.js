/**
 * Clear Database Script - GUGA Travels
 * ล้างข้อมูลทั้งหมดใน database
 * รัน: node src/clearDB.js
 */
const prisma = require('./config/prisma')

async function clearDatabase() {
  console.log('🧹 Starting complete database cleanup...')

  try {
    // Disable foreign key constraints temporarily (PostgreSQL specific)
    await prisma.$executeRaw`SET session_replication_role = replica;`

    // Delete in order of dependencies (child tables first)
    const deleteOrder = [
      'bookingAddons',
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
      'trip',
      'user',
      'bankAccount',
      'siteSetting'
    ]

    let totalDeleted = 0

    for (const table of deleteOrder) {
      try {
        const model = prisma[table]
        if (model && typeof model.deleteMany === 'function') {
          const result = await model.deleteMany()
          if (result.count > 0) {
            console.log(`  🗑️  Deleted ${result.count} records from ${table}`)
            totalDeleted += result.count
          } else {
            console.log(`  ✅ ${table} already empty`)
          }
        }
      } catch (error) {
        console.log(`  ⚠️  Could not delete ${table}: ${error.message}`)
      }
    }

    // Reset auto-increment sequences (PostgreSQL specific)
    console.log('\n🔄 Resetting auto-increment sequences...')
    const tables = ['users', 'trips', 'bus_rounds', 'bookings', 'payments', 'contents', 'gallery_albums', 'gallery_images']

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1;`)
        console.log(`  📝 Reset ${table}_id_seq`)
      } catch (error) {
        // Sequence might not exist, that's okay
        console.log(`  ⚠️  Could not reset ${table}_id_seq: ${error.message}`)
      }
    }

    // Re-enable foreign key constraints
    await prisma.$executeRaw`SET session_replication_role = DEFAULT;`

    console.log(`\n✅ Database cleared successfully!`)
    console.log(`📊 Total records deleted: ${totalDeleted}`)

  } catch (error) {
    console.error('❌ Error clearing database:', error)
    throw error
  }
}

async function run() {
  try {
    await clearDatabase()
    console.log('\n🎉 Database is now clean and ready for fresh seeding!')
  } catch (error) {
    console.error('\n💥 Database cleanup failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

run()
