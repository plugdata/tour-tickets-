/**
 * Seed script — ย้าย mock data → PostgreSQL
 * run: node prisma/seed.js
 */
require('dotenv').config()
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 เริ่ม seed ข้อมูล...\n')

  // ── ล้างข้อมูลเดิม (order: child → parent) ──────────────────────────
  await prisma.cancelLog.deleteMany()
  await prisma.insuranceForm.deleteMany()
  await prisma.seatBooking.deleteMany()
  await prisma.bookingSession.deleteMany()
  await prisma.bookingAddon.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.addon.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.content.deleteMany()
  await prisma.busRound.deleteMany()
  await prisma.trip.deleteMany()
  await prisma.user.deleteMany()
  await prisma.bankAccount.deleteMany()
  await prisma.insuranceCondition.deleteMany()
  await prisma.insurancePolicyContent.deleteMany()
  console.log('✅ ล้างข้อมูลเดิมแล้ว')

  // ── Users ──────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('12345', 10)
  const users = await Promise.all([
    prisma.user.create({ data: { id: 1, username: 'admin', password: hash, role: 'ADMIN', name: 'Admin System', phone: '0812345678', email: 'admin@tour.com' } }),
    prisma.user.create({ data: { id: 2, username: 'staff1', password: hash, role: 'STUFF', name: 'Staff One', phone: '0898765432', email: 'staff@tour.com' } }),
    prisma.user.create({ data: { id: 3, username: 'customer1', password: hash, role: 'CUSTOMER', name: 'กมลพร ทองสุข', phone: '0864523187', email: 'kamonporn@email.com' } }),
    prisma.user.create({ data: { id: 4, username: 'customer2', password: hash, role: 'CUSTOMER', name: 'รัฐพล ดำรงค์ธรรม', phone: '0845673219', email: 'ratthaphon@email.com' } }),
  ])
  console.log(` Users: ${users.length} คน`)

  //  Bank Accounts  ---------------------------------------------------
  const bankAccounts = await Promise.all([
    prisma.bankAccount.create({ 
      data: { 
        accountNo: '1234567890', 
        accountName: ' ', 
        bankName: ' ', 
        accountType: 'COMPANY',
        description: ' ',
        isActive: true 
      } 
    }),
    prisma.bankAccount.create({ 
      data: { 
        accountNo: '9876543210', 
        accountName: ' ', 
        bankName: ' ', 
        accountType: 'PERSONAL',
        description: ' ',
        imageUrl: '/uploads/bank-accounts/sample-kbank.jpg',
        isActive: true 
      } 
    }),
    prisma.bankAccount.create({ 
      data: { 
        accountNo: '5555666677', 
        accountName: ' ', 
        bankName: ' ', 
        accountType: 'COMPANY',
        description: ' ',
        imageUrl: '/uploads/bank-accounts/sample-bbl.jpg',
        isActive: true 
      } 
    }),
  ])
  console.log(`  Bank Accounts: ${bankAccounts.length}  `)

  // ── Trips ──────────────────────────────────────────────────────────────
  const trips = await Promise.all([
    prisma.trip.create({ data: { id: 1, title: 'ทริปเกาะสมุย 3 วัน 2 คืน', description: 'พักผ่อนบนเกาะสวรรค์ ทะเลใส ธรรมชาติงดงาม', imageUrl: 'https://picsum.photos/seed/samui/400/300', price: 3500, isActive: true } }),
    prisma.trip.create({ data: { id: 2, title: 'ทริปเชียงใหม่ ดอยอินทนนท์', description: 'สัมผัสธรรมชาติภาคเหนือ ทะเลหมอก ดอกไม้', imageUrl: 'https://picsum.photos/seed/chiangmai/400/300', price: 2800, isActive: true } }),
    prisma.trip.create({ data: { id: 3, title: 'ทริปกาญจนบุรี แม่น้ำแคว', description: 'ล่องแพ น้ำตก ประวัติศาสตร์สงครามโลก', imageUrl: 'https://picsum.photos/seed/kanchan/400/300', price: 1800, isActive: true } }),
  ])
  console.log(` Trips: ${trips.length} ทริป`)
  console.log(`✅ Trips: ${trips.length} ทริป`)

  // ── BusRounds ──────────────────────────────────────────────────────────
  const rounds = await Promise.all([
    prisma.busRound.create({ data: { id: 1, tripId: 1, busNumber: 1, startPoint: 'กรุงเทพ (อนุสาวรีย์ชัย)', endPoint: 'เกาะสมุย', departDate: new Date('2025-06-15T06:00:00'), totalSeats: 9, bookedSeats: 4, isOpen: true, responsiblePerson: 'นายวิชัย สุขดี', duration: '3 วัน 2 คืน', pickupPoints: JSON.stringify([{name: 'กรุงเทพ (อนุสาวรีย์ชัย)', price: 0}, {name: 'กรุงเทพ (หมอชิต)', price: 300}, {name: 'กรุงเทพ (วิคตอเรีย)', price: 200}]) } }),
    prisma.busRound.create({ data: { id: 2, tripId: 1, busNumber: 2, startPoint: 'กรุงเทพ (หมอชิต)', endPoint: 'เกาะสมุย', departDate: new Date('2025-06-22T06:00:00'), totalSeats: 9, bookedSeats: 5, isOpen: true, responsiblePerson: 'นางสาวพิมพ์ใจ รัตนาภรณ์', duration: '3 วัน 2 คืน', pickupPoints: JSON.stringify([{name: 'กรุงเทพ (หมอชิต)', price: 0}, {name: 'กรุงเทพ (วิคตอเรีย)', price: 300}, {name: 'กรุงเทพ (อนุสาวรีย์ชัย)', price: 200}]) } }),
    prisma.busRound.create({ data: { id: 3, tripId: 2, busNumber: 1, startPoint: 'กรุงเทพ (หมอชิต)', endPoint: 'เชียงใหม่', departDate: new Date('2025-07-01T20:00:00'), totalSeats: 9, bookedSeats: 3, isOpen: false, responsiblePerson: 'นายสมศักดิ์ ดีงาม', duration: '2 วัน 1 คืน', pickupPoints: JSON.stringify([{name: 'กรุงเทพ (หมอชิต)', price: 0}, {name: 'กรุงเทพ (วิคตอเรีย)', price: 250}, {name: 'กรุงเทพ (อนุสาวรีย์ชัย)', price: 150}]) } }),
    prisma.busRound.create({ data: { id: 4, tripId: 3, busNumber: 1, startPoint: 'กรุงเทพ (วิคตอเรีย)', endPoint: 'กาญจนบุรี', departDate: new Date('2025-06-28T07:00:00'), totalSeats: 9, bookedSeats: 4, isOpen: true, responsiblePerson: 'นางมาลัย ประเสริฐ', duration: '2 วัน 1 คืน', pickupPoints: JSON.stringify([{name: 'กรุงเทพ (วิคตอเรีย)', price: 0}, {name: 'กรุงเทพ (หมอชิต)', price: 200}, {name: 'กรุงเทพ (อนุสาวรีย์ชัย)', price: 100}]) } }),
  ])
  console.log(`✅ BusRounds: ${rounds.length} รอบ`)

  // ── Addons ─────────────────────────────────────────────────────────────
  const addons = await Promise.all([
    prisma.addon.create({ data: { id: 1, tripId: 1, name: 'เสื้อชูชีพ', description: 'เสื้อชูชีพสำหรับกิจกรรมทางน้ำ', price: 150, isActive: true } }),
    prisma.addon.create({ data: { id: 2, tripId: 1, name: 'ชุดดำน้ำ', description: 'ชุดดำน้ำ + อุปกรณ์ครบ', price: 350, isActive: true } }),
    prisma.addon.create({ data: { id: 3, tripId: 2, name: 'เสื้อกันหนาว', description: 'เช่าเสื้อกันหนาวบนดอย', price: 100, isActive: true } }),
    prisma.addon.create({ data: { id: 4, tripId: 3, name: 'แพล่องน้ำ VIP', description: 'แพส่วนตัว อาหารครบ', price: 500, isActive: true } }),
    prisma.addon.create({ data: { id: 5, tripId: 1, name: 'อุปกรณ์ Snorkeling', description: 'หน้ากาก + ท่อหายใจ + ตีนกบ', price: 200, isActive: true } }),
    prisma.addon.create({ data: { id: 6, tripId: 1, name: 'ทัวร์เรือ Speedboat', description: 'ล่องเรือชมเกาะรอบ ใช้เวลา 3 ชม.', price: 800, isActive: true } }),
    prisma.addon.create({ data: { id: 7, tripId: 2, name: 'เช่าจักรยาน', description: 'จักรยานปั่นชมธรรมชาติ (ต่อวัน)', price: 150, isActive: true } }),
    prisma.addon.create({ data: { id: 8, tripId: 2, name: 'กล้อง Action Camera', description: 'GoPro Hero พร้อมอุปกรณ์ครบ', price: 300, isActive: false } }),
    prisma.addon.create({ data: { id: 9, tripId: 3, name: 'อุปกรณ์ตกปลา', description: 'เบ็ด + อาหารปลา + ที่นั่งริมน้ำ', price: 120, isActive: true } }),
    prisma.addon.create({ data: { id: 10, tripId: 3, name: 'เต็นท์นอนริมน้ำ', description: 'เต็นท์ 2 คน พร้อมถุงนอน (ต่อคืน)', price: 350, isActive: true } }),
  ])
  console.log(`✅ Addons: ${addons.length} รายการ`)

  // ── Bookings ───────────────────────────────────────────────────────────
  const bookings = await Promise.all([
    prisma.booking.create({ data: { id: 1, userId: 1, busRoundId: 1, seats: 2, bookingType: 'GROUP', foodAllergy: null, status: 'CONFIRMED', totalAmount: 7000, recordedBy: 'admin' } }),
    prisma.booking.create({ data: { id: 2, userId: 2, busRoundId: 1, seats: 2, bookingType: 'GROUP', foodAllergy: 'แพ้นม', status: 'CONFIRMED', totalAmount: 7000, recordedBy: 'staff1' } }),
    prisma.booking.create({ data: { id: 3, userId: 1, busRoundId: 4, seats: 3, bookingType: 'GROUP', foodAllergy: null, status: 'CONFIRMED', totalAmount: 5400, recordedBy: 'admin' } }),
    prisma.booking.create({ data: { id: 4, userId: 2, busRoundId: 3, seats: 1, bookingType: 'SINGLE', foodAllergy: null, status: 'CONFIRMED', totalAmount: 2800, recordedBy: 'admin' } }),
    prisma.booking.create({ data: { id: 5, userId: 3, busRoundId: 2, seats: 2, bookingType: 'GROUP', foodAllergy: null, status: 'PENDING', totalAmount: 7000, recordedBy: 'staff1' } }),
    prisma.booking.create({ data: { id: 6, userId: 4, busRoundId: 4, seats: 1, bookingType: 'SINGLE', foodAllergy: null, status: 'PENDING', totalAmount: 1800, recordedBy: 'staff1' } }),
    prisma.booking.create({ data: { id: 7, userId: 3, busRoundId: 2, seats: 3, bookingType: 'GROUP', foodAllergy: null, status: 'CANCELLED', totalAmount: 10500, recordedBy: 'admin' } }),
    prisma.booking.create({ data: { id: 8, userId: 4, busRoundId: 3, seats: 2, bookingType: 'GROUP', foodAllergy: 'แพ้อาหารทะเล', status: 'CANCELLED', totalAmount: 5600, recordedBy: 'admin' } }),
  ])
  console.log(`✅ Bookings: ${bookings.length} รายการ`)

  // ── BookingAddons ──────────────────────────────────────────────────────
  const bAddons = await Promise.all([
    prisma.bookingAddon.create({ data: { id: 1, bookingId: 1, addonId: 1, quantity: 2, price: 300 } }),
    prisma.bookingAddon.create({ data: { id: 2, bookingId: 1, addonId: 2, quantity: 1, price: 350 } }),
    prisma.bookingAddon.create({ data: { id: 3, bookingId: 2, addonId: 5, quantity: 2, price: 400 } }),
    prisma.bookingAddon.create({ data: { id: 4, bookingId: 3, addonId: 9, quantity: 3, price: 360 } }),
    prisma.bookingAddon.create({ data: { id: 5, bookingId: 3, addonId: 4, quantity: 2, price: 1000 } }),
  ])
  console.log(`✅ BookingAddons: ${bAddons.length} รายการ`)

  // ── Payments ───────────────────────────────────────────────────────────
  const now = new Date()
  const payments = await Promise.all([
    prisma.payment.create({ data: { id: 1, bookingId: 1, userId: 1, amount: 3500, type: 'DEPOSIT', slipUrl: 'https://picsum.photos/seed/slip1/300/400', status: 'CONFIRMED', confirmedAt: now } }),
    prisma.payment.create({ data: { id: 2, bookingId: 2, userId: 2, amount: 3500, type: 'DEPOSIT', slipUrl: 'https://picsum.photos/seed/slip2/300/400', status: 'PENDING', confirmedAt: null } }),
    prisma.payment.create({ data: { id: 3, bookingId: 3, userId: 1, amount: 2700, type: 'DEPOSIT', slipUrl: 'https://picsum.photos/seed/slip3/300/400', status: 'CONFIRMED', confirmedAt: now } }),
    prisma.payment.create({ data: { id: 4, bookingId: 4, userId: 2, amount: 2800, type: 'FULL', slipUrl: 'https://picsum.photos/seed/slip4/300/400', status: 'CONFIRMED', confirmedAt: now } }),
    prisma.payment.create({ data: { id: 5, bookingId: 5, userId: 3, amount: 3000, type: 'DEPOSIT', slipUrl: 'https://picsum.photos/seed/slip5/300/400', status: 'PENDING', confirmedAt: null } }),
    prisma.payment.create({ data: { id: 6, bookingId: 7, userId: 3, amount: 5000, type: 'DEPOSIT', slipUrl: 'https://picsum.photos/seed/slip6/300/400', status: 'CONFIRMED', confirmedAt: now } }),
  ])
  console.log(`✅ Payments: ${payments.length} รายการ`)

  // ── Contents ───────────────────────────────────────────────────────────
  await Promise.all([
    prisma.content.create({ data: { id: 1, tripId: 1, type: 'TRIP_POST', title: 'ความประทับใจทริปสมุย', body: 'วิวทะเลสวยมาก น้ำใส ทีมงานดูแลดีมาก แนะนำเลยครับ', imageUrl: 'https://picsum.photos/seed/content1/400/300', isActive: true } }),
    prisma.content.create({ data: { id: 2, tripId: null, type: 'FAQ', title: 'สามารถยกเลิกการจองได้ไหม?', body: 'สามารถยกเลิกได้ก่อน 7 วัน โดยได้รับเงินคืน 80%', isActive: true } }),
    prisma.content.create({ data: { id: 3, tripId: null, type: 'ABOUT', title: 'เกี่ยวกับเรา', body: 'บริษัท Tour Excellence ให้บริการทัวร์คุณภาพมากกว่า 10 ปี', imageUrl: 'https://picsum.photos/seed/about/400/300', isActive: true } }),
  ])
  console.log(`✅ Contents: 3 รายการ`)

  // ── Expenses ───────────────────────────────────────────────────────────
  await Promise.all([
    prisma.expense.create({ data: { id: 1, busRoundId: 1, category: 'น้ำมัน', description: 'น้ำมันรถทัวร์ไป-กลับ', amount: 4500, date: new Date('2025-06-15') } }),
    prisma.expense.create({ data: { id: 2, busRoundId: 1, category: 'ค่าอาหาร', description: 'อาหารกลางวันทีมงาน', amount: 800, date: new Date('2025-06-15') } }),
    prisma.expense.create({ data: { id: 3, busRoundId: 4, category: 'น้ำมัน', description: 'น้ำมันรถ', amount: 2200, date: new Date('2025-06-28') } }),
    prisma.expense.create({ data: { id: 4, busRoundId: 1, category: 'ค่าที่พัก', description: 'โรงแรมทีมงาน 2 คืน', amount: 6000, date: new Date('2025-06-15') } }),
    prisma.expense.create({ data: { id: 5, busRoundId: 1, category: 'ค่าเรือ', description: 'เรือ speedboat รอบเกาะ', amount: 3500, date: new Date('2025-06-16') } }),
    prisma.expense.create({ data: { id: 6, busRoundId: 4, category: 'ค่าแพ', description: 'ค่าจัดแพล่องน้ำ + อาหาร', amount: 1500, date: new Date('2025-06-28') } }),
    prisma.expense.create({ data: { id: 7, busRoundId: 4, category: 'ค่าอาหาร', description: 'อาหารเย็นริมน้ำ (บาร์บีคิว)', amount: 1200, date: new Date('2025-06-29') } }),
    prisma.expense.create({ data: { id: 8, busRoundId: 3, category: 'น้ำมัน', description: 'น้ำมันรถทัวร์กรุงเทพ-เชียงใหม่', amount: 3800, date: new Date('2025-07-01') } }),
    prisma.expense.create({ data: { id: 9, busRoundId: 3, category: 'ค่าที่พัก', description: 'รีสอร์ทดอยอินทนนท์ 2 คืน', amount: 4200, date: new Date('2025-07-01') } }),
    prisma.expense.create({ data: { id: 10, busRoundId: 3, category: 'ค่าอาหาร', description: 'อาหารทีมงานและไกด์', amount: 950, date: new Date('2025-07-02') } }),
  ])
  console.log(`✅ Expenses: 10 รายการ`)

  // ── SeatBookings (ข้อมูลผู้โดยสารรายตัว) ─────────────────────────────
  // busRound 1 (สมุย รอบ 1): booking 1 → seat 2,3 | booking 2 → seat 4,5
  // busRound 2 (สมุย รอบ 2): booking 5 → seat 2,3 | booking 7 → seat 4,5,6
  // busRound 3 (เชียงใหม่):  booking 4 → seat 2   | booking 8 → seat 3,4
  // busRound 4 (กาญจนบุรี):  booking 3 → seat 2,3,4 | booking 6 → seat 5
  const seatBookings = await Promise.all([
    // ── busRound 1 ──
    prisma.seatBooking.create({ data: { id: 1, busRoundId: 1, bookingId: 1, seatNumber: 2, vanOrder: 1, gender: 'MALE', namePrefix: 'นาย', firstName: 'สมชาย', lastName: 'ใจดี', nickname: 'ชาย', nationalId: '1100700123456', birthDate: new Date('1988-03-20'), phone: '0812345678', email: 'somchai@email.com', bloodType: 'O+', foodAllergy: 'แพ้กุ้ง', pickupPoint: 'อนุสาวรีย์ชัยสมรภูมิ', dropoffPoint: 'เกาะสมุย', emergencyName: 'นางสาว สมหญิง ใจดี', emergencyPhone: '0898765432' } }),
    prisma.seatBooking.create({ data: { id: 2, busRoundId: 1, bookingId: 1, seatNumber: 3, vanOrder: 1, gender: 'FEMALE', namePrefix: 'นาง', firstName: 'ลัดดา', lastName: 'พรรณราย', nickname: 'ดา', nationalId: '1560800456789', birthDate: new Date('1980-05-25'), phone: '0834567890', email: 'ladda@email.com', bloodType: 'AB+', foodAllergy: null, pickupPoint: 'อนุสาวรีย์ชัยสมรภูมิ', dropoffPoint: 'เกาะสมุย', emergencyName: 'นาย ประวิทย์ พรรณราย', emergencyPhone: '0845678901' } }),
    prisma.seatBooking.create({ data: { id: 3, busRoundId: 1, bookingId: 2, seatNumber: 4, vanOrder: 1, gender: 'MALE', namePrefix: 'นาย', firstName: 'ธนกร', lastName: 'สุขสวัสดิ์', nickname: 'กร', nationalId: '2450900345678', birthDate: new Date('1992-11-05'), phone: '0876543210', email: 'thanakorn@email.com', bloodType: 'B+', foodAllergy: 'แพ้นม', pickupPoint: 'หมอชิต 2', dropoffPoint: 'เกาะสมุย', emergencyName: 'นาง ประไพ สุขสวัสดิ์', emergencyPhone: '0823456789' } }),
    prisma.seatBooking.create({ data: { id: 4, busRoundId: 1, bookingId: 2, seatNumber: 5, vanOrder: 1, gender: 'MALE', namePrefix: 'นาย', firstName: 'พิษณุ', lastName: 'แก้วประเสริฐ', nickname: 'นุ', nationalId: '4150200567890', birthDate: new Date('1998-09-15'), phone: '0856789012', email: null, bloodType: 'O-', foodAllergy: null, pickupPoint: 'หมอชิต 2', dropoffPoint: 'เกาะสมุย', emergencyName: 'นาย อนุชิต แก้วประเสริฐ', emergencyPhone: '0867890123' } }),
    // ── busRound 2 ──
    prisma.seatBooking.create({ data: { id: 5, busRoundId: 2, bookingId: 5, seatNumber: 2, vanOrder: 1, gender: 'FEMALE', namePrefix: 'นางสาว', firstName: 'กมลพร', lastName: 'ทองสุข', nickname: 'กิ๊ฟ', nationalId: '1890400112233', birthDate: new Date('1993-06-14'), phone: '0864523187', email: 'kamonporn@email.com', bloodType: 'A+', foodAllergy: null, pickupPoint: 'อนุสาวรีย์ชัยสมรภูมิ', dropoffPoint: 'เกาะสมุย', emergencyName: 'นาย อภิวัฒน์ ทองสุข', emergencyPhone: '0831122334' } }),
    prisma.seatBooking.create({ data: { id: 6, busRoundId: 2, bookingId: 5, seatNumber: 3, vanOrder: 1, gender: 'MALE', namePrefix: 'นาย', firstName: 'อภิวัฒน์', lastName: 'ทองสุข', nickname: 'กอล์ฟ', nationalId: '2340500223344', birthDate: new Date('1990-03-22'), phone: '0831122334', email: null, bloodType: 'O+', foodAllergy: 'แพ้แลคโตส', pickupPoint: 'อนุสาวรีย์ชัยสมรภูมิ', dropoffPoint: 'เกาะสมุย', emergencyName: 'นางสาว กมลพร ทองสุข', emergencyPhone: '0864523187' } }),
    prisma.seatBooking.create({ data: { id: 7, busRoundId: 2, bookingId: 7, seatNumber: 4, vanOrder: 1, gender: 'MALE', namePrefix: 'นาย', firstName: 'ณัฐพล', lastName: 'บุญเรือง', nickname: 'บิ๊ก', nationalId: '4670700445566', birthDate: new Date('1989-12-30'), phone: '0876655443', email: 'natthapon@email.com', bloodType: 'AB-', foodAllergy: null, pickupPoint: 'อนุสาวรีย์ชัยสมรภูมิ', dropoffPoint: 'เกาะสมุย', emergencyName: 'นางสาว กัญญา บุญเรือง', emergencyPhone: '0854433221' } }),
    prisma.seatBooking.create({ data: { id: 8, busRoundId: 2, bookingId: 7, seatNumber: 5, vanOrder: 1, gender: 'FEMALE', namePrefix: 'นางสาว', firstName: 'กัญญา', lastName: 'บุญเรือง', nickname: 'กัน', nationalId: '5230800556677', birthDate: new Date('1993-07-18'), phone: '0854433221', email: null, bloodType: 'A-', foodAllergy: null, pickupPoint: 'อนุสาวรีย์ชัยสมรภูมิ', dropoffPoint: 'เกาะสมุย', emergencyName: 'นาย ณัฐพล บุญเรือง', emergencyPhone: '0876655443' } }),
    prisma.seatBooking.create({ data: { id: 9, busRoundId: 2, bookingId: 7, seatNumber: 6, vanOrder: 1, gender: 'FEMALE', namePrefix: 'นางสาว', firstName: 'อภิชญา', lastName: 'พงษ์ศิริ', nickname: 'อิ๋ว', nationalId: '6450900667788', birthDate: new Date('2000-01-05'), phone: '0823344556', email: 'apichaya@email.com', bloodType: 'B+', foodAllergy: 'แพ้ถั่วลิสง', pickupPoint: 'หมอชิต 2', dropoffPoint: 'เกาะสมุย', emergencyName: 'นาง วนิดา พงษ์ศิริ', emergencyPhone: '0834455667' } }),
    // ── busRound 3 ──
    prisma.seatBooking.create({ data: { id: 10, busRoundId: 3, bookingId: 4, seatNumber: 2, vanOrder: 1, gender: 'MALE', namePrefix: 'นาย', firstName: 'ปิยะ', lastName: 'ศรีวิชัย', nickname: 'ปิ', nationalId: '7340200890123', birthDate: new Date('1994-02-18'), phone: '0890123456', email: 'piya@email.com', bloodType: 'AB+', foodAllergy: null, pickupPoint: 'หมอชิต 2', dropoffPoint: 'เชียงใหม่ อาเขต', emergencyName: 'นาง สุนีย์ ศรีวิชัย', emergencyPhone: '0812340987' } }),
    prisma.seatBooking.create({ data: { id: 11, busRoundId: 3, bookingId: 8, seatNumber: 3, vanOrder: 1, gender: 'FEMALE', namePrefix: 'นางสาว', firstName: 'เพ็ญนภา', lastName: 'ลิ้มสกุล', nickname: 'แนน', nationalId: '7890100778899', birthDate: new Date('1995-04-03'), phone: '0867788990', email: 'pennapa@email.com', bloodType: 'O-', foodAllergy: 'แพ้อาหารทะเล', pickupPoint: 'หมอชิต 2', dropoffPoint: 'เชียงใหม่ อาเขต', emergencyName: 'นาย วันชัย ลิ้มสกุล', emergencyPhone: '0878899001' } }),
    prisma.seatBooking.create({ data: { id: 12, busRoundId: 3, bookingId: 8, seatNumber: 4, vanOrder: 1, gender: 'MALE', namePrefix: 'นาย', firstName: 'วันชัย', lastName: 'ลิ้มสกุล', nickname: 'ชัย', nationalId: '8120200889900', birthDate: new Date('1992-10-27'), phone: '0878899001', email: null, bloodType: 'B-', foodAllergy: null, pickupPoint: 'หมอชิต 2', dropoffPoint: 'เชียงใหม่ อาเขต', emergencyName: 'นางสาว เพ็ญนภา ลิ้มสกุล', emergencyPhone: '0867788990' } }),
    // ── busRound 4 ──
    prisma.seatBooking.create({ data: { id: 13, busRoundId: 4, bookingId: 3, seatNumber: 2, vanOrder: 1, gender: 'FEMALE', namePrefix: 'นางสาว', firstName: 'วิภา', lastName: 'มณีรัตน์', nickname: 'ภา', nationalId: '3670100234567', birthDate: new Date('1995-07-10'), phone: '0891234567', email: 'wipa@email.com', bloodType: 'A+', foodAllergy: null, pickupPoint: 'วิคตอเรีย เมมโมเรียล', dropoffPoint: 'กาญจนบุรี', emergencyName: 'นาย วิชัย มณีรัตน์', emergencyPhone: '0812345600' } }),
    prisma.seatBooking.create({ data: { id: 14, busRoundId: 4, bookingId: 3, seatNumber: 3, vanOrder: 1, gender: 'MALE', namePrefix: 'นาย', firstName: 'สุรชัย', lastName: 'วงศ์สวัสดิ์', nickname: 'ชัย', nationalId: '5890300678901', birthDate: new Date('1991-04-12'), phone: '0878901234', email: 'surachai@email.com', bloodType: 'B-', foodAllergy: null, pickupPoint: 'วิคตอเรีย เมมโมเรียล', dropoffPoint: 'กาญจนบุรี', emergencyName: 'นาง พรทิพย์ วงศ์สวัสดิ์', emergencyPhone: '0889012345' } }),
    prisma.seatBooking.create({ data: { id: 15, busRoundId: 4, bookingId: 3, seatNumber: 4, vanOrder: 1, gender: 'FEMALE', namePrefix: 'นางสาว', firstName: 'อรทัย', lastName: 'นาคสมบูรณ์', nickname: 'ตาล', nationalId: '6230100789012', birthDate: new Date('1996-08-30'), phone: '0856781234', email: 'oratai@email.com', bloodType: 'A-', foodAllergy: 'แพ้ถั่ว', pickupPoint: 'บางกอกน้อย', dropoffPoint: 'กาญจนบุรี', emergencyName: 'นาย ประเสริฐ นาคสมบูรณ์', emergencyPhone: '0867892345' } }),
    prisma.seatBooking.create({ data: { id: 16, busRoundId: 4, bookingId: 6, seatNumber: 5, vanOrder: 1, gender: 'MALE', namePrefix: 'นาย', firstName: 'รัฐพล', lastName: 'ดำรงค์ธรรม', nickname: 'เอก', nationalId: '3120600334455', birthDate: new Date('1997-09-08'), phone: '0845673219', email: 'ratthaphon@email.com', bloodType: 'B+', foodAllergy: null, pickupPoint: 'วิคตอเรีย เมมโมเรียล', dropoffPoint: 'กาญจนบุรี', emergencyName: 'นาง สุมาลี ดำรงค์ธรรม', emergencyPhone: '0899887766' } }),
  ])
  console.log(`✅ SeatBookings: ${seatBookings.length} รายการ`)

  // ── InsuranceForms (เฉพาะข้อมูลประกัน) ──────────────────────────────
  // seatBookingId → id ของ SeatBooking ข้างบน
  const ins = [
    { id: 1, bookingId: 1, seatBookingId: 1, beneficiaryName: 'นางสาว สมหญิง ใจดี', beneficiaryRelation: 'SPOUSE', beneficiaryRelationOther: null, coverageAmount: 1000000, consentPolicyRead: true, consentTermsAccepted: true, consent4WD: true, consentDomesticOnly: true, customConditions: 'มีโรคประจำตัว: ความดันโลหิตสูง', status: 'SUBMITTED', submittedAt: now },
    { id: 2, bookingId: 1, seatBookingId: 2, beneficiaryName: 'นาย ประวิทย์ พรรณราย', beneficiaryRelation: 'SPOUSE', beneficiaryRelationOther: null, coverageAmount: 1000000, consentPolicyRead: true, consentTermsAccepted: true, consent4WD: true, consentDomesticOnly: true, customConditions: null, status: 'APPROVED', submittedAt: now, reviewedBy: 'admin', reviewedAt: now, issuedPolicyNo: 'POL-2025-0002' },
    { id: 3, bookingId: 2, seatBookingId: 3, beneficiaryName: 'นาง ประไพ สุขสวัสดิ์', beneficiaryRelation: 'MOTHER', beneficiaryRelationOther: null, coverageAmount: 1000000, consentPolicyRead: true, consentTermsAccepted: true, consent4WD: false, consentDomesticOnly: true, customConditions: 'ต้องการความช่วยเหลือพิเศษด้านการเดินทาง', status: 'REJECTED', submittedAt: now, reviewedBy: 'admin', reviewedAt: now, rejectReason: 'เอกสารบัตรประชาชนไม่ชัดเจน' },
    { id: 4, bookingId: 2, seatBookingId: 4, beneficiaryName: 'นาย อนุชิต แก้วประเสริฐ', beneficiaryRelation: 'SIBLING', beneficiaryRelationOther: null, coverageAmount: 1000000, consentPolicyRead: true, consentTermsAccepted: true, consent4WD: true, consentDomesticOnly: true, customConditions: 'เป็นนักกีฬาอาชีพ (นักว่ายน้ำ)', status: 'DRAFT' },
    { id: 5, bookingId: 5, seatBookingId: 5, beneficiaryName: 'นาย อภิวัฒน์ ทองสุข', beneficiaryRelation: 'SPOUSE', beneficiaryRelationOther: null, coverageAmount: 1000000, consentPolicyRead: true, consentTermsAccepted: true, consent4WD: true, consentDomesticOnly: true, customConditions: null, status: 'SUBMITTED', submittedAt: now },
    { id: 6, bookingId: 5, seatBookingId: 6, beneficiaryName: 'นางสาว กมลพร ทองสุข', beneficiaryRelation: 'SPOUSE', beneficiaryRelationOther: null, coverageAmount: 1000000, consentPolicyRead: true, consentTermsAccepted: true, consent4WD: true, consentDomesticOnly: true, customConditions: null, status: 'DRAFT' },
    { id: 7, bookingId: 7, seatBookingId: 7, beneficiaryName: 'นางสาว กัญญา บุญเรือง', beneficiaryRelation: 'SIBLING', beneficiaryRelationOther: null, coverageAmount: 1000000, consentPolicyRead: true, consentTermsAccepted: true, consent4WD: true, consentDomesticOnly: true, customConditions: null, status: 'DRAFT' },
    { id: 8, bookingId: 7, seatBookingId: 8, beneficiaryName: 'นาย ณัฐพล บุญเรือง', beneficiaryRelation: 'SIBLING', beneficiaryRelationOther: null, coverageAmount: 1000000, consentPolicyRead: true, consentTermsAccepted: true, consent4WD: true, consentDomesticOnly: true, customConditions: null, status: 'DRAFT' },
    { id: 9, bookingId: 7, seatBookingId: 9, beneficiaryName: 'นาง วนิดา พงษ์ศิริ', beneficiaryRelation: 'MOTHER', beneficiaryRelationOther: null, coverageAmount: 1000000, consentPolicyRead: true, consentTermsAccepted: true, consent4WD: false, consentDomesticOnly: true, customConditions: null, status: 'DRAFT' },
    { id: 10, bookingId: 4, seatBookingId: 10, beneficiaryName: 'นาง สุนีย์ ศรีวิชัย', beneficiaryRelation: 'MOTHER', beneficiaryRelationOther: null, coverageAmount: 1000000, consentPolicyRead: true, consentTermsAccepted: true, consent4WD: true, consentDomesticOnly: true, customConditions: null, status: 'APPROVED', submittedAt: now, reviewedBy: 'admin', reviewedAt: now, issuedPolicyNo: 'POL-2025-0003' },
    { id: 11, bookingId: 8, seatBookingId: 11, beneficiaryName: 'นาย วันชัย ลิ้มสกุล', beneficiaryRelation: 'SIBLING', beneficiaryRelationOther: null, coverageAmount: 1000000, consentPolicyRead: true, consentTermsAccepted: true, consent4WD: true, consentDomesticOnly: true, customConditions: 'แพ้อาหารทะเลทุกชนิด', status: 'DRAFT' },
    { id: 12, bookingId: 8, seatBookingId: 12, beneficiaryName: 'นางสาว เพ็ญนภา ลิ้มสกุล', beneficiaryRelation: 'SIBLING', beneficiaryRelationOther: null, coverageAmount: 1000000, consentPolicyRead: true, consentTermsAccepted: true, consent4WD: true, consentDomesticOnly: true, customConditions: null, status: 'DRAFT' },
    { id: 13, bookingId: 3, seatBookingId: 13, beneficiaryName: 'นาย วิชัย มณีรัตน์', beneficiaryRelation: 'FATHER', beneficiaryRelationOther: null, coverageAmount: 1000000, consentPolicyRead: true, consentTermsAccepted: true, consent4WD: true, consentDomesticOnly: true, customConditions: null, status: 'APPROVED', submittedAt: now, reviewedBy: 'admin', reviewedAt: now, issuedPolicyNo: 'POL-2025-0001' },
    { id: 14, bookingId: 3, seatBookingId: 14, beneficiaryName: 'นาง พรทิพย์ วงศ์สวัสดิ์', beneficiaryRelation: 'MOTHER', beneficiaryRelationOther: null, coverageAmount: 1000000, consentPolicyRead: true, consentTermsAccepted: true, consent4WD: true, consentDomesticOnly: true, customConditions: null, status: 'SUBMITTED', submittedAt: now },
    { id: 15, bookingId: 3, seatBookingId: 15, beneficiaryName: 'นาย ประเสริฐ นาคสมบูรณ์', beneficiaryRelation: 'FATHER', beneficiaryRelationOther: null, coverageAmount: 1000000, consentPolicyRead: true, consentTermsAccepted: true, consent4WD: false, consentDomesticOnly: true, customConditions: null, status: 'SUBMITTED', submittedAt: now },
    { id: 16, bookingId: 6, seatBookingId: 16, beneficiaryName: 'นาง สุมาลี ดำรงค์ธรรม', beneficiaryRelation: 'MOTHER', beneficiaryRelationOther: null, coverageAmount: 1000000, consentPolicyRead: true, consentTermsAccepted: true, consent4WD: false, consentDomesticOnly: true, customConditions: null, status: 'SUBMITTED', submittedAt: now },
  ]

  for (const f of ins) {
    await prisma.insuranceForm.create({ data: f })
  }
  console.log(`✅ InsuranceForms: ${ins.length} รายการ`)

  //  BookingSessions (flow  booking) 
  const bookingSessions = await Promise.all([
    //  session 1 -  trip 1 ()  step=5 (completed)
    prisma.bookingSession.create({ 
      data: { 
        id: 1, 
        token: 'session-samui-001', 
        busRoundId: 1, 
        step: 5, 
        selectedSeats: JSON.stringify([
          { seatNumber: 2, gender: 'MALE', firstName: '', lastName: '', phone: '0812345678', foodAllergy: '' },
          { seatNumber: 3, gender: 'FEMALE', firstName: '', lastName: '', phone: '0834567890', foodAllergy: null }
        ]), 
        customerData: JSON.stringify({
          mainName: ' ', 
          mainPhone: '0812345678', 
          email: 'somchai@email.com'
        }), 
        addonsData: JSON.stringify([
          { addonId: 1, quantity: 2 },
          { addonId: 2, quantity: 1 }
        ]), 
        bookingId: 1, 
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now 
      } 
    }),
    //  session 2 -  trip 1 ()  step=5 (completed)
    prisma.bookingSession.create({ 
      data: { 
        id: 2, 
        token: 'session-samui-002', 
        busRoundId: 1, 
        step: 5, 
        selectedSeats: JSON.stringify([
          { seatNumber: 4, gender: 'MALE', firstName: '', lastName: '', phone: '0876543210', foodAllergy: '' },
          { seatNumber: 5, gender: 'MALE', firstName: '', lastName: '', phone: '0856789012', foodAllergy: null }
        ]), 
        customerData: JSON.stringify({
          mainName: ' ', 
          mainPhone: '0876543210', 
          email: 'thanakorn@email.com'
        }), 
        addonsData: JSON.stringify([
          { addonId: 5, quantity: 2 }
        ]), 
        bookingId: 2, 
        expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000) // 8 days from now 
      } 
    }),
    //  session 3 -  trip 2 ()  step=3 (insurance)
    prisma.bookingSession.create({ 
      data: { 
        id: 3, 
        token: 'session-chiangmai-001', 
        busRoundId: 3, 
        step: 3, 
        selectedSeats: JSON.stringify([
          { seatNumber: 2, gender: 'MALE', firstName: '', lastName: '', phone: '0890123456', foodAllergy: null }
        ]), 
        customerData: JSON.stringify({
          mainName: ' ', 
          mainPhone: '0890123456', 
          email: 'piya@email.com'
        }), 
        addonsData: JSON.stringify([]), 
        bookingId: null, //  not created yet
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now 
      } 
    }),
    //  session 4 -  trip 4 ()  step=2 (passenger info)
    prisma.bookingSession.create({ 
      data: { 
        id: 4, 
        token: 'session-kanchan-001', 
        busRoundId: 4, 
        step: 2, 
        selectedSeats: JSON.stringify([
          { seatNumber: 2, gender: 'FEMALE', firstName: '', lastName: '', phone: '0891234567', foodAllergy: null }
        ]), 
        customerData: JSON.stringify({
          mainName: ' ', 
          mainPhone: '0891234567', 
          email: 'wipa@email.com'
        }), 
        addonsData: JSON.stringify([]), 
        bookingId: null, //  not created yet
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now 
      } 
    }),
    //  session 5 -  trip 1 ()  step=1 (seat selection)
    prisma.bookingSession.create({ 
      data: { 
        id: 5, 
        token: 'session-samui-003', 
        busRoundId: 2, 
        step: 1, 
        selectedSeats: JSON.stringify([
          { seatNumber: 7, gender: 'MALE', firstName: '', lastName: '', phone: '0888888888', foodAllergy: null }
        ]), 
        customerData: JSON.stringify({}), 
        addonsData: JSON.stringify([]), 
        bookingId: null, //  not created yet
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now 
      } 
    }),
  ])
  console.log(`✅ BookingSessions: ${bookingSessions.length} รายการ`)

  // ── Insurance Policy Content ──
  await prisma.insurancePolicyContent.create({
    data: {
      id: 1,
      contentType: 'text',
      textContent: `
        <h6 class="fw-bold">รายละเอียดความคุ้มครอง</h6>
        <p>1. คุ้มครองอุบัติเหตุวงเงินตามที่ระบุในตารางธรรมาภิบาล</p>
        <p>2. คุ้มครองค่ารักษาพยาบาลจากอุบัติเหตุระหว่างการเดินทาง</p>
        <p>3. ไม่คุ้มครองในกรณีที่เกิดจากความประมาทเลินเล่ออย่างร้ายแรงหรือการกระทำผิดกฎหมาย</p>
      `,
      imageUrl: null
    }
  })
  console.log('✅ InsurancePolicyContent: 1 รายการ')

  // ── Insurance Conditions ──
  await prisma.insuranceCondition.createMany({
    data: [
      { id: 1, title: 'ข้าพเจ้ายอมรับและตกลงตามเงื่อนไขความคุ้มครองที่บริษัทกำหนด', description: 'ยินยอมกรมธรรม์', iconClass: 'bi-check-circle-fill text-success', sortOrder: 1, isRequired: true, isActive: true },
      { id: 2, title: 'ข้าพเจ้ายืนยันว่าข้าพเจ้าและผู้เดินทางร่วมทริปมีสุขภาพแข็งแรงปกติ', description: 'ยืนยันสุขภาพ', iconClass: 'bi-heart-pulse text-danger', sortOrder: 2, isRequired: true, isActive: true },
      { id: 3, title: 'ข้าพเจ้ายินยอมให้ทางบริษัทเก็บข้อมูลส่วนบุคคลเพื่อการทำประกันภัยเท่านั้น', description: 'PDPA Consent', iconClass: 'bi-shield-check text-primary', sortOrder: 3, isRequired: true, isActive: true },
    ]
  })
  console.log('✅ InsuranceConditions: 3 รายการ')

  // ── Reset sequences (PostgreSQL SERIAL) ───────────────────────────────
  const seqs = [
    ['User', 4], ['Trip', 3], ['BusRound', 4], ['Booking', 8],
    ['Addon', 10], ['BookingAddon', 5], ['Payment', 6],
    ['Content', 3], ['Expense', 10], ['SeatBooking', 16], ['InsuranceForm', 16],
    ['InsuranceCondition', 3], ['BookingSession', 5],
  ]
  for (const [tbl, val] of seqs) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${tbl}"', 'id'), ${val})`
    )
  }
  console.log('✅ Reset sequences แล้ว')

  console.log('\n🎉 Seed เสร็จสมบูรณ์!')
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
