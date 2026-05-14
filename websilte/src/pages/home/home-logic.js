import { apiFetch } from '/src/api/config.js'

const MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

// Escape text for use inside HTML attributes
const esc = s => (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function buildTripShareUrl() {
  const u = new URL(window.location.href)
  u.hash = ''
  if (tdCurrentTrip?.id) u.searchParams.set('tripId', String(tdCurrentTrip.id))
  else u.searchParams.delete('tripId')
  if (tdSelectedRound) u.searchParams.set('roundId', String(tdSelectedRound))
  else u.searchParams.delete('roundId')
  return u.toString()
}

function isLikelyMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
}

/** Open trip modal from ?tripId= & optional ?roundId= (share / deep link). */
async function openTripDeepLinkFromUrlIfPresent() {
  const raw = new URLSearchParams(window.location.search).get('tripId')
  if (!raw) return
  const tripId = parseInt(raw, 10)
  if (!tripId) return
  const roundRaw = new URLSearchParams(window.location.search).get('roundId')
  const roundId = roundRaw ? parseInt(roundRaw, 10) : NaN
  await tdOpen(tripId)
  if (Number.isFinite(roundId)) {
    setTimeout(() => window.__tdSelectRound?.(roundId), 200)
  }
}

// ── shared state ─────────────────────────────────────────
let homeRoundMap = new Map()
let tdSelectedRound = null
let tdCurrentTrip = null

// ── card HTML ────────────────────────────────────────────
export function htSkeleton(n) {
  return Array.from({ length: n }, () => `
<div class="swiper-slide">
  <div class="ht-card" style="pointer-events:none">
    <div class="ht-img-placeholder ht-skeleton" style="border-radius:0"></div>
    <div class="ht-body">
      <div class="ht-skeleton mb-2" style="height:12px;width:55%"></div>
      <div class="ht-skeleton mb-1" style="height:18px;width:85%"></div>
      <div class="ht-skeleton mb-3" style="height:12px;width:70%"></div>
      <div class="ht-skeleton" style="height:24px;width:40%"></div>
    </div>
  </div>
</div>`).join('')
}

