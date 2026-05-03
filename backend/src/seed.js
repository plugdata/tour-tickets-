/**
 * GUGA Travels — Mock Data Seed
 * รัน: node src/seed.js
 * รันเฉพาะ admin: node src/seed.js admin-only
 * ล้างข้อมูล + admin: node src/seed.js clean-admin
 */
const prisma = require('./config/prisma')
const bcrypt = require('bcryptjs')

async function clearAllData() {
  console.log('🧹 Clearing all data...')

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

    console.log(`✅ All data cleared! Total records: ${totalDeleted}`)

  } catch (error) {
    console.error('❌ Error clearing database:', error)
    throw error
  }
}

async function seedAdminOnly() {
  console.log('👤 Seeding admin user only...')

  const adminUser = {
    username: 'admin001',
    password: 'admin1234',
    role: 'ADMIN',
    name: 'Administrator',
    phone: '089-123-4567',
    email: 'admin@guga.travel'
  }

  const existing = await prisma.user.findFirst({ where: { username: adminUser.username } })
  if (!existing) {
    const hashedPassword = await bcrypt.hash(adminUser.password, 10)
    await prisma.user.create({
      data: {
        ...adminUser,
        password: hashedPassword
      }
    })
    console.log(`  ✅ Created admin user: ${adminUser.username}`)
  } else {
    console.log(`  ⏭️  Admin user already exists: ${adminUser.username}`)
  }

  console.log('✅ Admin user seeded')
}

async function seedUsers() {
  console.log('👥 Seeding users...')

  const users = [
    {
      username: 'admin001',
      password: 'admin1234',
      role: 'ADMIN',
      name: 'Administrator',
      phone: '089-123-4567',
      email: 'admin@guga.travel'
    },
    {
      username: 'staff001',
      password: 'staff1234',
      role: 'STUFF',
      name: 'Staff Member',
      phone: '089-123-4568',
      email: 'staff@guga.travel'
    },
    {
      username: 'customer001',
      password: 'customer1234',
      role: 'CUSTOMER',
      name: 'Customer Test',
      phone: '089-123-4569',
      email: 'customer@guga.travel'
    }
  ]

  for (const userData of users) {
    const existing = await prisma.user.findFirst({ where: { username: userData.username } })
    if (!existing) {
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword
        }
      })
      console.log(`  ✅ Created user: ${userData.username} (${userData.role})`)
    } else {
      console.log(`  ⏭️  User already exists: ${userData.username}`)
    }
  }
  console.log('✅ Users seeded')
}

