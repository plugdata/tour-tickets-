import { apiFetch } from '/src/api/config.js'

// ════════════════════════════════════════════════════════════
// BOOKING FLOW:
//   [STEP 0] /trips        — เลือกรอบออกเดินทาง (หน้านี้)
//   [STEP 1] /booking/seats — เลือกที่นั่ง + เพศ (seatchart.js)
//   [STEP 2] /booking/form  — กรอกข้อมูลผู้โดยสาร
//   [STEP 3] /booking/payment — ชำระเงิน
//   [DONE]  /booking/ticket — ตั๋วยืนยัน
// ════════════════════════════════════════════════════════════

const MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const ROWS_LABEL = 'ABCDEFGHIJKLMNOP'.split('')

// ── state ─────────────────────────────────────────────────
const now = new Date()
let curYear = now.getFullYear()
let curMonth = now.getMonth()
let allRounds = []
let tripCache = new Map()
let selectedRound = null

// ── Unified interactive seat selection (desktop + mobile) ────
let selSeats = {}    // { seatNum: 'MALE'|'FEMALE' }
let gsPending = null  // { num, label } awaiting gender confirm
let gsPicked = null  // gender picked in sheet (pre-confirm)
let selApiData = null  // { totalSeats, apiSeats }
let selRound = null  // current round object
let selTrip = null  // current trip object
let selTarget = null  // 'mobile' | 'desktop'

// ── month select ──────────────────────────────────────────
const monthSel = document.getElementById('monthSelect')
if (monthSel) {
  MONTHS_TH.forEach((m, i) => {
    const o = document.createElement('option')
    o.value = i; o.textContent = m; monthSel.appendChild(o)
  })
}

function updateDisplay() {
  const yearDisp = document.getElementById('yearDisplay')
  if (yearDisp) yearDisp.textContent = curYear
  if (monthSel) monthSel.value = curMonth
}

window.changeYear = d => { curYear += d; updateDisplay(); loadData() }
window.changeMonth = d => {
  curMonth += d
  if (curMonth < 0) { curMonth = 11; curYear-- }
  if (curMonth > 11) { curMonth = 0; curYear++ }
  updateDisplay(); loadData()
}
window.onMonthChange = () => { curMonth = +monthSel?.value; updateDisplay(); loadData() }
updateDisplay()

// ════════════════════════════════════════════════════════════
// [STEP 0] LOAD ROUNDS — แสดงรายการรอบออกเดินทางในเดือนนั้น
// ════════════════════════════════════════════════════════════
async function loadData(search = '') {
  showSkeletons()
  selectedRound = null
  resetBookingCard()

  try {
    let rounds, trips

    if (search) {
      // ── search mode: ค้นหาจากชื่อทริป ──
      trips = await apiFetch(`/trips?search=${encodeURIComponent(search)}&active=true`)
      const tripIds = trips.map(t => t.id)
      if (!tripIds.length) { allRounds = []; renderList([]); return }
      rounds = await apiFetch(`/bus-rounds?month=${curMonth}&year=${curYear}`)
      rounds = rounds.filter(r => tripIds.includes(r.tripId))
      for (const t of trips) tripCache.set(t.id, t)
      const listLabel = document.getElementById('listLabel')
      if (listLabel) listLabel.textContent = `ผลการค้นหา "${search}"`
    } else {
      // ── normal mode: โหลดรอบทั้งหมดของเดือน ──
      ;[rounds, trips] = await Promise.all([
        apiFetch(`/bus-rounds?month=${curMonth}&year=${curYear}`),
        apiFetch('/trips?active=true'),
      ])
      for (const t of trips) tripCache.set(t.id, t)
      const listLabel = document.getElementById('listLabel')
      if (listLabel) listLabel.textContent =
        `รอบออกเดินทาง ${MONTHS_TH[curMonth]} ${curYear}`
    }

    // เรียงตามวันออกเดินทาง
    rounds.sort((a, b) => new Date(a.departDate) - new Date(b.departDate))
    allRounds = rounds
    renderList(rounds)
  } catch (e) {
    const roundList = document.getElementById('roundList')
    if (roundList) {
      roundList.innerHTML =
        '<div class="list-empty"><i class="bi bi-exclamation-circle"></i><p>โหลดข้อมูลไม่ได้</p></div>'
    }
  }
}