function tripCard(t, rounds) {
  const next = rounds.find(r => r.isOpen && (r.totalSeats - 1 - r.bookedSeats) > 0) || rounds[0]
  const pTotal = next ? Math.max(1, next.totalSeats - 1) : 1
  const seated = next ? Math.max(0, pTotal - next.bookedSeats) : null
  const pct = next ? Math.round(next.bookedSeats / pTotal * 100) : 0
  const fillCls = pct >= 100 ? 'full' : pct >= 70 ? 'low' : 'ok'

  const deptTH = next
    ? new Date(next.departDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
    : ''
  const deptEN = next
    ? new Date(next.departDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' })
    : ''

  const loc = t.country || (t.tripType === 'INTERNATIONAL' ? 'ต่างประเทศ' : 'ไทย')
  const seatTxt = seated !== null ? `ว่าง ${seated}/${pTotal}` : ''

  return `
<div class="swiper-slide">
<div class="ht-card" onclick="window.__tdOpen(${t.id})">
  <div class="ht-img-wrap">
    ${t.imageUrl
      ? `<img src="${t.imageUrl}" class="ht-img" alt="${esc(t.title)}" loading="lazy">`
      : `<div class="ht-img-placeholder"><i class="bi bi-map"></i></div>`}
    <div class="ht-badges">
      <span class="ht-badge-loc">
        <i class="bi bi-geo-alt-fill"></i>
        <span data-i18n-dyn data-th="${esc(loc)}">${loc}</span>
      </span>
      ${t.isHot ? '<span class="ht-badge-hot"><i class="bi bi-fire me-1"></i>HOT</span>' : ''}
    </div>
    ${next ? `
    <div class="ht-seats-overlay">
      <div class="ht-seats-text">
        <span><i class="bi bi-calendar3" style="margin-right:.3rem"></i>
          <span data-i18n-dyn data-th="${esc(deptTH)}" data-en="${esc(deptEN)}">${deptTH}</span>
        </span>
        <span data-i18n-dyn data-th="${esc(seatTxt)}">${seatTxt}</span>
      </div>
      <div class="ht-seats-bar"><div class="ht-seats-fill ${fillCls}" style="width:${pct}%"></div></div>
    </div>` : ''}
  </div>
  <div class="ht-body">
    <h3 class="ht-card-title" data-i18n-dyn data-th="${esc(t.title)}">${t.title}</h3>
    ${t.description ? `<p class="ht-card-desc" data-i18n-dyn data-th="${esc(t.description)}">${t.description}</p>` : ''}

    <div class="ht-card-footer">
      <div class="ht-price">
        <div class="ht-price-main">
          <span class="ht-price-value">฿${Number(t.price).toLocaleString()}</span>
          <span class="ht-price-unit">/ คน</span>
        </div>
        ${t.deposit ? `<div class="ht-deposit">มัดจำ ฿${Number(t.deposit).toLocaleString()}</div>` : ''}
      </div>
      <button class="ht-btn-book" onclick="event.stopPropagation();window.__tdOpen(${t.id})">
        <i class="bi bi-info-circle me-1"></i><span data-i18n="view_detail">รายละเอียด</span>
      </button>
    </div>
  </div>
</div>
</div>`
}

export async function loadHomeTripRows() {
  const domWrapper = document.getElementById('domesticWrapper')
  const intlWrapper = document.getElementById('intlWrapper')
  if (domWrapper) domWrapper.innerHTML = htSkeleton(5)
  if (intlWrapper) intlWrapper.innerHTML = htSkeleton(4)
  try {
    const now = new Date()
    let [domestic, international, rounds] = await Promise.all([
      apiFetch('/trips?type=DOMESTIC&active=true'),
      apiFetch('/trips?type=INTERNATIONAL&active=true'),
      apiFetch(`/bus-rounds?month=${now.getMonth()}&year=${now.getFullYear()}`),
    ])

    if (window.__mockData) {
      domestic = window.__mockData.domestic || domestic
      international = window.__mockData.international || international
    }
    homeRoundMap = new Map()
    for (const r of rounds) {
      if (!homeRoundMap.has(r.tripId)) homeRoundMap.set(r.tripId, [])
      homeRoundMap.get(r.tripId).push(r)
    }
    const domesticSection = document.getElementById('domesticSection')
    const intlSection = document.getElementById('intlSection')
    if (domesticSection) domesticSection.style.display = domestic.length ? '' : 'none'
    if (domWrapper) domWrapper.innerHTML = domestic.length ? domestic.map(t => tripCard(t, homeRoundMap.get(t.id) || [])).join('') : emptySlide('ยังไม่มีทริปในประเทศ')
    if (intlSection) intlSection.style.display = international.length ? '' : 'none'
    if (intlWrapper) intlWrapper.innerHTML = international.length ? international.map(t => tripCard(t, homeRoundMap.get(t.id) || [])).join('') : emptySlide('ยังไม่มีทริปต่างประเทศ')

    populateTripSelects(domestic, international)

    if (window.__initSwipers) window.__initSwipers()
    window.__refreshHomeNav?.()
    window.__applyI18n?.()
    await window.__translateDynamic?.()
    await openTripDeepLinkFromUrlIfPresent()
  } catch (e) { console.error('Trip rows load error:', e) }
}

function resetTripDescPanel() {
  const block = document.getElementById('tdDescBlock')
  const panel = document.getElementById('tdDesc')
  const btn = document.getElementById('tdDescToggle')
  if (panel) {
    panel.innerHTML = ''
    panel.removeAttribute('data-i18n-dyn')
    panel.removeAttribute('data-th')
    panel.setAttribute('hidden', '')
  }
  if (btn) {
    btn.classList.remove('is-open')
    btn.setAttribute('aria-expanded', 'false')
  }
  if (block) block.style.display = 'none'
}

function tdCollapseTripDescPanel() {
  const panel = document.getElementById('tdDesc')
  const btn = document.getElementById('tdDescToggle')
  if (!panel || !btn) return
  panel.setAttribute('hidden', '')
  btn.classList.remove('is-open')
  btn.setAttribute('aria-expanded', 'false')
}

function emptySlide(msg) {
  return `<div class="swiper-slide" style="width:100%">
<div style="text-align:center;padding:3rem;color:var(--text-gray)">
  <i class="bi bi-map" style="font-size:3rem;opacity:.3;display:block;margin-bottom:.75rem"></i>
  <span data-i18n-dyn data-th="${esc(msg)}">${msg}</span>
</div></div>`
}

export async function tdOpen(tripId) {
  tdSelectedRound = null
  tdCurrentTrip = null

  const heroEl = document.getElementById('tdHero')
  if (heroEl) heroEl.innerHTML = `<div class="td-hero-empty"><i class="bi bi-compass-fill"></i></div>`
  const badgeEl = document.getElementById('tdBadge')
  const titleEl = document.getElementById('tdTitle')
  const infoEl = document.getElementById('tdInfo')
  const roundsEl = document.getElementById('tdRounds')
  const descEl = document.getElementById('tdDesc')
  const summaryEl = document.getElementById('tdSummary')
  const btnBook = document.getElementById('tdBtnBook')
  const btnDoc = document.getElementById('tdBtnDoc')

  if (badgeEl) badgeEl.innerHTML = ''
  if (titleEl) titleEl.textContent = 'กำลังโหลด...'
  if (infoEl) infoEl.innerHTML = ''
  if (roundsEl) roundsEl.innerHTML = '<div style="padding:1rem;text-align:center;color:#a0aec0"><span class="spinner-border spinner-border-sm"></span></div>'
  resetTripDescPanel()
  if (summaryEl) summaryEl.innerHTML = ''
  if (btnBook) btnBook.disabled = true
  if (btnDoc) btnDoc.style.display = 'none'

  const modal = document.getElementById('tripDetailModal')
  if (modal) modal.classList.add('open')
  document.body.style.overflow = 'hidden'
  window.__lenis?.stop()

  try {
    const [rounds, stacks, trip] = await Promise.all([
      apiFetch(`/bus-rounds?tripId=${tripId}`).catch(() => []),
      apiFetch(`/roudestack/trip/${tripId}`).catch(() => []),
      apiFetch(`/trips/${tripId}`)
    ])
    tdCurrentTrip = trip

    if (heroEl) {
      heroEl.innerHTML = trip.imageUrl
        ? `<img src="${trip.imageUrl}" alt="${esc(trip.title)}"><div class="td-hero-grad"></div><button class="td-close" onclick="tdClose()"><i class="bi bi-x"></i></button>`
        : `<div class="td-hero-empty"><i class="bi bi-map"></i></div><button class="td-close" onclick="tdClose()"><i class="bi bi-x"></i></button>`
    }

    const isIntl = trip.tripType === 'INTERNATIONAL'
    const loc = trip.country || (isIntl ? 'ต่างประเทศ' : 'ในประเทศ')
    const locSuffix = isIntl ? '' : ', ไทย'
    if (badgeEl) {
      badgeEl.innerHTML = `
    <span class="td-badge ${isIntl ? 'intl' : 'domestic'}">
      <i class="bi bi-geo-alt-fill"></i>
      <span data-i18n-dyn data-th="${esc(loc + locSuffix)}">${loc}${locSuffix}</span>
    </span>`
    }

    if (titleEl) {
      titleEl.textContent = trip.title
      titleEl.setAttribute('data-i18n-dyn', '')
      titleEl.setAttribute('data-th', trip.title)
    }

    const dur = rounds.length && rounds[0].duration ? rounds[0].duration : '-'
    if (infoEl) {
      infoEl.innerHTML = `
    <div class="td-info-card">
      <i class="bi bi-calendar-week"></i>
      <small data-i18n="modal_duration">ระยะเวลา</small>
      <strong data-i18n-dyn data-th="${esc(dur)}">${dur}</strong>
    </div>
    <div class="td-info-card price">
      <i class="bi bi-tag-fill"></i>
      <small data-i18n="modal_price_from">ราคาเริ่มต้น</small>
      <strong>฿${Number(trip.price).toLocaleString()}</strong>
    </div>`
    }

    const rawDesc = (trip.description || '').trim()
    if (descEl) {
      const descBlock = document.getElementById('tdDescBlock')
      const descToggle = document.getElementById('tdDescToggle')
      if (rawDesc) {
        descEl.textContent = rawDesc
        descEl.setAttribute('data-i18n-dyn', '')
        descEl.setAttribute('data-th', rawDesc)
        descEl.removeAttribute('hidden')
        if (descToggle) {
          descToggle.classList.add('is-open')
          descToggle.setAttribute('aria-expanded', 'true')
        }
      } else {
        descEl.removeAttribute('data-i18n-dyn')
        descEl.removeAttribute('data-th')
        descEl.innerHTML = '<span data-i18n="modal_desc_empty">ยังไม่มีรายละเอียดเพิ่มเติม</span>'
        descEl.setAttribute('hidden', '')
        if (descToggle) {
          descToggle.classList.remove('is-open')
          descToggle.setAttribute('aria-expanded', 'false')
        }
      }
      if (descBlock) descBlock.style.display = 'block'
    }

    if (summaryEl) {
      summaryEl.innerHTML = `
    <div class="td-summary">
      <div class="td-summary-title"><i class="bi bi-check-circle-fill me-2"></i>
        <span data-i18n="modal_summary_title">สรุปข้อมูลทริป</span>
      </div>
      <div class="td-summary-item"><i class="bi bi-geo-alt"></i>
        <span data-i18n-dyn data-th="${esc(trip.title)}">${trip.title}</span>
      </div>
      <div class="td-summary-item"><i class="bi bi-currency-exchange"></i>
        <span>฿${Number(trip.price).toLocaleString()} <span data-i18n="per_person">/ คน</span></span>
      </div>
      ${trip.deposit ? `<div class="td-summary-item"><i class="bi bi-wallet2"></i>
        <span data-i18n-dyn data-th="มัดจำ ฿${Number(trip.deposit).toLocaleString()}">มัดจำ ฿${Number(trip.deposit).toLocaleString()}</span>
      </div>` : ''}
    </div>`
    }

    tdRenderRounds(rounds, stacks)

    if (btnDoc) {
      const isVideo = trip.docUrl && /youtu|vimeo|tiktok|\.mp4|video/i.test(trip.docUrl)
      btnDoc.style.display = trip.docUrl ? 'flex' : 'none'
      if (trip.docUrl) {
        btnDoc.querySelector('i').className = isVideo ? 'bi bi-play-circle-fill' : 'bi bi-file-earmark-text'
        btnDoc.querySelector('span[data-i18n="modal_btn_doc"]').textContent = isVideo ? 'ดูวิดีโอรายละเอียดทริป' : 'ดูรายละเอียดก่อนจองได้เลย'
        btnDoc.onclick = () => window.open(trip.docUrl, '_blank')
      }
    }

    window.__applyI18n?.()
    await window.__translateDynamic?.()
  } catch (e) {
    if (titleEl) titleEl.textContent = 'โหลดข้อมูลไม่ได้ กรุณาลองใหม่'
    resetTripDescPanel()
  }
}

function tdRenderRounds(rounds, stacks = []) {
  const el = document.getElementById('tdRounds')
  if (!el) return
  const upcoming = rounds.filter(r => r.isOpen && new Date(r.departDate) >= new Date())
  if (!upcoming.length) {
    const futureStacks = stacks.filter(s => new Date(s.deteroudestr) >= new Date())
    if (futureStacks.length) {
      const stackRows = futureStacks.map(s => {
        const d = new Date(s.deteroudestr)
        const dsTH = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
        return `
        <div class="td-round-item full" style="opacity:.8; cursor:default">
          <div>
            <div class="td-round-date">
              <i class="bi bi-clock-history me-1" style="color:#a0aec0"></i>
              <span data-i18n-dyn data-th="${esc(dsTH)}">${dsTH}</span>
            </div>
            <div>${s.roundname}</div>
          </div>
          <div style="text-align:right">
            <span class="td-full-tag" style="background:rgba(160,174,192,.1);color:#a0aec0;border-color:rgba(160,174,192,.2)"
                  data-i18n-dyn data-th="เร็วๆ นี้">เร็วๆ นี้</span>
          </div>
        </div>`
      }).join('')

      el.innerHTML = `
      <div class="td-rounds-box">
        <div class="td-rounds-title" style="color:#a0aec0">
          <i class="bi bi-calendar2-plus"></i>
          <span data-i18n-dyn data-th="รอบที่กำลังจะเปิด (เร็วๆ นี้)">รอบที่กำลังจะเปิด (เร็วๆ นี้)</span>
        </div>
        ${stackRows}
        <div style="font-size:.73rem;color:#a0aec0;margin-top:.8rem;text-align:center">
          <i class="bi bi-info-circle me-1"></i>
          <span data-i18n-dyn data-th="รอบข้างต้นยังไม่เปิดรับสมัคร ติดตามได้เร็วๆ นี้">รอบข้างต้นยังไม่เปิดรับสมัคร ติดตามได้เร็วๆ นี้</span>
        </div>
      </div>`
      return
    }

    el.innerHTML = `
  <div class="td-rounds-box" style="text-align:center;color:#a0aec0">
    <i class="bi bi-calendar-x" style="font-size:1.8rem;display:block;margin-bottom:.5rem"></i>
    <span data-i18n-dyn data-th="ยังไม่มีรอบเปิดรับสมัคร">ยังไม่มีรอบเปิดรับสมัคร</span><br>
    <a href="/trips" style="color:#00d9b4;font-size:.82rem"
       data-i18n-dyn data-th="ดูรอบอื่นในหน้าทริปทั้งหมด">ดูรอบอื่นในหน้าทริปทั้งหมด</a>
  </div>`
    return
  }
  const rows = upcoming.map(r => {
    const roundName = r.roundname || r.roudeStack?.roundname || tdCurrentTrip?.title || '-'
    const tripName = tdCurrentTrip?.title || ''

    const pTotal = Math.max(1, r.totalSeats - 1)
    const left = Math.max(0, pTotal - r.bookedSeats)
    const pct = Math.round(r.bookedSeats / pTotal * 100)
    const full = left <= 0 || !r.isOpen
    const cls = pct >= 90 ? 'td-seats-full' : pct >= 60 ? 'td-seats-low' : 'td-seats-ok'
    return `
  <div class="td-round-item${full ? ' full' : ''}" data-rid="${r.id}"
       onclick="${full ? '' : `window.__tdSelectRound(${r.id})`}">
    <div>
      <div class="td-round-date">
        <i class="bi bi-calendar3 me-1" style="color:#00d9b4"></i>
        <span>${roundName}</span>
      </div>
      <div class="round-row-bot">
        <div>${tripName}</div>
      </div>
    </div>
    <div style="text-align:right">
      ${full
        ? `<span class="td-full-tag" data-i18n-dyn data-th="เต็มแล้ว">เต็มแล้ว</span>`
        : `<div style="font-size:.7rem;color:#a0aec0"
              data-i18n-dyn data-th="ว่าง ${left}/${pTotal}">ว่าง ${left}/${pTotal}</div>
           <div class="td-seats-bar"><div class="td-seats-fill ${cls}" style="width:${pct}%"></div></div>`}
    </div>
  </div>`
  }).join('')
  el.innerHTML = `
<div class="td-rounds-box">
  <div class="td-rounds-title">
    <i class="bi bi-calendar2-week-fill"></i>
    <span data-i18n-dyn data-th="รอบออกเดินทาง">รอบออกเดินทาง</span>
  </div>
  ${rows}
  <div style="font-size:.73rem;color:#a0aec0;margin-top:.5rem">
    <i class="bi bi-hand-index me-1"></i>
    <span data-i18n-dyn data-th="เลือกรอบ แล้วกดจองทริป">เลือกรอบ แล้วกดจองทริป</span>
  </div>
</div>`
  const firstAvailable = upcoming.find(r => r.isOpen && (r.totalSeats - r.bookedSeats) > 0)
  if (firstAvailable) {
    setTimeout(() => window.__tdSelectRound(firstAvailable.id), 50)
  }
}

window.__tdSelectRound = function (rid) {
  tdSelectedRound = rid
  document.querySelectorAll('.td-round-item').forEach(el => el.classList.remove('selected'))
  document.querySelector(`.td-round-item[data-rid="${rid}"]`)?.classList.add('selected')
  const btnBook = document.getElementById('tdBtnBook')
  if (btnBook) btnBook.disabled = false
}

window.__tdOpen = tdOpen
window.tdToggleTripDesc = function () {
  const panel = document.getElementById('tdDesc')
  const btn = document.getElementById('tdDescToggle')
  if (!panel || !btn) return
  const expanded = !panel.hasAttribute('hidden')
  if (expanded) {
    panel.setAttribute('hidden', '')
    btn.classList.remove('is-open')
    btn.setAttribute('aria-expanded', 'false')
  } else {
    panel.removeAttribute('hidden')
    btn.classList.add('is-open')
    btn.setAttribute('aria-expanded', 'true')
  }
}
window.tdClose = function () {
  tdCollapseTripDescPanel()
  const modal = document.getElementById('tripDetailModal')
  if (modal) modal.classList.remove('open')
  document.body.style.overflow = ''
  window.__lenis?.start()
}
window.tdGoBook = function () { if (tdSelectedRound) window.location.href = `/booking/seats?roundId=${tdSelectedRound}` }
window.tdShareLine = function () {
  const shareUrl = buildTripShareUrl()
  const headline = tdCurrentTrip ? `สนใจทริป: ${tdCurrentTrip.title}` : 'มาเที่ยวด้วยกัน!'
  const lineText = `${headline}\n${shareUrl}`
  const webShare = `https://line.me/R/msg/text/?text=${encodeURIComponent(lineText)}`

  if (isLikelyMobile()) {
    let hid = false
    const onVis = () => {
      if (document.visibilityState === 'hidden') hid = true
    }
    document.addEventListener('visibilitychange', onVis)
    window.location.href = `line://msg/text/${encodeURIComponent(lineText)}`
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onVis)
      if (!hid && document.visibilityState === 'visible') {
        window.open(webShare, '_blank')
      }
    }, 900)
    return
  }

  window.open(
    `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(headline)}`,
    '_blank'
  )
}
window.tdShareFb = async function () {
  const shareUrl = buildTripShareUrl()
  const title = tdCurrentTrip?.title || document.title || ''

  if (navigator.share) {
    try {
      await navigator.share({ title, text: title, url: shareUrl })
      return
    } catch (_) { /* user cancelled or share unsupported */ }
  }

  const enc = encodeURIComponent(shareUrl)
  const sharer = isLikelyMobile()
    ? `https://m.facebook.com/sharer.php?u=${enc}`
    : `https://www.facebook.com/sharer/sharer.php?u=${enc}`
  window.open(sharer, '_blank')
}

