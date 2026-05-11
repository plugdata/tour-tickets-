/**
 * Booking Flow API Test
 * ทดสอบ flow การจองที่นั่งทั้งหมด ตั้งแต่เลือกที่นั่งจนถึงสร้าง Booking
 *
 * รัน: node test-booking-flow.js
 * รัน roundId อื่น: node test-booking-flow.js 267
 */

const API = process.env.API_BASE_URL || 'http://localhost:5000/api'
const ROUND_ID = parseInt(process.argv[2] || '267')

// ── Terminal colors ──────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  white: '\x1b[97m',
}
const ok  = (msg) => console.log(`${C.green}  ✓${C.reset} ${msg}`)
const err = (msg) => console.log(`${C.red}  ✗${C.reset} ${msg}`)
const info = (msg) => console.log(`${C.cyan}  →${C.reset} ${msg}`)
const section = (title) => console.log(`\n${C.bold}${C.white}[ ${title} ]${C.reset}`)
const dim  = (msg) => console.log(`${C.gray}    ${msg}${C.reset}`)

// ── API helper ───────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw Object.assign(new Error(data.message || `HTTP ${res.status}`), { status: res.status, data })
  return data
}

// ── Test passenger data ──────────────────────────────────────────────────────
function makePassenger(seatNumber, gender) {
  return {
    seatNumber,
    gender,
    namePrefix: gender === 'MALE' ? 'นาย' : 'นางสาว',
    firstName: gender === 'MALE' ? 'ทดสอบ' : 'ทดสอบ',
    lastName: 'จองระบบ',
    nickname: 'test',
    phone: '0812345678',
    email: 'test@example.com',
    bloodType: 'A',
    foodType: 'ALL',
    drinkAlcohol: false,
    pickupPoint: 'ต้นทาง',
    emergencyName: 'ผู้ติดต่อฉุกเฉิน',
    emergencyPhone: '0899999999',
  }
}