// ── render round list ─────────────────────────────────────
function renderList(rounds) {
  const el = document.getElementById('roundList')
  const countEl = document.getElementById('listCount')
  if (countEl) countEl.textContent = rounds.length ? `${rounds.length} รอบ` : ''

  if (!el) return

  if (!rounds.length) {
    el.innerHTML = `<div class="list-empty">
  <i class="bi bi-calendar-x"></i>
  <p>ไม่มีรอบออกเดินทาง<br>ในเดือน${MONTHS_TH[curMonth]} ${curYear}</p>
</div>`
    return
  }

  // จัดกลุ่มตามทริป
  const grouped = new Map()
  for (const r of rounds) {
    if (!grouped.has(r.tripId)) grouped.set(r.tripId, { trip: tripCache.get(r.tripId), rounds: [] })
    grouped.get(r.tripId).rounds.push(r)
  }

  let html = ''
  for (const [tripId, { trip, rounds: tRounds }] of grouped) {
    const tripTitle = trip?.title || `ทริป #${tripId}`
    const isIntl = trip?.tripType === 'INTERNATIONAL'

    html += `<div class="list-divider">
  <span style="color:${isIntl ? '#ff9f43' : 'var(--primary)'}">
    <i class="bi bi-${isIntl ? 'globe' : 'flag-fill'} me-1"></i>${tripTitle}
  </span>
</div>`

    for (const r of tRounds) {
      const left = r.totalSeats - r.bookedSeats
      const pct = Math.round(r.bookedSeats / r.totalSeats * 100)
      const full = left <= 0 || !r.isOpen
      const isLow = !full && pct >= 60
      const dotCls = full ? 'dot-full' : isLow ? 'dot-low' : 'dot-ok'
      const dept = new Date(r.departDate)
      const dateStr = dept.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
      const price = trip ? Number(trip.price + (r.extraPrice || 0)) : 0
      const passengerTotal = r.totalSeats - 1   // seat 1 = Staff, seats 2..totalSeats = ผู้โดยสาร
      const passengerLeft = passengerTotal - r.bookedSeats

      const badgeHtml = full
        ? `<span class="round-badge badge-full">เสร็จ</span>`
        : isLow
          ? `<span class="round-badge badge-low">ใกล้เต็ม</span>`
          : `<span class="round-badge badge-price">฿${price.toLocaleString()}</span>`

      html += `
    <div class="round-row${full ? ' is-full' : ''}" id="rr-${r.id}"
         onclick="${full ? '' : `selectRound(${r.id})`}" data-round-id="${r.id}">
      <div class="round-dot ${dotCls}"></div>
      <div class="round-info">
        <div class="round-row-top">
          <span class="r-time-tag">${dateStr}</span>
          <span class="r-trip-tag">${tripTitle}</span>
        </div>
        <div class="round-row-bot">
          ${r.duration ? `<span class="r-dur-tag"><i class="bi bi-clock" style="font-size:.6rem"></i> ${r.duration}</span>` : ''}
          <span class="r-seats-tag"><i class="bi bi-person-fill" style="font-size:.65rem"></i> ${passengerLeft}/${passengerTotal}</span>
        </div>
      </div>
      ${badgeHtml}
    </div>`
    }
  }

  el.innerHTML = html
}