function populateTripSelects(domestic, international) {
  function fillSelect(selectId, countId, trips, placeholder) {
    const select = document.getElementById(selectId)
    const countEl = document.getElementById(countId)
    if (!select) return

    if (countEl) countEl.textContent = trips.length

    const defaultOption = `<option value="" selected disabled>${placeholder}</option>`

    if (!trips.length) {
      select.innerHTML = defaultOption + '<option value="" disabled>ยังไม่มีทริปเปิดรับ</option>'
      return
    }

    select.innerHTML = defaultOption + trips.map(t => {
      const rounds = homeRoundMap.get(t.id) || []
      const openRounds = rounds.filter(r => r.isOpen && (r.totalSeats - r.bookedSeats) > 0)
      const isFull = openRounds.length === 0
      return `<option value="${t.id}" ${isFull ? 'data-full="1"' : ''}>${t.title}${isFull ? ' (เต็ม)' : ''}</option>`
    }).join('')
  }

  fillSelect('domesticQuickSelect', 'domesticCount', domestic, 'เลือกทริปในประเทศ')
  fillSelect('intlQuickSelect', 'intlCount', international, 'เลือกทริปต่างประเทศ')
}

window.handleTripSelect = function (sel) {
  const tripId = parseInt(sel.value)
  if (!tripId) return
  setTimeout(() => { sel.selectedIndex = 0 }, 400)
  if (window.__tdOpen) window.__tdOpen(tripId)
}