async function main() {
  console.log('🌱 Seeding mock data...')

  // ── 0. Users ────────────────────────────────────────
  await seedUsers()

  // ── 1. Site Settings ────────────────────────────────────
  const settings = {
    site_name: 'GUGA Travels',
    site_tagline: 'GROW UP GO ANYWHERE',
    site_description: 'บริการจัดทริปท่องเที่ยว ทริปเดินป่า และทัวร์ต่างประเทศ ดูแลโดยทีมงานมืออาชีพ',
    site_logo_url: '',
    hero_title: 'โตละ...จะไปไหนก็ได้',
    hero_subtitle: 'Grow up, Go anywhere — เปิดโลกกว้าง สัมผัสธรรมชาติ เติมประสบการณ์ใหม่ กับทีมงานมืออาชีพ',
    hero_bg_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80',
    announcement_active: 'true',
    announcement_text: '🔥 โปรโมชันพิเศษ! จองทริปเกาะสมุยก่อน 30 เม.ย. ลด 500 บาท — ติดต่อ LINE @guga',
    seo_title: 'GUGA Travels — จองทริปท่องเที่ยว เดินป่า ทัวร์ต่างประเทศ',
    seo_description: 'จองทริปท่องเที่ยวกับ GUGA Travels ทริปในประเทศและต่างประเทศ ดูแลโดยทีมงานมืออาชีพ',
    seo_keywords: 'ทริป,ท่องเที่ยว,เดินป่า,ทัวร์,เกาะสมุย,เชียงใหม่,ลาว,เวียดนาม,booking',
    social_facebook: 'https://facebook.com/gugatravels',
    social_line_oa: '@guga',
    social_instagram: 'https://instagram.com/gugatravels',
    social_tiktok: 'https://tiktok.com/@gugatravels',
    contact_phone: '089-123-4567',
    contact_email: 'contact@guga.travel',
    contact_address: '99/1 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110',
    contact_hours: 'จ-ศ 09:00-18:00 | ส-อา 10:00-16:00',
    contact_map_embed: '',
    cookie_policy_text: 'เว็บไซต์นี้ใช้คุกกี้เพื่อนำเสนอประสบการณ์ที่ดีที่สุดให้กับคุณ การใช้งานเว็บไซต์นี้ถือว่าคุณยอมรับนโยบายความเป็นส่วนตัวของเรา',
    email_notify_to: 'admin@guga.travel',
  }
  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({
      where: { key }, update: { value }, create: { key, value }
    })
  }
  console.log('✅ Site settings seeded')

  // ── 2. Trips ─────────────────────────────────────────────
  const trips = [
    // DOMESTIC
    {
      title: 'ทริปเกาะสมุย 3 วัน 2 คืน',
      description: 'พักผ่อนริมทะเล ทะเลใสสีเทอร์ควอยซ์ หาดแม่น้ำ หาดเฉวง เที่ยวได้ทั้งปี',
      imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop',
      price: 4890, deposit: 1500, tripType: 'DOMESTIC', country: 'สุราษฎร์ธานี, ไทย',
      isHot: true, hotOrder: 1, isActive: true,
    },
    {
      title: 'ดอยอินทนนท์ ยอดดอยสูงสุด เชียงใหม่',
      description: 'สัมผัสอากาศหนาว ชมพระอาทิตย์ขึ้น น้ำตกวชิรธาร กิจกรรม trail running',
      imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&h=400&fit=crop',
      price: 3290, deposit: 1000, tripType: 'DOMESTIC', country: 'เชียงใหม่, ไทย',
      isHot: true, hotOrder: 2, isActive: true,
    },
    {
      title: 'ปูยหลวง แม่ฮ่องสอน ทะเลหมอก',
      description: 'ยอดดอยปูยหลวง ทะเลหมอกยามเช้า วิวสวยที่สุดในแม่ฮ่องสอน เหมาะสำหรับคนรักธรรมชาติ',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
      price: 3790, deposit: 1200, tripType: 'DOMESTIC', country: 'แม่ฮ่องสอน, ไทย',
      isHot: false, hotOrder: 99, isActive: true,
    },
    {
      title: 'อุ้มผาง ล่องแก่ง วังเจ้า',
      description: 'ล่องแพยางผ่านน้ำตกทีลอซู น้ำตกที่ใหญ่ที่สุดในไทย ผจญภัยสุดขอบฟ้า',
      imageUrl: 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=600&h=400&fit=crop',
      price: 4590, deposit: 1500, tripType: 'DOMESTIC', country: 'ตาก, ไทย',
      isHot: false, hotOrder: 99, isActive: true,
    },
    {
      title: 'เขาใหญ่ เดินป่า Wildlife',
      description: 'ดูสัตว์ป่าในมรดกโลกเขาใหญ่ ช้าง กวาง นกนานาชนิด เดินป่าไม่ยากเหมาะทุกวัย',
      imageUrl: 'https://images.unsplash.com/photo-1555073980-682d69c05249?w=600&h=400&fit=crop',
      price: 2990, deposit: 1000, tripType: 'DOMESTIC', country: 'นครราชสีมา, ไทย',
      isHot: false, hotOrder: 99, isActive: true,
    },
    {
      title: 'ทะเลเกาะกูด ตราด',
      description: 'เกาะกูดทะเลใส ดำน้ำชมปะการัง นั่งเรือ snorkeling ธรรมชาติบริสุทธิ์',
      imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&h=400&fit=crop',
      price: 3500, deposit: 1000, tripType: 'DOMESTIC', country: 'ตราด, ไทย',
      isHot: false, hotOrder: 99, isActive: true,
    },
    // INTERNATIONAL
    {
      title: 'ลาว หลวงพระบาง มรดกโลก',
      description: 'เมืองมรดกโลก ตักบาตรพระ น้ำตกตาดกวางสี ล่องเรือแม่น้ำโขง วัฒนธรรมลาว 4 วัน 3 คืน',
      imageUrl: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&h=400&fit=crop',
      price: 8900, deposit: 2500, tripType: 'INTERNATIONAL', country: 'ลาว',
      isHot: true, hotOrder: 3, isActive: true,
    },
    {
      title: 'เวียดนาม ฮาลองเบย์ ฮานอย',
      description: 'ล่องเรือมรดกโลกฮาลองเบย์ ชมเมืองเก่าฮานอย กาแฟเวียดนาม บ๋านห์มี 5 วัน 4 คืน',
      imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&h=400&fit=crop',
      price: 11900, deposit: 3000, tripType: 'INTERNATIONAL', country: 'เวียดนาม',
      isHot: true, hotOrder: 4, isActive: true,
    },
    {
      title: 'อินโดนีเซีย Rinjani Volcano Trek',
      description: 'ปีนภูเขาไฟรินจานี เกาะลอมบอก ชมทะเลสาบในปล่องภูเขาไฟ ความท้าทายระดับโลก',
      imageUrl: 'https://images.unsplash.com/photo-1555073980-682d69c05249?w=600&h=400&fit=crop',
      price: 12500, deposit: 4000, tripType: 'INTERNATIONAL', country: 'อินโดนีเซีย',
      isHot: false, hotOrder: 99, isActive: true,
    },
    {
      title: 'ฟิลิปปินส์ CEBU Island Hopping',
      description: 'ดำน้ำ whale shark ทะเลใสเกาะ Malapascua ทริปทะเลสวรรค์ 4 วัน 3 คืน',
      imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&h=400&fit=crop',
      price: 9900, deposit: 3000, tripType: 'INTERNATIONAL', country: 'ฟิลิปปินส์',
      isHot: false, hotOrder: 99, isActive: true,
    },
  ]

  const createdTrips = []
  for (const t of trips) {
    const existing = await prisma.trip.findFirst({ where: { title: t.title } })
    if (existing) {
      const updated = await prisma.trip.update({ where: { id: existing.id }, data: t })
      createdTrips.push(updated)
    } else {
      const created = await prisma.trip.create({ data: t })
      createdTrips.push(created)
    }
  }
  console.log(`✅ ${createdTrips.length} trips seeded`)

  // ── 3. FAQ ───────────────────────────────────────────────
  const faqs = [
    {
      title: 'ไม่เคยมีประสบการณ์เดินป่ามาก่อน สามารถร่วมทริปได้ไหม?',
      body: 'ได้เลยครับ! ทริปของเรามี guide มืออาชีพคอยดูแลและให้คำแนะนำตลอดการเดินทาง เหมาะสำหรับทั้งมือใหม่และผู้มีประสบการณ์ แต่ควรออกกำลังกายเตรียมพร้อมก่อนออกเดินทาง',
    },
    {
      title: 'สามารถจองทริปได้อย่างไร?',
      body: 'สามารถจองได้ผ่านเว็บไซต์โดยตรง หรือติดต่อทาง LINE Official Account @guga โทร 089-123-4567 ทีมงานพร้อมให้คำปรึกษาทุกวัน 09:00-18:00 น.',
    },
    {
      title: 'มีช่องทางการชำระเงินอะไรบ้าง?',
      body: 'รับชำระผ่านการโอนเงินธนาคาร, พร้อมเพย์, บัตรเครดิต/เดบิต ทุกธนาคาร และชำระเงินสดที่สำนักงาน',
    },
    {
      title: 'สามารถยกเลิกการจองได้ไหม? มีเงื่อนไขอย่างไร?',
      body: 'ยกเลิกได้ก่อน 14 วัน คืนเงินเต็มจำนวน | ยกเลิก 7-13 วัน คืน 50% | ยกเลิกน้อยกว่า 7 วัน ไม่คืนเงิน สามารถเปลี่ยนชื่อผู้เดินทางได้',
    },
    {
      title: 'ต้องเตรียมอะไรบ้างสำหรับทริปเดินป่า?',
      body: 'รองเท้าเดินป่า (สำคัญมาก), เสื้อกันหนาว, กางเกงขายาว, หมวก, ครีมกันแดด, ยากันยุง, ยาประจำตัว, น้ำดื่ม และกล้องถ่ายรูป รายละเอียดเพิ่มเติมทีมงานจะส่งเอกสาร checklist ให้หลังจองเรียบร้อย',
    },
    {
      title: 'มีประกันอุบัติเหตุให้ไหม?',
      body: 'มีประกันอุบัติเหตุให้ทุกท่าน ความคุ้มครอง 1,000,000 บาท ตลอดการเดินทาง ท่านสามารถระบุผู้รับผลประโยชน์ได้เมื่อกรอกแบบฟอร์มข้อมูลการเดินทาง',
    },
  ]
  for (const f of faqs) {
    const existing = await prisma.content.findFirst({ where: { type: 'FAQ', title: f.title } })
    if (!existing) {
      await prisma.content.create({ data: { ...f, type: 'FAQ', isActive: true } })
    }
  }
  console.log(`✅ FAQ seeded`)

  // ── 4. Announcements ─────────────────────────────────────
  const announcements = [
    {
      title: '🔥 โปรโมชันพิเศษ เดือนพฤษภาคม 2569!',
      body: 'จองทริปเกาะสมุย หรือทริปเชียงใหม่ ในเดือนพฤษภาคม รับส่วนลดพิเศษ 500 บาท ต่อคน เมื่อจองผ่านเว็บไซต์ก่อน 30 เม.ย. 2569',
      imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=400&fit=crop',
      isFeatured: true, isHot: true,
    },
    {
      title: '📣 เปิดรับสมัครทริปใหม่ ลาว หลวงพระบาง มิถุนายน 2569',
      body: 'เปิดรับสมัครทริปลาว หลวงพระบาง 4 วัน 3 คืน วันที่ 10-13 มิ.ย. 2569 รับเพียง 12 ท่านเท่านั้น จองด่วน!',
      imageUrl: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&h=400&fit=crop',
      isFeatured: false, isHot: true,
    },
    {
      title: 'ประกาศ: อัปเดตนโยบายการยกเลิกการจอง',
      body: 'เริ่มตั้งแต่วันที่ 1 พ.ค. 2569 เป็นต้นไป นโยบายการยกเลิกการจองมีการปรับปรุงใหม่ กรุณาอ่านรายละเอียดในหน้านโยบาย',
      imageUrl: '',
      isFeatured: false, isHot: false,
    },
  ]
  for (const a of announcements) {
    const existing = await prisma.content.findFirst({ where: { type: 'ANNOUNCEMENT', title: a.title } })
    if (!existing) {
      await prisma.content.create({ data: { ...a, type: 'ANNOUNCEMENT', isActive: true } })
    }
  }
  console.log(`✅ Announcements seeded`)

  // ── 5. Blog Posts ────────────────────────────────────────
  const blogs = [
    {
      title: 'รีวิว: ทริปเกาะสมุย 3 วัน 2 คืน กับ GUGA Travels',
      body: 'หลังจากที่รอคอยมานาน ในที่สุดก็ได้มาสัมผัสทะเลเกาะสมุยจริงๆ สักที...\n\nทริปนี้เดินทางไปกับ GUGA Travels ทีมงานดูแลดีมาก ตั้งแต่รับส่งสนามบิน ที่พัก อาหาร ครบครัน...',
      imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=500&fit=crop',
      authorName: 'นุ้ย ✈️',
      tags: 'รีวิว, เกาะสมุย, ทะเล',
      isFeatured: true, isHot: false,
    },
    {
      title: '5 เหตุผลที่ทำให้คุณต้องไปดอยอินทนนท์สักครั้งในชีวิต',
      body: 'ดอยอินทนนท์ ยอดดอยที่สูงที่สุดในประเทศไทย 2,565 เมตร เหนือระดับน้ำทะเล...\n\n1. ชมพระอาทิตย์ขึ้นกลางทะเลเมฆ\n2. เดิน Trail ผ่านป่าดิบเขา\n3. น้ำตกวชิรธาร น้ำตกที่สวยที่สุดในเชียงใหม่...',
      imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&h=500&fit=crop',
      authorName: 'ทีม GUGA',
      tags: 'บทความ, เชียงใหม่, เดินป่า',
      isFeatured: true, isHot: false,
    },
    {
      title: 'ลาว หลวงพระบาง: เมืองที่เวลาหยุดนิ่ง',
      body: 'หลวงพระบาง เมืองมรดกโลกที่ยังคงบรรยากาศเก่าๆ ไว้ได้อย่างสมบูรณ์แบบ...\n\nตี 5 ครึ่ง เสียงระฆังดังขึ้น พระสงฆ์หลายร้อยรูปออกบิณฑบาตในแสงเช้า ภาพที่ไม่มีที่ไหนในโลก...',
      imageUrl: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&h=500&fit=crop',
      authorName: 'บิ๊ก 🌏',
      tags: 'ต่างประเทศ, ลาว, วัฒนธรรม',
      isFeatured: false, isHot: true,
    },
    {
      title: 'เตรียมตัวก่อนเดินป่า: Checklist ฉบับสมบูรณ์',
      body: 'การเดินป่าครั้งแรกอาจดูน่ากลัว แต่ถ้าเตรียมตัวดีก็ไม่มีอะไรน่ากลัว...\n\n✅ รองเท้าเดินป่า Ankle Support\n✅ เสื้อระบายความร้อน (อย่าใส่ผ้าฝ้าย)\n✅ กางเกงขายาว กันแมลง...',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop',
      authorName: 'ทีม GUGA',
      tags: 'เทิป, เดินป่า, เตรียมตัว',
      isFeatured: false, isHot: false,
    },
  ]
  for (const b of blogs) {
    const existing = await prisma.content.findFirst({ where: { type: 'BLOG', title: b.title } })
    if (!existing) {
      await prisma.content.create({ data: { ...b, type: 'BLOG', isActive: true } })
    }
  }
  console.log(`✅ Blog posts seeded`)

  // ── 6. Trip Posts (hot content linked to trips) ──────────
  const domesticTrip = createdTrips.find(t => t.tripType === 'DOMESTIC' && t.isHot)
  const intlTrip = createdTrips.find(t => t.tripType === 'INTERNATIONAL' && t.isHot)

  const tripPosts = [
    {
      title: 'ประสบการณ์: ทะเลเกาะสมุยสีฟ้าใส ที่ไม่ควรพลาด',
      body: 'ครั้งแรกในชีวิตที่ได้เห็นน้ำทะเลใสแบบนี้ ความประทับใจที่ไม่มีวันลืม...',
      imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop',
      tripId: domesticTrip?.id || null,
      isHot: true, isFeatured: true,
    },
    {
      title: 'Highlight: ลาว หลวงพระบาง ทริปที่ต้องไปสักครั้ง',
      body: 'ถ้าจะบอกว่าทริปไหนเปลี่ยนมุมมองชีวิต ต้องเป็นหลวงพระบาง...',
      imageUrl: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&h=400&fit=crop',
      tripId: intlTrip?.id || null,
      isHot: true, isFeatured: false,
    },
    {
      title: 'สัมผัสหมอกยามเช้า ดอยอินทนนท์',
      body: 'อุณหภูมิ 8 องศา ตีห้าครึ่ง นั่งรอพระอาทิตย์ขึ้นกลางทะเลเมฆ...',
      imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&h=400&fit=crop',
      tripId: createdTrips.find(t => t.title.includes('อินทนนท์'))?.id || null,
      isHot: true, isFeatured: false,
    },
    {
      title: 'เวียดนาม ฮาลองเบย์: มรดกโลกที่ทุกคนต้องไป',
      body: 'ล่องเรือผ่านเกาะหินปูนนับพันเกาะ น้ำทะเลสีมรกต ท้องฟ้าใส...',
      imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&h=400&fit=crop',
      tripId: createdTrips.find(t => t.country === 'เวียดนาม')?.id || null,
      isHot: true, isFeatured: true,
    },
  ]
  for (const tp of tripPosts) {
    const existing = await prisma.content.findFirst({ where: { type: 'TRIP_POST', title: tp.title } })
    if (!existing) {
      await prisma.content.create({ data: { ...tp, type: 'TRIP_POST', isActive: true } })
    }
  }
  console.log(`✅ Trip posts seeded`)

  // ── 7. Gallery Albums ────────────────────────────────────
  const albums = [
    {
      title: 'เกาะสมุย เม.ย. 2569',
      description: 'ภาพจากทริปเกาะสมุย 3 วัน 2 คืน กลุ่ม 12 คน',
      category: 'ทริปในประเทศ',
      coverUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=400&fit=crop',
      isActive: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=600&fit=crop', caption: 'หาดเฉวง ยามเช้า' },
        { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop', caption: 'วิวทะเล' },
        { url: 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=600&h=600&fit=crop', caption: 'ทะเลสีฟ้าใส' },
        { url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&h=600&fit=crop', caption: 'Snorkeling' },
      ],
    },
    {
      title: 'ดอยอินทนนท์ มี.ค. 2569',
      description: 'ทริปดอยอินทนนท์ ชมพระอาทิตย์ขึ้น ทะเลหมอก',
      category: 'ทริปในประเทศ',
      coverUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&h=400&fit=crop',
      isActive: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&h=600&fit=crop', caption: 'พระอาทิตย์ขึ้น' },
        { url: 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=600&h=600&fit=crop', caption: 'ทะเลหมอก' },
        { url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=600&fit=crop', caption: 'ป่าสนสวย' },
      ],
    },
    {
      title: 'หลวงพระบาง ลาว ก.พ. 2569',
      description: 'ทริปลาว มรดกโลก ตักบาตรพระ น้ำตกตาดกวางสี',
      category: 'ทริปต่างประเทศ',
      coverUrl: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=400&h=400&fit=crop',
      isActive: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&h=600&fit=crop', caption: 'หลวงพระบาง' },
        { url: 'https://images.unsplash.com/photo-1555073980-682d69c05249?w=600&h=600&fit=crop', caption: 'น้ำตกตาดกวางสี' },
        { url: 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=600&h=600&fit=crop', caption: 'ตักบาตรพระยามเช้า' },
      ],
    },
  ]
  for (const a of albums) {
    const { images, ...albumData } = a
    let album = await prisma.galleryAlbum.findFirst({ where: { title: albumData.title } })
    if (!album) {
      album = await prisma.galleryAlbum.create({ data: albumData })
    }
    // Add images if none exist
    const existingImgs = await prisma.galleryImage.count({ where: { albumId: album.id } })
    if (existingImgs === 0) {
      for (let i = 0; i < images.length; i++) {
        await prisma.galleryImage.create({
          data: { albumId: album.id, url: images[i].url, caption: images[i].caption, sortOrder: i + 1 }
        })
      }
    }
  }
  console.log(`✅ Gallery albums seeded`)

  // ── 8. Services content ──────────────────────────────────
  const services = [
    {
      title: 'รับจัดทริปส่วนตัว (Private Tour)',
      body: 'สำหรับกลุ่ม 8-15 คน ออกแบบโปรแกรมตามความต้องการได้ทั้งหมด ทั้งวันเดินทาง จุดหมาย กิจกรรม และอาหาร',
      imageUrl: 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=600&h=400&fit=crop',
    },
    {
      title: 'ให้เช่าอุปกรณ์เดินป่า',
      body: 'เต้นท์, ถุงนอน, เสื่อรองนอน, ไม้เท้า แบรนด์คุณภาพ NH, Mobi Garden ราคาเหมาะสม',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    },
    {
      title: 'จัดทริปองค์กร Team Building',
      body: 'ออกแบบกิจกรรม Team Building สำหรับองค์กร บริษัท โรงเรียน กลุ่มใหญ่ 20 คนขึ้นไป',
      imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=400&fit=crop',
    },
  ]
  for (const s of services) {
    const existing = await prisma.content.findFirst({ where: { type: 'SERVICE', title: s.title } })
    if (!existing) {
      await prisma.content.create({ data: { ...s, type: 'SERVICE', isActive: true } })
    }
  }
  console.log(`✅ Services seeded`)

  console.log('\n🎉 All mock data seeded successfully!')
  console.log('📊 Summary:')
  console.log('   - Users: 3 (admin, staff, customer)')
  console.log('   - Site settings: configured')
  console.log(`   - Trips: ${createdTrips.length} (in/international + hot flags)`)
  console.log('   - FAQ: 6 entries')
  console.log('   - Announcements: 3')
  console.log('   - Blog posts: 4')
  console.log('   - Trip posts: 4 (with hot/featured flags)')
  console.log('   - Gallery albums: 3 with images')
  console.log('   - Services: 3')
}

async function seedBusRounds() {
  console.log('🚌 Seeding bus rounds...')

  // ดึง trips ที่ยังไม่มี bus rounds
  const trips = await prisma.trip.findMany({ include: { _count: { select: { busRounds: true } } } })

  const roundsData = [
    // DOMESTIC trips
    {
      tripTitle: 'ทริปเกาะสมุย 3 วัน 2 คืน',
      rounds: [
        { start: 'กรุงเทพ (หมอชิต)', end: 'เกาะสมุย', dept: '2026-05-10T04:00:00Z', duration: '3 วัน 2 คืน', seats: 9, booked: 4 },
        { start: 'กรุงเทพ (หมอชิต)', end: 'เกาะสมุย', dept: '2026-05-24T04:00:00Z', duration: '3 วัน 2 คืน', seats: 9, booked: 2 },
        { start: 'กรุงเทพ (หมอชิต)', end: 'เกาะสมุย', dept: '2026-06-14T04:00:00Z', duration: '3 วัน 2 คืน', seats: 9, booked: 0 },
      ]
    },
    {
      tripTitle: 'ดอยอินทนนท์ ยอดดอยสูงสุด เชียงใหม่',
      rounds: [
        { start: 'กรุงเทพ (หมอชิต)', end: 'ดอยอินทนนท์', dept: '2026-05-08T22:00:00Z', duration: '3 วัน 2 คืน', seats: 12, booked: 7 },
        { start: 'กรุงเทพ (หมอชิต)', end: 'ดอยอินทนนท์', dept: '2026-05-22T22:00:00Z', duration: '3 วัน 2 คืน', seats: 12, booked: 3 },
        { start: 'กรุงเทพ (หมอชิต)', end: 'ดอยอินทนนท์', dept: '2026-06-05T22:00:00Z', duration: '3 วัน 2 คืน', seats: 12, booked: 0 },
      ]
    },
    {
      tripTitle: 'ปูยหลวง แม่ฮ่องสอน ทะเลหมอก',
      rounds: [
        { start: 'เชียงใหม่ (สนามบิน)', end: 'ปูยหลวง', dept: '2026-05-16T05:00:00Z', duration: '2 วัน 1 คืน', seats: 10, booked: 5 },
        { start: 'เชียงใหม่ (สนามบิน)', end: 'ปูยหลวง', dept: '2026-06-13T05:00:00Z', duration: '2 วัน 1 คืน', seats: 10, booked: 0 },
      ]
    },
    {
      tripTitle: 'อุ้มผาง ล่องแก่ง วังเจ้า',
      rounds: [
        { start: 'กรุงเทพ (หมอชิต)', end: 'อุ้มผาง', dept: '2026-05-20T22:00:00Z', duration: '4 วัน 3 คืน', seats: 9, booked: 6 },
        { start: 'กรุงเทพ (หมอชิต)', end: 'อุ้มผาง', dept: '2026-06-17T22:00:00Z', duration: '4 วัน 3 คืน', seats: 9, booked: 1 },
      ]
    },
    {
      tripTitle: 'เขาใหญ่ เดินป่า Wildlife',
      rounds: [
        { start: 'กรุงเทพ (สยาม)', end: 'เขาใหญ่', dept: '2026-05-09T05:30:00Z', duration: '2 วัน 1 คืน', seats: 14, booked: 8 },
        { start: 'กรุงเทพ (สยาม)', end: 'เขาใหญ่', dept: '2026-05-23T05:30:00Z', duration: '2 วัน 1 คืน', seats: 14, booked: 4 },
        { start: 'กรุงเทพ (สยาม)', end: 'เขาใหญ่', dept: '2026-06-06T05:30:00Z', duration: '2 วัน 1 คืน', seats: 14, booked: 0 },
      ]
    },
    {
      tripTitle: 'ทะเลเกาะกูด ตราด',
      rounds: [
        { start: 'กรุงเทพ (เอกมัย)', end: 'เกาะกูด', dept: '2026-05-15T04:00:00Z', duration: '3 วัน 2 คืน', seats: 9, booked: 3 },
        { start: 'กรุงเทพ (เอกมัย)', end: 'เกาะกูด', dept: '2026-06-12T04:00:00Z', duration: '3 วัน 2 คืน', seats: 9, booked: 0 },
      ]
    },
    // INTERNATIONAL trips
    {
      tripTitle: 'ลาว หลวงพระบาง มรดกโลก',
      rounds: [
        { start: 'สนามบินสุวรรณภูมิ', end: 'หลวงพระบาง', dept: '2026-06-10T04:00:00Z', duration: '4 วัน 3 คืน', seats: 15, booked: 9 },
        { start: 'สนามบินสุวรรณภูมิ', end: 'หลวงพระบาง', dept: '2026-07-08T04:00:00Z', duration: '4 วัน 3 คืน', seats: 15, booked: 3 },
      ]
    },
    {
      tripTitle: 'เวียดนาม ฮาลองเบย์ ฮานอย',
      rounds: [
        { start: 'สนามบินสุวรรณภูมิ', end: 'ฮานอย', dept: '2026-05-27T23:00:00Z', duration: '5 วัน 4 คืน', seats: 15, booked: 11 },
        { start: 'สนามบินสุวรรณภูมิ', end: 'ฮานอย', dept: '2026-06-24T23:00:00Z', duration: '5 วัน 4 คืน', seats: 15, booked: 2 },
      ]
    },
    {
      tripTitle: 'อินโดนีเซีย Rinjani Volcano Trek',
      rounds: [
        { start: 'สนามบินสุวรรณภูมิ', end: 'ลอมบอก', dept: '2026-06-18T23:00:00Z', duration: '6 วัน 5 คืน', seats: 12, booked: 6 },
        { start: 'สนามบินสุวรรณภูมิ', end: 'ลอมบอก', dept: '2026-07-16T23:00:00Z', duration: '6 วัน 5 คืน', seats: 12, booked: 0 },
      ]
    },
    {
      tripTitle: 'ฟิลิปปินส์ CEBU Island Hopping',
      rounds: [
        { start: 'สนามบินสุวรรณภูมิ', end: 'เซบู', dept: '2026-06-03T01:00:00Z', duration: '4 วัน 3 คืน', seats: 14, booked: 8 },
        { start: 'สนามบินสุวรรณภูมิ', end: 'เซบู', dept: '2026-07-01T01:00:00Z', duration: '4 วัน 3 คืน', seats: 14, booked: 1 },
      ]
    },
  ]

  let created = 0
  for (const rd of roundsData) {
    const trip = trips.find(t => t.title === rd.tripTitle)
    if (!trip) { console.log(`  ⚠️  ไม่พบทริป: ${rd.tripTitle}`); continue }
    for (const r of rd.rounds) {
      const existing = await prisma.busRound.findFirst({
        where: { tripId: trip.id, departDate: new Date(r.dept) }
      })
      if (!existing) {
        await prisma.busRound.create({
          data: {
            tripId: trip.id,
            startPoint: r.start,
            endPoint: r.end,
            departDate: new Date(r.dept),
            duration: r.duration,
            totalSeats: r.seats,
            bookedSeats: r.booked,
            isOpen: true,
          }
        })
        created++
      }
    }
  }
  console.log(`✅ ${created} bus rounds seeded`)
}

// Check command line arguments
const args = process.argv.slice(2)

async function run() {
  try {
    if (args.includes('clean-admin')) {
      // Clear all data and seed only admin
      await clearAllData()
      await seedAdminOnly()
      console.log('\n🎉 Clean admin seeding completed!')
    } else if (args.includes('admin-only')) {
      // Seed only admin user (no clearing)
      await seedAdminOnly()
      console.log('\n🎉 Admin-only seeding completed!')
    } else {
      // Default: run full seeding
      await main()
      await seedBusRounds()
      console.log('\n🎉 Full seeding completed!')
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

run()