function showSkeletons() {
  const roundList = document.getElementById('roundList')
  if (!roundList) return
  roundList.innerHTML = Array.from({ length: 8 }, () => `
<div class="skel-row">
  <div class="skel-dot"></div>
  <div style="flex:1">
    <div class="skel-line mb-1" style="height:11px;width:${40 + Math.random() * 40}%"></div>
    <div class="skel-line"      style="height:9px; width:${30 + Math.random() * 30}%"></div>
  </div>
  <div class="skel-line" style="height:20px;width:55px;border-radius:20px"></div>
</div>`).join('')
  const countEl = document.getElementById('listCount')
  if (countEl) countEl.textContent = ''
}

// ════════════════════════════════════════════════════════════
// [STEP 0 → STEP 1] SELECT ROUND
// desktop  → อัปเดต right panel (white card)
// mobile   → เปิด full-screen overlay
// ════════════════════════════════════════════════════════════
window.selectRound = function (roundId) {
  document.querySelectorAll('.round-row').forEach(el => el.classList.remove('selected'))
  document.getElementById(`rr-${roundId}`)?.classList.add('selected')

  const round = allRounds.find(r => r.id === roundId)
  if (!round) return
  selectedRound = round
  selSeats = {}
  selRound = round
  selTrip = tripCache.get(round.tripId)

  // Render immediately with estimated seat data — no API wait
  const estApiSeats = buildEstApiSeats(round.bookedSeats, round.totalSeats)
  selApiData = { totalSeats: round.totalSeats, apiSeats: estApiSeats }

  if (window.innerWidth < 768) {
    selTarget = 'mobile'
    renderSelCard(round, selTrip, round.totalSeats, estApiSeats)
    openMobileOverlay(round, selTrip)
  } else {
    selTarget = 'desktop'
    renderSelCard(round, selTrip, round.totalSeats, estApiSeats)
  }

  // Upgrade with real seat data in background
  apiFetch(`/seat-bookings/round/${round.id}`)
    .then(data => {
      if (selectedRound?.id !== roundId) return
      const apiSeats = data.seats || {}
      const totalSeats = data.totalSeats || round.totalSeats
      selApiData = { totalSeats, apiSeats }
      renderSelCard(round, selTrip, totalSeats, apiSeats)
    })
    .catch(() => { })
}