window.openAlbumModal = async function (albumId) {
  const modal = document.getElementById('albumLightbox')
  const grid = document.getElementById('albumLightboxGrid')
  if (!modal || !grid) return

  modal.style.display = 'flex'
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#aaa;padding:2rem">กำลังโหลด...</div>'
  try {
    const res = await fetch(`/api/gallery/albums/${albumId}`)
    const album = await res.json()
    const titleEl = document.getElementById('albumLightboxTitle')
    const descEl = document.getElementById('albumLightboxDesc')
    if (titleEl) titleEl.textContent = album.title
    if (descEl) descEl.textContent = album.description || ''
    const imgs = album.images || []
    if (!imgs.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#aaa;padding:2rem">ยังไม่มีรูปภาพ</div>'
      return
    }
    grid.innerHTML = imgs.map(img => {
      const src = img.url
      return `<div><img src="${src}" alt="${esc(img.caption || '')}" loading="lazy"
           onclick="window.open('${src}','_blank')"
           style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;cursor:zoom-in">
           ${img.caption ? `<p style="font-size:.72rem;color:#aaa;margin:.3rem 0 0;text-align:center">${img.caption}</p>` : ''}
         </div>`
    }).join('')
  } catch (e) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#f87;padding:2rem">โหลดไม่ได้</div>'
  }
}