// ── Main test ────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n${C.bold}${C.cyan}═══════════════════════════════════════════════${C.reset}`)
  console.log(`${C.bold}${C.cyan}  Booking Flow Test  —  roundId: ${ROUND_ID}${C.reset}`)
  console.log(`${C.bold}${C.cyan}  API: ${API}${C.reset}`)
  console.log(`${C.bold}${C.cyan}═══════════════════════════════════════════════${C.reset}`)

  const results = []

  // ─── STEP 1: ดึงสถานะที่นั่ง ─────────────────────────────────────────────
  section('STEP 1 — ดึงสถานะที่นั่ง')
  let availableSeats = []
  try {
    const data = await api('GET', `/seat-bookings/round/${ROUND_ID}`)
    availableSeats = Object.values(data.seats || {})
      .filter(s => s.status === 'AVAILABLE')
      .map(s => s.seatNumber)

    ok(`Round ${ROUND_ID} โหลดสำเร็จ — totalSeats: ${data.totalSeats}, passengerSeats: ${data.passengerSeats}`)
    info(`ที่นั่งว่าง (AVAILABLE): ${availableSeats.join(', ') || 'ไม่มี'}`)
    info(`ที่นั่งทั้งหมด:`)
    Object.values(data.seats || {}).forEach(s => {
      const badge = s.status === 'AVAILABLE' ? C.green : s.status === 'BOOKED' ? C.red : C.yellow
      dim(`${badge}ที่นั่ง ${s.seatNumber}: ${s.status}${s.gender ? ` (${s.gender})` : ''}${C.reset}`)
    })
    results.push({ step: 1, pass: true })
  } catch (e) {
    err(`GET /seat-bookings/round/${ROUND_ID} → ${e.message}`)
    results.push({ step: 1, pass: false, error: e.message })
    return printSummary(results)
  }

  if (availableSeats.length < 2) {
    err(`ไม่มีที่นั่งว่างเพียงพอ (ต้องการ 2 ที่นั่ง, มี ${availableSeats.length})`)
    results.push({ step: '1b', pass: false, error: 'ไม่มีที่นั่งว่าง' })
    return printSummary(results)
  }

  const chosenSeats = [availableSeats[0], availableSeats[1]]
  ok(`เลือกที่นั่ง: ${chosenSeats.join(', ')}`)

  // ─── STEP 2: สร้าง session ───────────────────────────────────────────────
  section('STEP 2 — สร้าง Booking Session')
  let sessionToken
  try {
    const session = await api('POST', '/booking-sessions', {
      busRoundId: ROUND_ID,
      step: 1,
      selectedSeats: [
        { seatNumber: chosenSeats[0], gender: 'MALE' },
        { seatNumber: chosenSeats[1], gender: 'FEMALE' },
      ]
    })
    sessionToken = session.token
    ok(`Session สร้างสำเร็จ`)
    dim(`token: ${sessionToken}`)
    dim(`expiresAt: ${session.expiresAt}`)
    results.push({ step: 2, pass: true })
  } catch (e) {
    err(`POST /booking-sessions → ${e.message}`)
    results.push({ step: 2, pass: false, error: e.message })
    return printSummary(results)
  }

  // ─── STEP 3: Hold ที่นั่ง ────────────────────────────────────────────────
  section('STEP 3 — Hold ที่นั่ง (ล็อคชั่วคราว 10 นาที)')
  try {
    const hold = await api('POST', '/seat-bookings/hold', {
      busRoundId: ROUND_ID,
      seatNumbers: chosenSeats,
      sessionToken,
    })
    ok(`Hold สำเร็จ — หมดอายุ: ${new Date(hold.expiresAt).toLocaleTimeString('th-TH')}`)
    results.push({ step: 3, pass: true })
  } catch (e) {
    err(`POST /seat-bookings/hold → ${e.message}`)
    if (e.data?.takenSeats) info(`ที่นั่งที่ถูกจองไปแล้ว: ${e.data.takenSeats.join(', ')}`)
    results.push({ step: 3, pass: false, error: e.message })
    return printSummary(results)
  }

  // ─── STEP 4: บันทึกข้อมูลผู้โดยสาร ─────────────────────────────────────
  section('STEP 4 — บันทึกข้อมูลผู้โดยสารลง Session (step 2)')
  const passengers = [
    makePassenger(chosenSeats[0], 'MALE'),
    makePassenger(chosenSeats[1], 'FEMALE'),
  ]
  try {
    await api('POST', '/booking-sessions', {
      token: sessionToken,
      step: 2,
      selectedSeats: passengers,
      customerData: {
        mainName: 'ทดสอบ จองระบบ',
        mainPhone: '0812345678',
        foodAllergy: 'ไม่มี',
      }
    })
    ok(`บันทึกข้อมูลผู้โดยสาร ${passengers.length} คน สำเร็จ`)
    passengers.forEach(p => dim(`ที่นั่ง ${p.seatNumber}: ${p.namePrefix}${p.firstName} ${p.lastName} (${p.gender})`))
    results.push({ step: 4, pass: true })
  } catch (e) {
    err(`PATCH session (passenger data) → ${e.message}`)
    results.push({ step: 4, pass: false, error: e.message })
    return printSummary(results)
  }

  // ─── STEP 5: บันทึก addons (ข้าม — ใช้ว่างเปล่า) ──────────────────────
  section('STEP 5 — บันทึก Addons (ข้าม — ไม่มี addon)')
  try {
    await api('POST', '/booking-sessions', {
      token: sessionToken,
      step: 3,
      addonsData: []
    })
    ok('บันทึก addons (ว่าง) สำเร็จ')
    results.push({ step: 5, pass: true })
  } catch (e) {
    err(`PATCH session (addons) → ${e.message}`)
    results.push({ step: 5, pass: false, error: e.message })
  }

  // ─── STEP 6: สร้าง Booking (Guest) ─────────────────────────────────────
  section('STEP 6 — สร้าง Guest Booking (DEPOSIT)')
  let booking, payment
  try {
    const result = await api('POST', '/bookings/guest', {
      sessionToken,
      paymentType: 'DEPOSIT'
    })
    booking = result.booking
    payment = result.payment
    ok(`Booking สร้างสำเร็จ! 🎉`)
    dim(`bookingId: ${booking.id}`)
    dim(`status: ${booking.status}`)
    dim(`seats: ${booking.seats}`)
    dim(`totalAmount: ฿${booking.totalAmount?.toLocaleString('th-TH')}`)
    dim(`paymentId: ${payment?.id}`)
    dim(`paymentAmount: ฿${payment?.amount?.toLocaleString('th-TH')}`)
    dim(`paymentStatus: ${payment?.status}`)
    results.push({ step: 6, pass: true })
  } catch (e) {
    err(`POST /bookings/guest → ${e.message}`)
    if (e.data) dim(JSON.stringify(e.data))
    results.push({ step: 6, pass: false, error: e.message })
    return printSummary(results)
  }

  // ─── STEP 7: ยืนยันผลด้วย GET booking ──────────────────────────────────
  section('STEP 7 — ยืนยัน: ตรวจสอบ Seat Status หลัง Booking')
  try {
    const data = await api('GET', `/seat-bookings/round/${ROUND_ID}`)
    let allGood = true
    for (const sn of chosenSeats) {
      const s = data.seats[sn]
      // Seats without slip → still AVAILABLE (by our new logic)
      const statusOk = s?.status === 'AVAILABLE' || s?.status === 'BOOKED'
      if (statusOk) {
        ok(`ที่นั่ง ${sn}: ${s.status} ✓`)
      } else {
        err(`ที่นั่ง ${sn}: ${s?.status || 'ไม่พบ'} (ไม่คาดหวัง)`)
        allGood = false
      }
    }
    results.push({ step: 7, pass: allGood })
  } catch (e) {
    err(`ตรวจสอบ seat status → ${e.message}`)
    results.push({ step: 7, pass: false, error: e.message })
  }

  // ─── STEP 8: ทดสอบ Re-booking (feature หลัก) ───────────────────────────
  section('STEP 8 — ทดสอบ Re-booking (ยังไม่แนบสลิป → ควรจองซ้ำได้)')
  try {
    const session2 = await api('POST', '/booking-sessions', {
      busRoundId: ROUND_ID,
      step: 1,
      selectedSeats: [{ seatNumber: chosenSeats[0], gender: 'MALE' }]
    })
    const token2 = session2.token
    info(`Session 2 token: ${token2}`)

    const hold2 = await api('POST', '/seat-bookings/hold', {
      busRoundId: ROUND_ID,
      seatNumbers: [chosenSeats[0]],
      sessionToken: token2,
    })
    ok(`Re-booking ที่นั่ง ${chosenSeats[0]} สำเร็จ (ยังไม่แนบสลิป → ระบบปลดให้)`)
    dim(`hold expires: ${new Date(hold2.expiresAt).toLocaleTimeString('th-TH')}`)

    // ปล่อย hold นี้คืน (cleanup)
    await api('DELETE', `/seat-bookings/hold/${token2}`)
    dim('ปล่อย hold test กลับคืนแล้ว')
    results.push({ step: 8, pass: true })
  } catch (e) {
    err(`Re-booking → ${e.message}`)
    results.push({ step: 8, pass: false, error: e.message })
  }

  printSummary(results, { bookingId: booking?.id, sessionToken })
}