// ════════════════════════════════════════════════════════════
// BUILD BOOKING CARD CONTENT
// ใช้ได้ทั้ง desktop (bkCard) และ mobile overlay (mCard)
// ════════════════════════════════════════════════════════════
function buildCardHTML(round, trip) {
  const dept = new Date(round.departDate)
  const dateStr = dept.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = dept.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  const left = round.totalSeats - round.bookedSeats
  const pct = Math.round(round.bookedSeats / round.totalSeats * 100)
  const full = left <= 0 || !round.isOpen
  const barCls = pct >= 90 ? 'full' : pct >= 60 ? 'low' : 'ok'
  const price = trip ? Number(trip.price + (round.extraPrice || 0)) : 0
  const deposit = trip?.deposit || 0

  // [VISUAL] Static seat grid — preview เท่านั้น ไม่ interactive
  // การเลือกที่นั่งจริงจะทำใน /booking/seats (STEP 1)
  const seatHtml = buildSeatGrid(round.totalSeats, round.bookedSeats)

  return `
<!-- Header -->
<div class="bk-header">
  <button class="bk-back" onclick="deselectRound()">
    <i class="bi bi-chevron-left"></i>
  </button>
  <div class="bk-header-text">
    <div class="bk-header-title">เลือกที่นั่ง</div>
    <div class="bk-header-sub">${trip?.title || ''} · รถคันที่ ${round.busNumber || 1}</div>
  </div>
</div>

<!-- Price info -->
<div class="bk-price-bar">
  <div class="bk-price-left">ราคาต่อที่นั่ง</div>
  <div style="text-align:right">
    <div class="bk-price-main">฿${price.toLocaleString()}</div>
    ${deposit ? `<div class="bk-price-dep">มัดจำ ฿${Number(deposit).toLocaleString()}/ที่นั่ง</div>` : ''}
  </div>
</div>

<!-- [VISUAL PREVIEW] Static seat layout — not interactive
     Seat selection happens on /booking/seats page (STEP 1) -->
<div class="bk-seat-area">
  <div class="seat-staff-row">
    <div class="seat-staff-box"><i class="bi bi-person-badge-fill"></i>STAFF</div>
    <div style="flex:1"></div>
    <div class="seat-driver-box"><i class="bi bi-person-workspace"></i>DRIVER</div>
  </div>
  <div class="seat-grid">${seatHtml}</div>
</div>

<!-- Legend -->
<div class="seat-legend">
  <div class="legend-item"><div class="legend-dot ld-avail"></div>ว่าง</div>
  <div class="legend-item"><div class="legend-dot ld-fem"></div>♀ จองแล้ว</div>
  <div class="legend-item"><div class="legend-dot ld-mal"></div>♂ จองแล้ว</div>
</div>

<!-- Footer -->
<div class="bk-footer">
  <div class="bk-footer-meta">
    <div class="bk-meta-date"><i class="bi bi-calendar3 me-1"></i>${dateStr} · ${timeStr}</div>
    <div class="bk-meta-seats ${barCls}">เหลือ ${left}/${round.totalSeats}</div>
  </div>
  <div class="bk-bar"><div class="bk-bar-fill ${barCls}" style="width:${pct}%"></div></div>

<!-- [ACTION] คลิก → ไป STEP 1 (/booking/seats) เพื่อเลือกที่นั่งจริง -->
  <button class="bk-btn-book" ${full ? 'disabled' : ''}
          onclick="goToSeatSelection(${round.id})">
    ${full
      ? 'ที่นั่งเต็มแล้ว'
      : '<i class="bi bi-ticket-perforated"></i>จองทริปนี้เลย'}
  </button>
</div>`
}

function updateBookingCard(round, trip, targetId) {
  const el = document.getElementById(targetId)
  if (el) el.innerHTML = buildCardHTML(round, trip)
}

// ── static seat grid (visual preview only) ────────────────
function buildSeatGrid(total, booked) {
  const maxShow = 18
  const showCount = Math.min(total, maxShow)
  const seats = []

  for (let i = 0; i < showCount; i++) {
    const row = ROWS_LABEL[Math.floor(i / 3)]
    const col = (i % 3) + 1
    const label = `${row}${col}`

    if (i < booked) {
      // สลับสีหญิง/ชาย เพื่อ visual เท่านั้น
      const cls = i % 2 === 0 ? 's-fem' : 's-mal'
      seats.push(`<div class="seat-box ${cls}"><i class="bi bi-person-fill"></i><span>${label}</span></div>`)
    } else {
      seats.push(`<div class="seat-box s-avail"><i class="bi bi-person" style="opacity:.3"></i><span>${label}</span></div>`)
    }
  }

  if (total > maxShow) {
    const more = total - maxShow
    seats.push(`<div class="seat-box s-more" style="grid-column:span 3;aspect-ratio:auto;padding:.4rem;font-size:.72rem">+${more} ที่นั่ง</div>`)
  }

  return seats.join('')
}

function resetBookingCard() {
  const el = document.getElementById('bkCard')
  if (!el) return
  el.innerHTML = `
<div class="bk-empty">
  <div class="bk-empty-icon"><i class="bi bi-compass-fill"></i></div>
  <h3>เลือกทริปที่คุณสนใจ</h3>
  <p>เลือกรอบออกเดินทางจากรายการด้านซ้าย<br>เพื่อดูข้อมูลและจองที่นั่ง</p>
  <div class="bk-empty-hint"><i class="bi bi-arrow-left"></i> คลิกเลือกรอบจากรายการ</div>
</div>`
}