window.closeAlbumModal = function () {
  const modal = document.getElementById('albumLightbox')
  if (modal) modal.style.display = 'none'
}

window.openContentModal = function (id) {
  window.location.href = '/trips'
}

// ── Navigation & Scroll Logic ─────────────────────────────
function getHeaderOffset() {
  const header = document.querySelector('header.fixed-top')
  return header ? header.offsetHeight + 16 : 96
}

function isVisibleSection(el) {
  if (!el) return false
  if (el.hidden) return false
  if (el.style.display === 'none') return false
  const computed = window.getComputedStyle(el)
  return computed.display !== 'none' && computed.visibility !== 'hidden'
}

function scrollToHomeSection(sectionId) {
  const section = document.getElementById(sectionId)
  if (!section || !isVisibleSection(section)) return
  if (window.__lenis) {
    window.__lenis.scrollTo(section, { offset: -getHeaderOffset(), duration: 1.0 })
  } else {
    const top = window.scrollY + section.getBoundingClientRect().top - getHeaderOffset()
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' })
  }
}

function updateHomeNavActive() {
  const links = [...document.querySelectorAll('[data-nav-target]')]
  const visibleLinks = links.filter(link => {
    const item = link.closest('.nav-item')
    return item && item.style.display !== 'none'
  })
  let activeId = 'heroSection'
  let bestTop = -Infinity
  const threshold = getHeaderOffset() + 24

  visibleLinks.forEach(link => {
    const section = document.getElementById(link.dataset.navTarget)
    if (!section || !isVisibleSection(section)) return
    const rect = section.getBoundingClientRect()
    if (rect.top <= threshold && rect.top > bestTop) {
      bestTop = rect.top
      activeId = link.dataset.navTarget
    }
  })

  links.forEach(link => {
    link.classList.toggle('active', link.dataset.navTarget === activeId)
  })
}