function printSummary(results, extra = {}) {
  const passed = results.filter(r => r.pass).length
  const total = results.length
  const allPass = passed === total

  console.log(`\n${C.bold}${'─'.repeat(47)}${C.reset}`)
  console.log(`${C.bold}  ผลสรุป: ${passed}/${total} steps ผ่าน${C.reset}`)

  results.forEach(r => {
    const icon = r.pass ? `${C.green}✓${C.reset}` : `${C.red}✗${C.reset}`
    const msg = r.pass ? 'PASS' : `FAIL — ${r.error || ''}`
    console.log(`  ${icon} Step ${r.step}: ${msg}`)
  })

  if (extra.bookingId) {
    console.log(`\n${C.cyan}  Booking ID: ${extra.bookingId}${C.reset}`)
    console.log(`${C.cyan}  Session Token: ${extra.sessionToken}${C.reset}`)
  }

  console.log(`\n  ${allPass
    ? `${C.bold}${C.green}🎉 ทุก Step ผ่าน — ระบบจองทำงานปกติ${C.reset}`
    : `${C.bold}${C.red}❌ มีบาง Step ไม่ผ่าน — ดู log ด้านบน${C.reset}`
  }\n`)
}

run().catch(e => {
  console.error(`${C.red}Fatal:${C.reset}`, e.message)
  process.exit(1)
})