window.deselectRound = function () {
  selectedRound = null
  document.querySelectorAll('.round-row').forEach(el => el.classList.remove('selected'))
  resetBookingCard()
  closeMobileOverlay()
}

// ════════════════════════════════════════════════════════════
// [FLOW ACTION] ไป STEP 1: /booking/seats
// seats.html จะ:
//   • แสดง seatchart.js ที่นั่งจริง
//   • สร้าง booking session
//   • navigate ไป /booking/form?token=xxx (STEP 2)
// ════════════════════════════════════════════════════════════
window.goToSeatSelection = function (roundId) {
  // → STEP 1: เลือกที่นั่ง
  window.location.href = `/booking/seats?roundId=${roundId}`
}

// ════════════════════════════════════════════════════════════
// MOBILE OVERLAY — full-screen slide-up
// แสดง: step bar + ข้อมูลรอบ + seat preview + ปุ่มจอง
// ════════════════════════════════════════════════════════════
function openMobileOverlay(round, trip) {
  const titleEl = document.getElementById('mNavTitle')
  if (titleEl) titleEl.textContent = trip?.title || 'รายละเอียดทริป'
  const overlay = document.getElementById('mOverlay')
  if (overlay) overlay.classList.add('open')
  document.body.style.overflow = 'hidden'
}

window.closeMobileOverlay = function () {
  const overlay = document.getElementById('mOverlay')
  if (overlay) overlay.classList.remove('open')
  document.body.style.overflow = ''
}

// swipe down to close mobile overlay
const mOverlay = document.getElementById('mOverlay')
if (mOverlay) {
  let _sy = 0
  mOverlay.addEventListener('touchstart', e => { _sy = e.touches[0].clientY }, { passive: true })
  mOverlay.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientY - _sy > 80) closeMobileOverlay()
  })
}

// ════════════════════════════════════════════════════════════
// INTERACTIVE SEAT SELECTION — desktop + mobile unified
// ════════════════════════════════════════════════════════════

// Build estimated seat data for immediate render (no API wait)
function buildEstApiSeats(bookedCount, totalSeats) {
  const apiSeats = {}
  for (let i = 0; i < Math.min(bookedCount, totalSeats); i++) {
    apiSeats[i + 2] = { status: 'BOOKED', gender: i % 2 === 0 ? 'FEMALE' : 'MALE' }
  }
  return apiSeats
}

function buildSelGrid(totalSeats, apiSeats) {
  const maxShow = 18
  const showCount = Math.min(totalSeats, maxShow)
  const seats = []

  for (let i = 0; i < showCount; i++) {
    const seatNum = i + 2
    const label = String(seatNum)
    const api = apiSeats[seatNum]
    const mySel = selSeats[seatNum]

    if (api && api.status === 'BOOKED') {
      const cls = api.gender === 'FEMALE' ? 's-fem' : 's-mal'
      seats.push(`<div class="seat-box ${cls}"><i class="bi bi-person-fill"></i><span>${label}</span></div>`)
    } else if (mySel) {
      const cls = mySel === 'FEMALE' ? 's-sel-f' : 's-sel-m'
      const gIcon = mySel === 'FEMALE' ? '♀' : '♂'
      seats.push(`<div class="seat-box ${cls}" onclick="seatToggle(${seatNum})"><span style="font-size:.85rem;line-height:1">${gIcon}</span><span>${label}</span></div>`)
    } else {
      seats.push(`<div class="seat-box s-avail m-pick" onclick="seatClick(${seatNum},'${label}')"><i class="bi bi-person" style="opacity:.3"></i><span>${label}</span></div>`)
    }
  }

  if (totalSeats > maxShow) {
    seats.push(`<div class="seat-box s-more" style="grid-column:span 3;aspect-ratio:auto;padding:.4rem;font-size:.72rem">+${totalSeats - maxShow} ที่นั่ง</div>`)
  }
  return seats.join('')
}

