/**
 * Booking Flow API Test
 * ทดสอบ flow การจองที่นั่งทั้งหมด + re-booking + ตรวจบัตรประชาชนซ้ำ + slip orphan
 *
 * รัน: node test-booking-flow.js [roundId]
 */

const API = process.env.API_BASE_URL || 'http://localhost:5000/api'
const ROUND_ID = parseInt(process.argv[2] || '267')
const TEST_NATIONAL_ID = '1100100000001'   // เลขบัตรทดสอบ

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', cyan: '\x1b[36m',
  gray: '\x1b[90m', white: '\x1b[97m',
}
const ok      = (m) => console.log(`${C.green}  ✓${C.reset} ${m}`)
const fail    = (m) => console.log(`${C.red}  ✗${C.reset} ${m}`)
const info    = (m) => console.log(`${C.cyan}  →${C.reset} ${m}`)
const warn    = (m) => console.log(`${C.yellow}  !${C.reset} ${m}`)
const section = (t) => console.log(`\n${C.bold}${C.white}[ ${t} ]${C.reset}`)
const dim     = (m) => console.log(`${C.gray}    ${m}${C.reset}`)

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

// safe call: คาด error — return { ok: false, status, message }
async function apiSafe(method, path, body) {
  try {
    const data = await api(method, path, body)
    return { ok: true, data }
  } catch (e) {
    return { ok: false, status: e.status, message: e.message, data: e.data }
  }
}

function makePassenger(seatNumber, gender, nationalId) {
  return {
    seatNumber, gender,
    namePrefix: gender === 'MALE' ? 'นาย' : 'นางสาว',
    firstName: 'ทดสอบ', lastName: 'จองระบบ', nickname: 'test',
    phone: '0812345678', email: 'test@example.com',
    nationalId: nationalId || null,
    bloodType: 'A', foodType: 'ALL', drinkAlcohol: false,
    pickupPoint: 'ต้นทาง', emergencyName: 'ฉุกเฉิน', emergencyPhone: '0899999999',
  }
}

async function createFullBooking(seatNumbers, genders, nationalIds = []) {
  // สร้าง session
  const sess = await api('POST', '/booking-sessions', {
    busRoundId: ROUND_ID, step: 1,
    selectedSeats: seatNumbers.map((n, i) => ({ seatNumber: n, gender: genders[i] || 'MALE' }))
  })
  const token = sess.token

  // hold
  await api('POST', '/seat-bookings/hold', {
    busRoundId: ROUND_ID, seatNumbers, sessionToken: token
  })

  // passenger data
  const passengers = seatNumbers.map((n, i) =>
    makePassenger(n, genders[i] || 'MALE', nationalIds[i] || null)
  )
  await api('POST', '/booking-sessions', {
    token, step: 2, selectedSeats: passengers,
    customerData: { mainName: 'ทดสอบ จองระบบ', mainPhone: '0812345678' }
  })
  await api('POST', '/booking-sessions', { token, step: 3, addonsData: [] })

  // create booking
  const result = await api('POST', '/bookings/guest', { sessionToken: token, paymentType: 'DEPOSIT' })
  return { token, booking: result.booking, payment: result.payment }
}

// ════════════════════════════════════════════════════════
const results = []
function pass(step, msg) { results.push({ step, pass: true }); ok(msg) }
function failStep(step, msg) { results.push({ step, pass: false, error: msg }); fail(msg) }

