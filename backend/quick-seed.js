const prisma = require('./src/config/prisma')
const bcrypt = require('bcryptjs')

async function quickSeed() {
  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin1234', 10)
    const admin = await prisma.user.upsert({
      where: { username: 'admin001' },
      update: {},
      create: {
        username: 'admin001',
        password: hashedPassword,
        role: 'ADMIN',
        name: 'Administrator',
        phone: '089-123-4567',
        email: 'admin@guga.travel'
      }
    })
    console.log('✅ Admin user ready:', admin.username)

    // Create test trip
    const trip = await prisma.trip.upsert({
      where: { id: 1 },
      update: {},
      create: {
        title: 'เกาะสมุย 3 วัน 2 คืน',
        description: 'ทัวร์เกาะสมุยสนุกสนานกับครอบครัว',
        price: 3500,
        deposit: 1000,
        isActive: true,
        tripType: 'DOMESTIC',
        country: 'Thailand'
      }
    })
    console.log('✅ Trip ready:', trip.title)

    console.log('\n🎉 Database seeded successfully!')
    process.exit(0)
  } catch (e) {
    console.error('❌ Error:', e.message)
    process.exit(1)
  }
}

quickSeed()