function renderSelCard(round, trip, totalSeats, apiSeats) {
  const targetId = selTarget === 'mobile' ? 'mCard' : 'bkCard'
  const targetEl = document.getElementById(targetId)
  if (!targetEl) return

  const dept = new Date(round.departDate)
  const dateStr = dept.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = dept.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  const booked = Object.values(apiSeats).filter(s => s.status === 'BOOKED').length
  const left = totalSeats - booked
  const pct = Math.round(booked / totalSeats * 100)
  const full = left <= 0 || !round.isOpen
  const statusCls = pct >= 90 ? 'full' : pct >= 60 ? 'low' : 'ok'
  const statusTxt = full ? 'รอบนี้เต็มแล้ว' : statusCls === 'low' ? 'ใกล้เต็มแล้ว' : 'ว่างพร้อมจอง'
  const price = trip ? Number(trip.price + (round.extraPrice || 0)) : 0
  const deposit = trip?.deposit || 0

  targetEl.innerHTML = `
<!-- Formal Header -->
<div class="bk-header-main">
  <button class="bk-back" style="position:absolute; left:1rem; top:1.2rem;" onclick="deselectRound()">
    <i class="bi bi-chevron-left"></i>
  </button>
  <div style="padding-left: 2.2rem;">
    <div class="bk-trip-name">${trip?.title || 'ไม่มีชื่อทริป'}</div>
    <div class="bk-bus-info">
      <i class="bi bi-truck-front"></i> ยานพาหนะ: รถบัสคันที่ ${round.busNumber || 1}
    </div>
  </div>
</div>

<!-- Brief Info Grid -->
<div class="bk-info-grid">
  <div class="bk-info-item">
    <div class="bk-info-label">ชื่อรอบ</div>
    <div class="bk-info-value">${round.roudeStack?.roundname || '—'}</div>
  </div>
  <div class="bk-info-item">
    <div class="bk-info-label">ระยะเวลา</div>
    <div class="bk-info-value">${round.duration || '—'}</div>
  </div>
  <div class="bk-info-item">
    <div class="bk-info-label">ที่ว่างคงเหลือ</div>
    <div class="bk-info-value">${left} / ${totalSeats} ที่นั่ง</div>
  </div>
</div>

<!-- Pricing Summary -->
<div class="bk-pricing-section">
  <div class="bk-price-row">
    <div class="bk-price-label">ค่าบริการต่อท่าน</div>
    <div class="bk-price-main-val">฿${price.toLocaleString()}</div>
  </div>
  ${deposit ? `
  <div class="bk-deposit-sub">
    ชำระมัดจำเพียง ฿${Number(deposit).toLocaleString()} ต่อที่นั่ง
  </div>` : ''}
</div>



<div id="selBar" style="display:none; padding:1rem 1.2rem; background:#f0fdf4; border-top:1px solid #d1fae5; justify-content:space-between; align-items:center;"></div>

  <div class="bk-footer-premium">
    <div class="bk-bar" style="margin-bottom:1.2rem;"><div class="bk-bar-fill ${statusCls}" style="width:${pct}%"></div></div>
    
    <button class="bk-btn-booking" ${full ? 'disabled' : ''} onclick="seatProceed(${round.id})">
      ${full ? 'ที่นั่งเต็มแล้ว' : '<i class="bi bi-ticket-perforated-fill"></i> จองทริปนี้เลย'}
    </button>
  </div>`
}