function refreshHomeNavVisibility() {
  const toggle = (itemId, visible) => {
    const item = document.getElementById(itemId)
    if (!item) return
    item.style.display = visible ? '' : 'none'
  }

  const domesticSection = document.getElementById('domesticSection')
  const internationalSection = document.getElementById('intlSection')
  const gallerySection = document.getElementById('gallerySection')
  const contactSection = document.getElementById('contactSection')
  const domesticCards = document.querySelectorAll('#domesticWrapper .ht-card').length
  const internationalCards = document.querySelectorAll('#intlWrapper .ht-card').length
  const galleryCards = document.querySelectorAll('#galleryGrid .gallery-card').length

  toggle('navItemDomestic', isVisibleSection(domesticSection) && domesticCards > 0)
  toggle('navItemInternational', isVisibleSection(internationalSection) && internationalCards > 0)
  toggle('navItemGallery', isVisibleSection(gallerySection) && galleryCards > 0)
  toggle('navItemContact', isVisibleSection(contactSection))

  updateHomeNavActive()
}

function initHomeSectionNav() {
  document.querySelectorAll('[data-nav-target]').forEach(link => {
    link.addEventListener('click', (event) => {
      const sectionId = link.dataset.navTarget
      if (!sectionId) return
      event.preventDefault()
      scrollToHomeSection(sectionId)

      const menu = document.getElementById('navMenu')
      if (menu?.classList.contains('show')) {
        // @ts-ignore
        bootstrap.Collapse.getOrCreateInstance(menu).hide()
      }
    })
  })

  let _navTicking = false
  window.addEventListener('scroll', () => {
    if (!_navTicking) {
      _navTicking = true
      requestAnimationFrame(() => { updateHomeNavActive(); _navTicking = false })
    }
  }, { passive: true })
  window.addEventListener('resize', updateHomeNavActive)
  updateHomeNavActive()
  refreshHomeNavVisibility()
}