async function run() {
  console.log(`\n${C.bold}${C.cyan}══════════════════════════════════════════════${C.reset}`)
  console.log(`${C.bold}${C.cyan}  Booking Flow Test  —  roundId: ${ROUND_ID}${C.reset}`)
  console.log(`${C.bold}${C.cyan}  API: ${API}${C.reset}`)
  console.log(`${C.bold}${C.cyan}══════════════════════════════════════════════${C.reset}`)

  // ─── STEP 1: ดึงที่นั่งว่าง ───────────────────────────────────────────────
  section('STEP 1 — ดึงสถานะที่นั่ง')
  let availableSeats = []
  try {
    const data = await api('GET', `/seat-bookings/round/${ROUND_ID}`)
    availableSeats = Object.values(data.seats || {})
      .filter(s => s.status === 'AVAILABLE').map(s => s.seatNumber)
    ok(`Round ${ROUND_ID}: ${data.passengerSeats} ที่นั่งผู้โดยสาร`)
    info(`ว่าง: ${availableSeats.join(', ') || 'ไม่มี'}`)
    Object.values(data.seats || {}).forEach(s => {
      const c = s.status === 'AVAILABLE' ? C.green : s.status === 'BOOKED' ? C.red : C.yellow
      dim(`${c}ที่นั่ง ${s.seatNumber}: ${s.status}${s.gender ? ` (${s.gender})` : ''}${C.reset}`)
    })
    pass('1', `โหลด seat status สำเร็จ`)
  } catch (e) {
    failStep('1', `GET seat-bookings/round: ${e.message}`)
    return printSummary()
  }

  if (availableSeats.length < 1) {
    failStep('1b', 'ไม่มีที่นั่งว่าง — หยุดทดสอบ')
    return printSummary()
  }
  const seat1 = availableSeats[0]
  const seat2 = availableSeats[1] || availableSeats[0]

  // ─── STEP 2: จองครั้งแรก (User A) ───────────────────────────────────────
  section('STEP 2 — User A จองที่นั่ง (Full Flow)')
  let tokenA, bookingA
  try {
    const r = await createFullBooking([seat1], ['MALE'], [TEST_NATIONAL_ID])
    tokenA = r.token; bookingA = r.booking
    ok(`User A จองที่นั่ง ${seat1} สำเร็จ (bookingId: ${bookingA.id})`)
    dim(`token: ${tokenA}`)
    dim(`payment slipUrl: ${r.payment?.slipUrl || 'null (ยังไม่แนบสลิป)'}`)
    pass('2', 'User A booking created')
  } catch (e) {
    failStep('2', `User A booking: ${e.message}`)
    return printSummary()
  }

  // ─── STEP 3: ตรวจสถานะ — ที่นั่งควรยังเป็น AVAILABLE (ไม่มีสลิป) ─────────
  section('STEP 3 — ตรวจ: ที่นั่ง ควรเป็น AVAILABLE (ยังไม่แนบสลิป)')
  try {
    const data = await api('GET', `/seat-bookings/round/${ROUND_ID}`)
    const s = data.seats[seat1]
    if (s?.status === 'AVAILABLE') {
      pass('3', `ที่นั่ง ${seat1}: AVAILABLE ✓ (ระบบ detect no-slip ถูกต้อง)`)
    } else {
      failStep('3', `ที่นั่ง ${seat1}: ${s?.status} (คาด AVAILABLE)`)
    }
  } catch (e) { failStep('3', e.message) }

  // ─── STEP 4: Re-booking (User B จองที่นั่งเดิม) ────────────────────────
  section('STEP 4 — User B จองที่นั่งเดิม (Re-booking — ยังไม่มีสลิป)')
  let tokenB, bookingB
  try {
    const r = await createFullBooking([seat1], ['FEMALE'])
    tokenB = r.token; bookingB = r.booking
    ok(`User B re-book ที่นั่ง ${seat1} สำเร็จ! (bookingId: ${bookingB.id})`)
    dim(`token B: ${tokenB}`)
    pass('4', 'Re-booking สำเร็จ ✓')
  } catch (e) {
    failStep('4', `Re-booking ล้มเหลว: ${e.message}`)
    if (e.data?.debug) dim(`debug: ${JSON.stringify(e.data.debug)}`)
  }

  // ─── STEP 5: User A พยายามแนบสลิป (ที่นั่งถูกแย่งไปแล้ว) ───────────────
  section('STEP 5 — User A พยายามแนบสลิป (คาด: 409 SEAT_TAKEN)')
  const r5 = await apiSafe('PATCH', `/payments/guest/${tokenA}`, {
    slipUrl: 'https://example.com/fake-slip.jpg'
  })
  if (!r5.ok && r5.data?.code === 'SEAT_TAKEN') {
    pass('5', `User A ได้รับแจ้ง: "${r5.message}" ✓ (SEAT_TAKEN)`)
  } else if (!r5.ok) {
    warn(`STEP 5: error แต่ code ไม่ใช่ SEAT_TAKEN — ${r5.message}`)
    results.push({ step: 5, pass: false, error: r5.message })
  } else {
    failStep('5', 'User A แนบสลิปสำเร็จทั้งที่ที่นั่งถูกแย่งไปแล้ว (ไม่ถูกต้อง)')
  }

  // ─── STEP 6: User B แนบสลิป (ล็อกที่นั่งถาวร) ──────────────────────────
  section('STEP 6 — User B แนบสลิป (ล็อกที่นั่ง)')
  try {
    const r = await api('PATCH', `/payments/guest/${tokenB}`, {
      slipUrl: 'https://example.com/test-slip-b.jpg'
    })
    ok(`User B แนบสลิปสำเร็จ (paymentId: ${r.id}, status: ${r.status})`)
    pass('6', 'Slip attached ✓')
  } catch (e) { failStep('6', e.message) }

  // ─── STEP 7: ตรวจสถานะ — ที่นั่งควร BOOKED ─────────────────────────────
  section('STEP 7 — ตรวจ: ที่นั่ง ควรเป็น BOOKED (หลังแนบสลิปแล้ว)')
  try {
    const data = await api('GET', `/seat-bookings/round/${ROUND_ID}`)
    const s = data.seats[seat1]
    if (s?.status === 'BOOKED') {
      pass('7', `ที่นั่ง ${seat1}: BOOKED ✓ (ล็อกถาวร)`)
    } else {
      failStep('7', `ที่นั่ง ${seat1}: ${s?.status} (คาด BOOKED)`)
    }
  } catch (e) { failStep('7', e.message) }

  // ─── STEP 8: User C พยายาม re-book (คาด: 409 จองแล้ว+มีสลิป) ─────────
  section('STEP 8 — User C พยายาม re-book (คาด: 409 เพราะมีสลิปแล้ว)')
  const r8 = await apiSafe('POST', '/seat-bookings/hold', {
    busRoundId: ROUND_ID, seatNumbers: [seat1], sessionToken: 'test-user-c-' + Date.now()
  })
  if (!r8.ok && r8.status === 409) {
    ok(`User C ถูกบล็อก 409 ✓ — ${r8.message}`)
    if (r8.data?.debug) dim(`reason: ${r8.data.debug[0]?.reason}`)
    pass('8', 'Hard lock after slip ✓')
  } else {
    failStep('8', `User C ควรได้ 409 แต่ได้ ${r8.ok ? 200 : r8.status}`)
  }

  // ─── STEP 9: ตรวจสอบ National ID ซ้ำ ────────────────────────────────────
  section('STEP 9 — National ID ซ้ำ (คาด: 409 DUPLICATE_ID)')
  if (availableSeats.length < 2) {
    warn('STEP 9: ข้ามเพราะไม่มีที่นั่งว่างพอ')
    results.push({ step: 9, pass: true })
  } else {
    // User D พยายามจองที่นั่ง 2 ด้วยเลขบัตรเดียวกับ User B ที่จองไปแล้ว (มีสลิป)
    const sessD = await api('POST', '/booking-sessions', {
      busRoundId: ROUND_ID, step: 1,
      selectedSeats: [{ seatNumber: seat2, gender: 'MALE' }]
    })
    await api('POST', '/seat-bookings/hold', {
      busRoundId: ROUND_ID, seatNumbers: [seat2], sessionToken: sessD.token
    })
    await api('POST', '/booking-sessions', {
      token: sessD.token, step: 2,
      selectedSeats: [makePassenger(seat2, 'MALE', TEST_NATIONAL_ID)],  // เลขบัตรซ้ำ
      customerData: { mainName: 'ซ้ำ ไอดี', mainPhone: '0811111111' }
    })
    await api('POST', '/booking-sessions', { token: sessD.token, step: 3, addonsData: [] })

    const r9 = await apiSafe('POST', '/bookings/guest', { sessionToken: sessD.token, paymentType: 'DEPOSIT' })
    if (!r9.ok && r9.data?.code === 'DUPLICATE_ID') {
      pass('9', `ตรวจจับเลขบัตรซ้ำ ✓ — "${r9.message}"`)
      dim(`duplicateIds: ${r9.data.duplicateIds?.join(', ')}`)
    } else if (!r9.ok) {
      warn(`STEP 9: error แต่ code ไม่ใช่ DUPLICATE_ID — ${r9.message} (${r9.data?.code})`)
      results.push({ step: 9, pass: false, error: r9.message })
    } else {
      failStep('9', 'ควร block เลขบัตรซ้ำ แต่จองผ่าน')
    }
  }

  printSummary()
}

function printSummary() {
  const passed = results.filter(r => r.pass).length
  const total = results.length
  const allPass = passed === total

  console.log(`\n${C.bold}${'─'.repeat(46)}${C.reset}`)
  console.log(`${C.bold}  ผลสรุป: ${passed}/${total} steps ผ่าน${C.reset}\n`)

  results.forEach(r => {
    const icon = r.pass ? `${C.green}✓${C.reset}` : `${C.red}✗${C.reset}`
    console.log(`  ${icon} Step ${r.step}: ${r.pass ? 'PASS' : `FAIL — ${r.error || ''}`}`)
  })

  console.log(`\n  ${allPass
    ? `${C.bold}${C.green}🎉 ทุก Step ผ่าน${C.reset}`
    : `${C.bold}${C.red}❌ มี Step ที่ไม่ผ่าน${C.reset}`
  }\n`)
}

run().catch(e => {
  console.error(`${C.red}Fatal:${C.reset}`, e.message)
  process.exit(1)
})