function refreshSelGrid() {
  if (!selApiData) return
  const { totalSeats, apiSeats } = selApiData
  const grid = document.getElementById('selGrid')
  if (grid) grid.innerHTML = buildSelGrid(totalSeats, apiSeats)

  const cnt = Object.keys(selSeats).length
  const bar = document.getElementById('selBar')
  if (!bar) return

  if (cnt > 0) {
    const price = selTrip ? Number(selTrip.price + (selRound?.extraPrice || 0)) : 0
    bar.style.display = 'flex'
    bar.innerHTML = `
  <div style="display:flex; flex-direction:column;">
    <span style="font-size:.7rem; font-weight:700; color:#047857; text-transform:uppercase;">ที่นั่งที่เลือก</span>
    <span style="font-size:.9rem; font-weight:800; color:#047857;">${cnt} ที่นั่ง</span>
  </div>
  <div style="text-align:right;">
    <span style="font-size:.7rem; font-weight:700; color:#047857; text-transform:uppercase;">รวมเป็นเงิน</span>
    <div style="font-size:1.1rem; font-weight:800; color:#059669;">฿${(price * cnt).toLocaleString()}</div>
  </div>`
  } else {
    bar.style.display = 'none'
  }
}

// ── Gender sheet handlers ─────────────────────────────────────
window.seatClick = function (num, label) {
  gsPending = { num, label }
  gsPicked = null
  const labelEl = document.getElementById('mGsLabel')
  if (labelEl) labelEl.textContent = `ที่นั่ง ${label}`
  const mMale = document.getElementById('mGsMale')
  const mFemale = document.getElementById('mGsFemale')
  const mOk = document.getElementById('mGsOk')
  if (mMale) mMale.className = 'm-gs-card'
  if (mFemale) mFemale.className = 'm-gs-card'
  if (mOk) {
    mOk.disabled = true
    mOk.style.opacity = '.45'
  }
  const gs = document.getElementById('mGs')
  if (gs) gs.classList.add('open')
}

window.seatToggle = function (num) {
  delete selSeats[num]
  refreshSelGrid()
}

window.mPickGender = function (g) {
  gsPicked = g
  const mMale = document.getElementById('mGsMale')
  const mFemale = document.getElementById('mGsFemale')
  const mOk = document.getElementById('mGsOk')
  if (mMale) mMale.className = 'm-gs-card' + (g === 'MALE' ? ' sel-m' : '')
  if (mFemale) mFemale.className = 'm-gs-card' + (g === 'FEMALE' ? ' sel-f' : '')
  if (mOk) {
    mOk.disabled = false
    mOk.style.opacity = '1'
  }
}

window.mConfirmGender = function () {
  if (!gsPending || !gsPicked) return
  selSeats[gsPending.num] = gsPicked
  gsPending = null
  gsPicked = null
  const gs = document.getElementById('mGs')
  if (gs) gs.classList.remove('open')
  refreshSelGrid()
}

window.mCancelGender = function (e) {
  if (e && e.target !== document.getElementById('mGs')) return
  gsPending = null
  gsPicked = null
  const gs = document.getElementById('mGs')
  if (gs) gs.classList.remove('open')
}

// ── Proceed: navigate to seats.html (with optional presel) ────
window.seatProceed = function (roundId) {
  const cnt = Object.keys(selSeats).length
  if (!cnt) { window.location.href = `/booking/seats?roundId=${roundId}`; return }
  const presel = Object.entries(selSeats).map(([n, g]) => `${n}:${g}`).join(',')
  window.location.href = `/booking/seats?roundId=${roundId}&presel=${encodeURIComponent(presel)}`
}

// ── Search ────────────────────────────────────────────────
let timer
const searchInput = document.getElementById('searchInput')
if (searchInput) {
  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch() })
  searchInput.addEventListener('input', e => {
    clearTimeout(timer)
    timer = setTimeout(() => loadData(e.target.value.trim()), 400)
  })
}
window.doSearch = () => loadData(document.getElementById('searchInput')?.value.trim())

// ── Init ─────────────────────────────────────────────────
const urlParams = new URLSearchParams(location.search)
if (urlParams.get('tripId')) {
  loadData().then(() => {
    const r = allRounds.find(x => x.tripId === Number(urlParams.get('tripId')))
    if (r) selectRound(r.id)
  })
} else {
  loadData()
}