window.__refreshHomeNav = refreshHomeNavVisibility
window.__initHomeSectionNav = initHomeSectionNav

// ── Announcement Scroll Handler ──
let _annTicking = false
window.addEventListener('scroll', () => {
  if (!_annTicking) {
    _annTicking = true
    requestAnimationFrame(() => {
      const bar = document.getElementById('announcementBar')
      if (bar) bar.classList.toggle('hide-bar', window.scrollY > 60)
      _annTicking = false
    })
  }
}, { passive: true })

// ── Detail Modal Swipe to Close + Native Scroll ──
document.addEventListener('DOMContentLoaded', () => {
  const sheet = document.getElementById('tdSheet')
  if (sheet) {
    // ป้องกัน Lenis intercept wheel event ภายใน modal
    // Lenis ฟัง wheel บน document.documentElement (bubble phase)
    // stopPropagation ที่ sheet → event ไม่ถึง Lenis
    sheet.addEventListener('wheel', e => { e.stopPropagation() }, { passive: false })

    let _sy = 0
    sheet.addEventListener('touchstart', e => { _sy = e.touches[0].clientY }, { passive: true })
    sheet.addEventListener('touchend', e => {
      if (e.changedTouches[0].clientY - _sy > 80 && sheet.scrollTop === 0) {
        if (window.tdClose) window.tdClose()
      }
    }, { passive: true })
  }
})