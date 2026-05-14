/* ════════════════════════════════════════════════════════════════
   STATE
════════════════════════════════════════════════════════════════ */
const MONTH_TH = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

let allRounds = [];
let allRoudestacks = [];
let currentRows = [];
let currentBookings = [];
let currentPaymentMap = {};
let cancelModal;
let pendingCancelId = null;
/** รอบที่กำลังดู + snapshot ที่นั่ง (เดียวกับหน้าจอง) — ใช้ปรับแผง/เลือกจำนวนช่อง */
let currentMonitorRound = null;
let currentSeatRoundSnap = null;
let seatMapCapSelectRoundId = null;

/* ════════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
    await initPage();
    cancelModal = new bootstrap.Modal(document.getElementById('cancelModal'));
    allRounds = await API.busRounds.list();
    allRoudestacks = await API.roudeStack.list();

    document.addEventListener('click', e => {
        if (!e.target.closest('#tripDropdown') && e.target.id !== 'srchTrip')
            document.getElementById('tripDropdown').classList.add('d-none');
    });

    const urlRoundId = new URLSearchParams(location.search).get('roundId');
    if (urlRoundId) {
        const r = allRounds.find(x => x.id === Number(urlRoundId));
        if (r) autoSelectRound(r);
    }
});

/* ════════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════════ */
function calcAge(d) {
    if (!d) return '-';
    const b = new Date(d), t = new Date();
    let a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() ||
        (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
}
function formatBirth(d) {
    if (!d) return '-';
    const dt = new Date(d);
    return `${dt.getDate()} ${MONTH_TH[dt.getMonth() + 1]} ${dt.getFullYear() + 543}`;
}
/* ════════════════════════════════════════════════════════════════
   ROUND SEARCH  —  Cascading filters: Trip → RoudeStack → BusNum → Date
════════════════════════════════════════════════════════════════ */
let tripDropIdx = -1;
let selectedTripId = null;
let selectedRoudestackId = null;

/* ── Input 1: แสดง unique Trips ── */
function filterTripList() {
    const q = document.getElementById('srchTrip').value.toLowerCase().trim();
    const dropdown = document.getElementById('tripDropdown');
    tripDropIdx = -1;

    // Group allRounds by tripId → unique trips
    const tripMap = new Map();
    allRounds.forEach(r => {
        if (!r.trip) return;
        if (!tripMap.has(r.tripId)) tripMap.set(r.tripId, { trip: r.trip, rounds: [] });
        tripMap.get(r.tripId).rounds.push(r);
    });

    const list = [...tripMap.values()].filter(({ trip }) =>
        !q || trip.title.toLowerCase().includes(q)
    );

    if (!list.length) {
        dropdown.innerHTML = '<div class="px-3 py-2 text-muted small">ไม่พบทริป</div>';
        dropdown.classList.remove('d-none');
        return;
    }

    dropdown.innerHTML = list.map(({ trip, rounds }) => {
        const dates = rounds.map(r => new Date(r.departDate)).sort((a, b) => a - b);
        const earliest = dates[0];
        const latest = dates[dates.length - 1];
        const dateInfo = dates.length > 1
            ? `${earliest.getDate()} ${MONTH_TH[earliest.getMonth() + 1]} — ${latest.getDate()} ${MONTH_TH[latest.getMonth() + 1]} ${latest.getFullYear() + 543}`
            : `${earliest.getDate()} ${MONTH_TH[earliest.getMonth() + 1]} ${earliest.getFullYear() + 543}`;
        return `<div class="td-item px-3 py-2" data-tripid="${trip.id}"
                     style="cursor:pointer;border-bottom:1px solid #f0f0f0;"
                     onmousedown="selectTrip(${trip.id})">
            <div class="d-flex justify-content-between align-items-center gap-2">
                <div style="min-width:0;">
                    <div class="fw-bold" style="font-size:.83rem;">${trip.title}</div>
                    <div class="text-muted mt-1" style="font-size:.72rem;">
                        <i class="bi bi-calendar3 me-1"></i>${dateInfo}
                    </div>
                </div>
                <span class="badge bg-light text-dark border" style="font-size:.68rem;flex-shrink:0;">
                    ${rounds.length} รอบ
                </span>
            </div>
        </div>`;
    }).join('');
    dropdown.classList.remove('d-none');
}

function handleTripKey(e) {
    const items = document.querySelectorAll('#tripDropdown .td-item');
    if (e.key === 'ArrowDown') {
        tripDropIdx = Math.min(tripDropIdx + 1, items.length - 1);
        items.forEach((el, i) => el.classList.toggle('active', i === tripDropIdx));
        e.preventDefault();
    } else if (e.key === 'ArrowUp') {
        tripDropIdx = Math.max(tripDropIdx - 1, -1);
        items.forEach((el, i) => el.classList.toggle('active', i === tripDropIdx));
        e.preventDefault();
    } else if (e.key === 'Enter' && tripDropIdx >= 0 && items[tripDropIdx]) {
        items[tripDropIdx].dispatchEvent(new MouseEvent('mousedown'));
    } else if (e.key === 'Escape') {
        document.getElementById('tripDropdown').classList.add('d-none');
    }
}

/* ── เลือก Trip → populate selRoudeStack ── */
function selectTrip(tripId) {
    selectedTripId = tripId;
    const tripRounds = allRounds.filter(r => r.tripId === tripId);
    const tripTitle = tripRounds[0]?.trip?.title || '';

    document.getElementById('srchTrip').value = tripTitle;
    document.getElementById('btnClearSelection').style.display = '';
    document.getElementById('tripDropdown').classList.add('d-none');

    // reset downstream
    resetSelRoudeStack();
    resetSelBusNum();
    resetSelDate();
    document.getElementById('filterRound').value = '';
    showEmpty();

    // populate selRoudeStack — unique roudestacks for this trip
    const tripRoudeStacks = allRoudestacks.filter(rs => {
        const rsRounds = allRounds.filter(r => r.roudeStackId === rs.id);
        return rsRounds.some(r => r.tripId === tripId);
    }).sort((a, b) => {
        const aDate = new Date(a.deteroudestr);
        const bDate = new Date(b.deteroudestr);
        return aDate - bDate;
    });

    const selRoudeStack = document.getElementById('selRoudeStack');
    selRoudeStack.innerHTML = '<option value="">— เลือก —</option>' +
        tripRoudeStacks.map(rs =>
            `<option value="${rs.id}">${rs.roundname}</option>`
        ).join('');
    selRoudeStack.disabled = false;
    selRoudeStack.value = '';

    // If only one RoudeStack, auto-select
    if (tripRoudeStacks.length === 1) {
        selRoudeStack.selectedIndex = 1;
        onSelRoudestackChange();
    }
}

/* ── เลือก RoudeStack → populate selBusNum ── */
function onSelRoudestackChange() {
    const roudestackId = parseInt(document.getElementById('selRoudeStack').value);
    resetSelBusNum();
    resetSelDate();
    if (!roudestackId) return;

    selectedRoudestackId = roudestackId;

    // Get unique bus numbers for this trip + RoudeStack
    const rsRounds = allRounds.filter(r =>
        r.tripId === selectedTripId &&
        r.roudeStackId === roudestackId
    ).sort((a, b) => a.busNumber - b.busNumber);

    const seen = new Set();
    const uniqueBusNums = [];
    rsRounds.forEach(r => {
        if (!seen.has(r.busNumber)) {
            seen.add(r.busNumber);
            uniqueBusNums.push(r.busNumber);
        }
    });

    const selBusNum = document.getElementById('selBusNum');
    selBusNum.innerHTML = '<option value="">— เลือก —</option>' +
        uniqueBusNums.map(busNum =>
            `<option value="${busNum}">รถ ${busNum}</option>`
        ).join('');
    selBusNum.disabled = false;
    selBusNum.value = '';

    // If only one bus number, auto-select
    if (uniqueBusNums.length === 1) {
        selBusNum.selectedIndex = 1;
        onSelBusNumChange();
    }
}

/* ── เลือก bus number → populate selDate ── */
function onSelBusNumChange() {
    const busNum = document.getElementById('selBusNum').value;
    resetSelDate();
    if (!busNum) return;

    const filtered = allRounds.filter(r =>
        r.roudeStackId === selectedRoudestackId &&
        String(r.busNumber) === String(busNum)
    ).sort((a, b) => new Date(a.departDate) - new Date(b.departDate));

    const selDate = document.getElementById('selDate');
    selDate.innerHTML = '<option value="">— เลือกวันที่ —</option>' +
        filtered.map(r => {
            const d = new Date(r.departDate);
            const pct = r.totalSeats ? Math.round((r.bookedSeats / r.totalSeats) * 100) : 0;
            const isFull = r.bookedSeats >= r.totalSeats;
            const dateStr = `${d.getDate()} ${MONTH_TH[d.getMonth() + 1]} ${d.getFullYear() + 543}`;
            return `<option value="${r.id}" data-booked="${r.bookedSeats}" data-total="${r.totalSeats}" data-pct="${pct}">` +
                `${dateStr}  (${r.bookedSeats}/${r.totalSeats}${isFull ? ' · เต็ม' : ''})</option>`;
        }).join('');
    selDate.disabled = false;

    // ถ้ามีวันเดียวให้ auto-select
    if (filtered.length === 1) {
        selDate.selectedIndex = 1;
        onSelDateChange();
    }
}

/* ── เลือก date → loadMonitor ── */
function onSelDateChange() {
    const sel = document.getElementById('selDate');
    const roundId = sel.value;
    if (!roundId) {
        document.getElementById('filterRound').value = '';
        showEmpty();
        return;
    }
    document.getElementById('filterRound').value = roundId;
    loadMonitor();
}

/* ── Helpers ── */
function resetSelRoudeStack() {
    const sel = document.getElementById('selRoudeStack');
    sel.innerHTML = '<option value="">— เลือก —</option>';
    sel.disabled = true;
}

function resetSelBusNum() {
    const sel = document.getElementById('selBusNum');
    sel.innerHTML = '<option value="">— เลือก —</option>';
    sel.disabled = true;
}

function resetSelDate() {
    const sel = document.getElementById('selDate');
    sel.innerHTML = '<option value="">— เลือกวันที่ —</option>';
    sel.disabled = true;
}

function clearRound() {
    selectedTripId = null;
    selectedRoudestackId = null;
    document.getElementById('filterRound').value = '';
    document.getElementById('srchTrip').value = '';
    document.getElementById('btnClearSelection').style.display = 'none';
    document.getElementById('tripDropdown').classList.add('d-none');
    resetSelRoudeStack();
    resetSelBusNum();
    resetSelDate();
    showEmpty();
}

/* ── URL param auto-load: ?roundId=X ── */
function autoSelectRound(r) {
    selectTrip(r.tripId);
    document.getElementById('selRoudeStack').value = r.roudeStackId;
    onSelRoudestackChange();
    document.getElementById('selBusNum').value = r.busNumber;
    onSelBusNumChange();
    document.getElementById('selDate').value = r.id;
    onSelDateChange();
}

function showEmpty() {
    document.getElementById('tripStrip').classList.add('d-none');
    document.getElementById('mainPanel').classList.add('d-none');
    document.getElementById('emptyState').style.display = '';
    currentRows = [];
    currentMonitorRound = null;
    currentSeatRoundSnap = null;
    seatMapCapSelectRoundId = null;
    const wrap = document.getElementById('seatMapCapWrap');
    if (wrap) {
        wrap.classList.add('d-none');
        wrap.classList.remove('d-flex');
    }
}
 
/* ════════════════════════════════════════════════════════════════
   LOAD MONITOR  —  fetch + render all views
════════════════════════════════════════════════════════════════ */
async function loadMonitor() {
    const roundId = document.getElementById('filterRound').value;
    if (!roundId) { showEmpty(); return; }

    document.getElementById('emptyState').style.display = 'none';

    try {
        const [rounds, bookings, allPayments, seatSnap] = await Promise.all([
            API.busRounds.list(),
            API.bookings.byRound(roundId),
            API.payments.list(),
            API.seatBookings.byRound(roundId).catch(() => null)
        ]);

        const round = rounds.find(r => r.id === Number(roundId));
        if (!round) {
            showToast('ไม่พบรอบรถ', 'danger');
            showEmpty();
            return;
        }
        currentMonitorRound = round;
        currentSeatRoundSnap = seatSnap;

        // Build payment map
        const paymentMap = {};
        allPayments.forEach(p => {
            const bId = Number(p.bookingId);
            if (!paymentMap[bId]) paymentMap[bId] = [];
            paymentMap[bId].push(p);
        });

        // Build rows — 1 per SeatBooking
        currentBookings = bookings;
        currentPaymentMap = paymentMap;
        const rows = [];
        for (const b of bookings) {
            const bIdAsNum = Number(b.id);
            const bTotal = parseFloat(b.totalAmount || 0);

            // Fetch payments: prefer the one included in booking, then supplement from global map
            const payments = [];
            if (b.payment) payments.push(b.payment);

            const fromMap = paymentMap[bIdAsNum] || [];
            fromMap.forEach(p => {
                if (!payments.find(x => x.id === p.id)) payments.push(p);
            });

            // For display balance: subtract all ACTIVE payments (CONFIRMED or PENDING)
            const activePayments = payments.filter(p => p.status !== 'REJECTED');
            const activeTotal = activePayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

            const remaining = Math.max(0, bTotal - activeTotal);
            const totalPaidActive = activeTotal;
            const depositPaidSum = activePayments
                .filter(p => p.type === 'DEPOSIT')
                .reduce((s, p) => s + parseFloat(p.amount || 0), 0);

            const depositPay = activePayments.find(p => p.type === 'DEPOSIT') || activePayments[0] || null;
            const remainPay = activePayments.find(p => p.type === 'FULL') || (activePayments.length > 1 ? activePayments[1] : null);

            const depSlipText = depositPay?.slipUrl ? 'มีสลิป' : (depositPay?.slipRef || '-');
            const remSlipText = remainPay?.slipUrl ? 'มีสลิป' : (remainPay?.slipRef || '-');

            const isPendingPayment = activePayments.some(p => p.status === 'PENDING');
            const confirmedAmt = activePayments.filter(p => p.status === 'CONFIRMED').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
            const isFullPay = activePayments.some(p => p.type === 'FULL') || (remaining <= 0 && activeTotal > 0);

            const addons = b.bookingAddons || [];
            // รวม slips จาก PaymentSlip[] (ใหม่) + slipUrl fallback (เก่า)
            const cashPaymentSlips = [];
            for (const p of activePayments) {
                const slipRows = Array.isArray(p.slips) && p.slips.length ? p.slips : null;
                if (slipRows) {
                    // มี PaymentSlip rows → ใช้แทน slipUrl ตรง
                    slipRows.forEach(s => cashPaymentSlips.push({
                        slipUrl: String(s.url || '').trim(),
                        slipType: s.slipType || 'DEPOSIT',
                        sequence: s.sequence || 1,
                        type: p.type,
                        amount: parseFloat(p.amount || 0),
                        status: p.status
                    }));
                } else if (p.slipUrl) {
                    // fallback: payment มีแค่ slipUrl (ก่อน migrate)
                    cashPaymentSlips.push({
                        slipUrl: String(p.slipUrl).trim(),
                        slipType: p.type === 'FULL' ? 'REMAINING' : 'DEPOSIT',
                        sequence: cashPaymentSlips.length + 1,
                        type: p.type,
                        amount: parseFloat(p.amount || 0),
                        status: p.status
                    });
                }
            }
            const rowData = {
                booking: b,
                depositPaidSum,
                totalPaidActive,
                confirmedTotal: confirmedAmt,
                remaining,
                depSlipText,
                remSlipText,
                isPendingPayment,
                isFullPay,
                addons,
                cashPaymentSlips
            };

            const seats = b.seatBookings || [];
            if (seats.length === 0) rows.push({ seat: null, ...rowData });
            else seats.forEach(seat => rows.push({ seat, ...rowData }));
        }

        rows.sort((a, b) => {
            const va = a.seat?.vanOrder || 99, vb = b.seat?.vanOrder || 99;
            const sa = a.seat?.seatNumber || 99, sb = b.seat?.seatNumber || 99;
            return va !== vb ? va - vb : sa - sb;
        });

        currentRows = rows;
        document.getElementById('tabPaxBadge').textContent = rows.length;

        // Show UI
        document.getElementById('tripStrip').classList.remove('d-none');
        document.getElementById('mainPanel').classList.remove('d-none');

        // Render all panels
        document.getElementById('checkAllPax').checked = false;
        updateSelectedCount();
        updateTripStrip(round, rows);
        const reqDep = round.trip?.deposit || 0;
        renderTable(rows, reqDep);
        setupSeatMapCapSelect(round, seatSnap);
        renderSeatMap(round, seatSnap);
        renderApproval(bookings, paymentMap, reqDep);

    } catch (e) { showToast('โหลดล้มเหลว: ' + e.message, 'danger'); }
}

function updateTripStrip(round, rows = []) {
    if (!round) return;
    document.getElementById('bannerTrip').textContent = round.trip?.title || '';
    document.getElementById('bannerBus').textContent = `รถคันที่ ${round.busNumber}`;
    document.getElementById('bannerDate').textContent = formatDateTime(round.departDate);
    document.getElementById('bannerRoute').textContent = `${round.startPoint} → ${round.endPoint}`;
    document.getElementById('bannerStatus').textContent = round.isOpen ? 'เปิดจอง' : 'ปิดจอง';

    // Update dynamic deposit header
    const depHeader = document.getElementById('headerDepositAmount');
    if (depHeader) {
        depHeader.textContent = formatMoney(round.trip?.deposit || 0);
    }

    const respEl = document.getElementById('bannerResponsible');
    respEl.innerHTML = round.responsiblePerson ? `<i class="bi bi-person-circle me-1"></i>${round.responsiblePerson}` : '<i class="bi bi-person-circle me-1"></i>ไม่ระบุ';

    if (rows.length > 0) {
        const activeRows = rows.filter(r => r.seat && r.booking.status !== 'CANCELLED');
        const bookedCount = activeRows.length;
        const cap = resolveMonitorMapPassengerSlots(round, currentSeatRoundSnap);
        const remaining = Math.max(0, cap - bookedCount);

        const uniqueIds = [...new Set(rows.map(r => r.booking.id))];
        const getRow = (id) => rows.find(r => r.booking.id === id);
        const totalRevenue = uniqueIds.reduce((s, id) => s + parseFloat(getRow(id).booking.totalAmount || 0), 0);
        const totalDeposit = uniqueIds.reduce((s, id) => s + parseFloat(getRow(id).depositPaidSum || 0), 0);

        document.getElementById('bannerPax').textContent = `${bookedCount} คน / เหลือ ${remaining}`;
        document.getElementById('bannerRevenue').textContent = formatMoney(totalRevenue);
        document.getElementById('bannerDeposit').textContent = formatMoney(totalDeposit);
    } else {
        const cap = resolveMonitorMapPassengerSlots(round, currentSeatRoundSnap);
        const paxEl = document.getElementById('bannerPax');
        if (paxEl) paxEl.textContent = `0 คน / เหลือ ${cap}`;
    }

    const today = new Date();
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('ph-trip', `${round.trip?.title || ''} — รถคันที่ ${round.busNumber}`);
    setTxt('ph-vehicle', `รถคันที่ ${round.busNumber}`);
    setTxt('ph-date', formatDateTime(round.departDate));
    setTxt('ph-location', `${round.startPoint} → ${round.endPoint}`);
    setTxt('ph-status', round.isOpen ? 'เปิดจอง' : 'ปิดจอง');
    setTxt('ph-responsible', round.responsiblePerson ? `ผู้รับผิดชอบ: ${round.responsiblePerson}` : '-');
    setTxt('ph-printdate', `${today.getDate()} ${MONTH_TH[today.getMonth() + 1]} ${today.getFullYear() + 543}`);
    setTxt('ph-ref-id', 'TRP-' + (round.id || ''));
}

/* ════════════════════════════════════════════════════════════════
   KPI STRIP (DEPRECATED - MERGED TO updateTripStrip)
════════════════════════════════════════════════════════════════ */
function renderKPI(rows) { }

/* ════════════════════════════════════════════════════════════════
   TAB 1 — ตารางผู้โดยสาร
════════════════════════════════════════════════════════════════ */
function escapeHtmlAttr(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function isSafeHttpUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const u = url.trim();
    return /^https?:\/\//i.test(u) || (u.startsWith('/') && !u.startsWith('//'));
}

/** สลิปเงินสดจาก cashPaymentSlips — รองรับ slipType (DEPOSIT / REMAINING) */
function formatCashSlipHtml(slips) {
    const list = slips || [];
    if (!list.length) return '<span class="text-muted">-</span>';

    const typeColor = t => t === 'REMAINING' ? '#198754' : '#0d6efd';
    const typeLab   = t => t === 'REMAINING' ? 'ส่วนที่เหลือ' : t === 'DEPOSIT' ? 'มัดจำ' : (t === 'FULL' ? 'ชำระเต็ม' : (t || 'ชำระ'));
    const stLab     = s => s === 'CONFIRMED' ? 'ยืนยันแล้ว' : s === 'PENDING' ? 'รอตรวจ' : s === 'REJECTED' ? 'ปฏิเสธ' : (s || '');

    const btns = list.map((p, idx) => {
        const label = typeLab(p.slipType || p.type);
        const title = `#${p.sequence || idx + 1} ${label} ${formatMoney(p.amount)} — ${stLab(p.status)} — เปิดสลิป`;
        const tEsc  = escapeHtmlAttr(title);
        const color = typeColor(p.slipType || (p.type === 'FULL' ? 'REMAINING' : 'DEPOSIT'));

        if (!isSafeHttpUrl(p.slipUrl)) {
            return `<span class="badge bg-light text-danger border" style="font-size:.62rem;" title="URL สลิปไม่ถูกต้อง">!</span>`;
        }
        const href = escapeHtmlAttr(p.slipUrl.trim());
        return `<a href="${href}" target="_blank" rel="noopener noreferrer"
            class="btn btn-sm py-0 px-1 cash-slip-btn"
            style="border:1.5px solid ${color};color:${color};"
            title="${tEsc}">
            <i class="bi bi-file-earmark-image"></i>
            <span class="ms-1" style="font-size:.58rem;font-weight:700;">${label}</span>
        </a>`;
    }).join('');
    return `<div class="d-flex flex-wrap gap-1 justify-content-center align-items-center cash-slip-cell">${btns}</div>`;
}

function policyInsuranceCellHtml(b, f) {
    const policyStatus = f?.insuranceForm?.status || 'NONE';
    const href = `../bookings/view.html?id=${b.id}&fromRound=${b.busRoundId}`;
    const map = {
        NONE: { bi: 'bi-circle', cls: 'muted', title: 'ยังไม่มีกรมธรรม์ — คลิกเปิดการจอง' },
        DRAFT: { bi: 'bi-file-earmark-text', cls: 'muted', title: 'ร่างกรมธรรม์ — คลิกแก้ไข/ดูการจอง' },
        SUBMITTED: { bi: 'bi-hourglass-split', cls: 'pending', title: 'ส่งแล้ว รอตรวจ — คลิกดูการจอง' },
        ISSUED: { bi: 'bi-check-circle-fill', cls: 'ok', title: 'ออกกรมธรรม์แล้ว — คลิกดูรายละเอียด' },
        REJECTED: { bi: 'bi-x-octagon-fill', cls: 'danger', title: 'ไม่ผ่าน — คลิกดูการจอง' }
    };
    const meta = map[policyStatus] || { bi: 'bi-question-circle', cls: 'muted', title: String(policyStatus) };
    return `<a href="${href}" target="_blank" rel="noopener" class="policy-ic-link pay-ic pay-ic-policy ${meta.cls}" title="${meta.title}"><i class="bi ${meta.bi}"></i></a>`;
}

function payStatusStripHtml(r, tripDepositRequired) {
    const req = Number(tripDepositRequired) || 0;
    const conf = r.confirmedTotal || 0;
    const depSlipOk = r.depSlipText && r.depSlipText !== '-';
    const remSlipOk = r.remSlipText && r.remSlipText !== '-';
    const rem = Math.max(0, r.remaining || 0);
    const paidAll = rem <= 0 && (r.totalPaidActive || 0) > 0;
    const icons = [];

    if (req > 0) {
        const okTrip = conf >= req;
        const titleTrip = okTrip
            ? `ครบมัดจำตามทริปแล้ว (ยืนยันแล้ว ≥ ${formatMoney(req)})`
            : r.isPendingPayment
                ? `มียอดรอตรวจ — เกณฑ์ทริป ${formatMoney(req)} (ยืนยันแล้ว ${formatMoney(conf)})`
                : `ยังไม่ครบมัดจำที่ยืนยันแล้ว — เกณฑ์ ${formatMoney(req)} / ยืนยัน ${formatMoney(conf)}`;
        const cls = okTrip ? 'ok' : r.isPendingPayment ? 'pending' : 'warn';
        const bi = okTrip ? 'bi-patch-check-fill' : r.isPendingPayment ? 'bi-hourglass-split' : 'bi-patch-minus';
        icons.push(`<span class="pay-ic ${cls}" title="${titleTrip}"><i class="bi ${bi}"></i></span>`);
    } else {
        icons.push(`<span class="pay-ic muted" title="ทริปนี้ไม่กำหนดมัดจำ"><i class="bi bi-dash-lg"></i></span>`);
    }

    icons.push(`<span class="pay-ic ${depSlipOk ? 'ok' : 'muted'}" title="${depSlipOk ? 'มีหลักฐาน / สลิปมัดจำ' : 'ยังไม่มีสลิปมัดจำ'}"><i class="bi bi-file-earmark-image"></i></span>`);

    const payTitle = paidAll
        ? 'ชำระครบยอดสุทธิแล้ว'
        : rem > 0
            ? `ยังค้างชำระ ${formatMoney(rem)}`
            : 'ยังไม่มีรายการชำระ';
    icons.push(`<span class="pay-ic ${paidAll ? 'ok' : rem > 0 ? 'warn' : 'muted'}" title="${payTitle}"><i class="bi ${paidAll ? 'bi-check2-circle' : 'bi-wallet2'}"></i></span>`);

    const remSlipTitle = remSlipOk
        ? 'มีหลักฐานส่วนที่เหลือ'
        : paidAll
            ? 'ไม่มีสลิปแยกส่วนที่เหลือ (อาจชำระครั้งเดียว)'
            : rem > 0
                ? 'ยังไม่มีสลิปส่วนที่เหลือ'
                : '-';
    const remSlipCls = remSlipOk ? 'ok' : paidAll ? 'muted' : rem > 0 ? 'warn' : 'muted';
    icons.push(`<span class="pay-ic ${remSlipCls}" title="${remSlipTitle}"><i class="bi bi-receipt-cutoff"></i></span>`);

    return `<div class="pay-status-strip" role="group" aria-label="สถานะการชำระเงิน">${icons.join('')}</div>`;
}

function payStatusLegend(r, tripDepositRequired) {
    const req = Number(tripDepositRequired) || 0;
    const parts = [];
    if (req > 0) {
        parts.push((r.confirmedTotal || 0) >= req ? 'ครบเกณฑ์มัดจำทริป' : r.isPendingPayment ? 'รอตรวจ(เกณฑ์ทริป)' : 'ยังไม่ครบเกณฑ์มัดจำทริป');
    } else parts.push('ไม่กำหนดมัดจำทริป');
    parts.push(r.depSlipText && r.depSlipText !== '-' ? 'มีหลักฐานมัดจำ' : 'ไม่มีสลิปมัดจำ');
    parts.push((r.remaining || 0) <= 0 && (r.totalPaidActive || 0) > 0 ? 'ชำระครบยอดสุทธิ' : `ค้าง ${formatMoney(Math.max(0, r.remaining || 0))}`);
    parts.push(r.remSlipText && r.remSlipText !== '-' ? 'มีหลักฐานส่วนที่เหลือ' : 'ไม่มีสลิปส่วนที่เหลือ');
    return parts.join(' | ');
}

function renderTable(rows, requiredDeposit = 0) {
    if (!rows.length) {
        document.getElementById('monitorBody').innerHTML =
            '<tr><td colspan="25" class="text-center py-5 text-muted">ยังไม่มีการจองในรอบนี้</td></tr>';
        return;
    }

    const statusBadge = s => s === 'CONFIRMED'
        ? `<span class="badge badge-confirmed">ยืนยันแล้ว</span>`
        : s === 'CANCELLED'
            ? `<span class="badge badge-cancelled">ยกเลิก</span>`
            : `<span class="badge badge-pending">รอยืนยัน</span>`;

    document.getElementById('monitorBody').innerHTML = rows.map((r, i) => {
        const { seat: f, booking: b, depositPaidSum, totalPaidActive, remaining, addons } = r;

        const pickup = f?.pickupPoint || b.busRound?.startPoint || '-';
        const vanNo = f?.vanOrder ?? '-';
        const seatNo = f?.seatNumber ?? '-';
        const prefix = f?.namePrefix || '-';
        const fname = f?.firstName || b.user?.name || '-';
        const lname = f?.lastName || '';
        const natId = f?.nationalId || '-';
        const age = f ? calcAge(f.birthDate) : '-';
        const birth = f ? formatBirth(f.birthDate) : '-';
        const nick = f?.nickname || '-';
        const phone = f?.phone || b.user?.phone || '-';

        const depIncomingCell = depositPaidSum > 0
            ? `<span class="fw-semibold">${formatMoney(depositPaidSum)}</span>`
            : '<span class="text-muted">-</span>';

        const payIncomingCell = totalPaidActive > 0
            ? `<span class="fw-semibold">${formatMoney(totalPaidActive)}</span>`
            : '<span class="text-muted">-</span>';

        const remAmt = remaining > 0
            ? `<span class="unpaid">${formatMoney(remaining)}</span>` : `<span class="paid-full">ครบ</span>`;

        // Only show addon on the first seat of this booking
        const isFirstSeat = !i || rows[i - 1].booking.id !== b.id;

        let addonSum = 0;
        let addonsHtml = '<span class="text-muted">-</span>';
        let aTotal = '<span class="text-muted">-</span>';

        if (isFirstSeat) {
            addons.forEach(a => addonSum += (a.price || 0) * (a.quantity || 1));

            const getAddonText = (a) => {
                if (!a) return '';
                const price = a.price || 0;
                const qty = a.quantity || 1;
                const total = price * qty;
                return `<div class="addon-row"><strong>${a.addon?.name || ''}</strong><br>
                        <small class="text-muted" style="font-size:.67rem;">${formatMoney(price)} × ${qty} = ${formatMoney(total)}</small></div>`;
            };

            addonsHtml = addons.length
                ? addons.map(getAddonText).join('')
                : '<span class="text-muted">-</span>';
            aTotal = addonSum > 0 ? `<span class="fw-bold text-primary">${formatMoney(addonSum)}</span>` : '<span class="text-muted">-</span>';
        }

        const cashSlipCell = isFirstSeat ? formatCashSlipHtml(r.cashPaymentSlips) : '<span class="text-muted">-</span>';

        const isCancelled = b.status === 'CANCELLED';
        const isConfirmed = b.status === 'CONFIRMED';
        const rowCls = isCancelled ? 's-cancelled' : isConfirmed ? 's-confirmed' : 's-pending';

        const actionBtns = `
               <button class="btn btn-sm btn-success py-0 px-2 me-1" ${isConfirmed || isCancelled ? 'disabled' : ''}
                   onclick="approveBookingAndInsurance(${b.id}, ${f?.id || 'null'})" title="อนุมัติการจองและกรมธรรม์">
                   <i class="bi bi-check-lg"></i>
               </button>
               <button class="btn btn-sm btn-danger py-0 px-2"
                   onclick="deleteBooking(${b.id})" title="ลบข้อมูลการจองออกจากระบบ">
                   <i class="bi bi-trash me-1"></i>ลบ
               </button>`;

        return `<tr class="${rowCls}">
            <td class="text-center no-print" style="vertical-align:middle;">
                <input type="checkbox" class="form-check-input pax-check" data-seatid="${f?.id || ''}" data-bookingid="${b.id}" onchange="onPaxCheck()">
            </td>
            <td class="text-muted" style="font-size:.7rem;">${i + 1}</td>
            <td class="text-center">${statusBadge(b.status)}</td>
            <td>${pickup}</td>
            <td class="text-center">
                <span class="seat-chip">${b.busRound?.busNumber || '-'}${f?.vanOrder > 1 ? '.' + f.vanOrder : ''}</span>
            </td>
            <td class="text-center"><span class="seat-chip">${seatNo}</span></td>
            <td class="col-div">${prefix}</td>
            <td class="fw-semibold">${fname}</td><td>${lname}</td>
            <td class="cell-id">${natId}</td>
            <td class="text-center">${age}</td><td>${birth}</td>
            <td>${nick}</td><td>${phone}</td>
            <td class="text-center align-middle">${policyInsuranceCellHtml(b, f)}</td>
            <td class="text-end col-div">${depIncomingCell}</td>
            <td class="text-end">${payIncomingCell}</td>
            <td class="text-end">${remAmt}</td>
            <td class="text-end fw-bold">${formatMoney(b.totalAmount)}</td>
            <td class="text-center align-middle">${payStatusStripHtml(r, requiredDeposit)}</td>
            <td class="col-div addon-list-cell" style="line-height:1.25;">${addonsHtml}</td>
            <td class="text-end fw-bold text-primary">${aTotal}</td>
            <td class="text-center align-middle cash-slip-col">${cashSlipCell}</td>
            <td class="text-center col-div col-link no-print">
                <a href="../bookings/view.html?id=${b.id}&fromRound=${b.busRoundId}" class="btn btn-sm btn-outline-primary py-0 px-2"
                   title="ดูรายละเอียด" target="_blank"><i class="bi bi-receipt"></i></a>
            </td>
            <td class="text-center col-div no-print">${actionBtns}</td>
        </tr>`;
    }).join('');
}

/* ════════════════════════════════════════════════════════════════
   SEAT MAP PANEL (left)
   - เลขผู้โดยสารเริ่มที่ 2 — สูตรเดียวกับ frontend/pages/booking/seats.html renderSeatGrid
   - จำนวนช่อง: ใช้ GET /seat-bookings/round/:id (เดียวกับหน้าจอง) + ปรับได้จาก dropdown (localStorage)
   - แบ่งหลายคัน: floor/rem; รวมแผงเมื่อมีแค่ 1 คันที่ active
════════════════════════════════════════════════════════════════ */

function monitorSeatPassengerStorageKey(rid) {
    return `monitorSeatPassengerSlots_${rid}`;
}

function getMonitorStoredPassengerSlots(roundId) {
    if (!roundId) return null;
    const v = localStorage.getItem(monitorSeatPassengerStorageKey(roundId));
    if (v == null || v === '') return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 1 && n <= 99 ? n : null;
}

function clearMonitorStoredPassengerSlots(roundId) {
    localStorage.removeItem(monitorSeatPassengerStorageKey(roundId));
}

/** จำนวนช่องผู้โดยสารบนแผง — seat 1 = driver/staff, ผู้โดยสารเริ่มที่ 2 */
function resolveMonitorMapPassengerSlots(round, seatSnap) {
    const apiBase = Math.max(1, (Number(seatSnap?.passengerSeats ?? seatSnap?.totalSeats ?? round?.totalSeats) || 10) - 1);
    const stored = getMonitorStoredPassengerSlots(round?.id);
    return stored != null ? stored : apiBase;
}

function setupSeatMapCapSelect(round, seatSnap) {
    const wrap = document.getElementById('seatMapCapWrap');
    const sel = document.getElementById('seatMapCapSelect');
    if (!wrap || !sel || !round) return;

    wrap.classList.remove('d-none');
    wrap.classList.add('d-flex');

    const apiBase = Math.max(1, (Number(seatSnap?.passengerSeats ?? seatSnap?.totalSeats ?? round.totalSeats) || 10) - 1);
    const stored = getMonitorStoredPassengerSlots(round.id);
    const rebuild = seatMapCapSelectRoundId !== round.id;
    seatMapCapSelectRoundId = round.id;

    if (rebuild) {
        const lo = Math.max(1, apiBase - 6);
        const hi = Math.min(60, apiBase + 8);
        sel.innerHTML = '';
        const opt0 = document.createElement('option');
        opt0.value = '';
        opt0.textContent = `ตามรอบ (${apiBase})`;
        sel.appendChild(opt0);
        for (let i = lo; i <= hi; i++) {
            const o = document.createElement('option');
            o.value = String(i);
            o.textContent = `${i} ช่อง`;
            sel.appendChild(o);
        }
    }

    if (stored != null) {
        const match = [...sel.options].some(o => o.value === String(stored));
        if (match) sel.value = String(stored);
        else {
            const o = document.createElement('option');
            o.value = String(stored);
            o.textContent = `${stored} ช่อง (บันทึก)`;
            sel.appendChild(o);
            sel.value = String(stored);
        }
    } else {
        sel.value = '';
    }
}

function onSeatMapCapSelectChange() {
    const sel = document.getElementById('seatMapCapSelect');
    if (!sel || !currentMonitorRound) return;
    if (sel.value === '') clearMonitorStoredPassengerSlots(currentMonitorRound.id);
    else {
        const n = parseInt(sel.value, 10);
        if (Number.isFinite(n) && n >= 1 && n <= 99)
            localStorage.setItem(monitorSeatPassengerStorageKey(currentMonitorRound.id), String(n));
    }
    renderSeatMap(currentMonitorRound, currentSeatRoundSnap);
}

const MONITOR_FIRST_PAX_SEAT = 2;

function monitorSlotsPerVan(totalPassengers, vanCount, vanIndex) {
    const t = Math.max(0, Math.floor(Number(totalPassengers)) || 0);
    const vc = Math.max(1, Math.floor(Number(vanCount)) || 1);
    if (!t) return 0;
    const base = Math.floor(t / vc);
    const rem = t % vc;
    return base + (vanIndex < rem ? 1 : 0);
}

/** Mirror: seats.html renderSeatGrid — row*3+col+firstSeat, n <= firstSeat + count - 1 */
function monitorSeatNumbersForPassengerCount(passengerCount, firstSeat = MONITOR_FIRST_PAX_SEAT) {
    const t = Math.max(0, Math.floor(Number(passengerCount)) || 0);
    if (!t) return [];
    const nums = [];
    const rows = Math.ceil(t / 3);
    const lastN = firstSeat + t - 1;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < 3; col++) {
            const n = row * 3 + col + firstSeat;
            if (n <= lastN) nums.push(n);
        }
    }
    return nums;
}

function renderSeatMap(round, seatSnap) {
    const el = document.getElementById('seatMapContent');
    if (!round) { el.innerHTML = '<div class="text-muted small text-center py-3">ไม่พบข้อมูล</div>'; return; }

    const apiPassengerSlots = Math.max(1, (Number(seatSnap?.passengerSeats ?? seatSnap?.totalSeats ?? round.totalSeats) || 10) - 1);
    const passengerSeats = resolveMonitorMapPassengerSlots(round, seatSnap);
    el.dataset.apiPassengerSlots = String(apiPassengerSlots);
    el.dataset.mapPassengerSlots = String(passengerSeats);
    el.title = passengerSeats !== apiPassengerSlots
        ? `แผง ${passengerSeats} ช่อง (รอบรถในระบบ ${apiPassengerSlots} — ปรับจากหัวการ์ด)`
        : '';

    // Build vanOrder → seatNumber → { gender, name, cancelled }
    const vanData = {};
    for (const row of currentRows) {
        if (!row.seat) continue;
        const van = row.seat.vanOrder || 1;
        const seat = row.seat.seatNumber;
        if (!vanData[van]) vanData[van] = {};
        vanData[van][seat] = {
            gender: row.seat.gender,
            name: `${row.seat.firstName || ''} ${row.seat.lastName || ''}`.trim() || row.booking.user?.name || '',
            nickname: row.seat.nickname,
            cancelled: row.booking.status === 'CANCELLED'
        };
    }

    const allVanKeys = Object.keys(vanData).map(Number).sort((a, b) => a - b);
    if (!allVanKeys.length) allVanKeys.push(1);

    const activeVanSet = new Set(
        currentRows
            .filter(r => r.seat && r.booking.status !== 'CANCELLED')
            .map(r => r.seat.vanOrder || 1)
    );
    const collapseToSingleGrid = activeVanSet.size <= 1 && allVanKeys.length > 1;
    const vanPanels = collapseToSingleGrid ? [allVanKeys[0]] : allVanKeys;
    const mergedSeats = {};
    if (collapseToSingleGrid) {
        for (const vk of allVanKeys) Object.assign(mergedSeats, vanData[vk] || {});
    }

    const booked = currentRows.filter(r => r.seat && r.booking.status !== 'CANCELLED').length;
    document.getElementById('seatOccupancy').textContent = `${booked}/${passengerSeats}`;

    const seatCell = (s, info) => {
        if (!info || info.cancelled) return `<div class="sc-cell" title="ว่าง — ที่นั่ง ${s}">
            <span style="font-size:.7rem;opacity:.4;">○</span>
            <span class="sc-num">${s}</span></div>`;
        const cls = info.gender === 'MALE' ? 'male' : info.gender === 'FEMALE' ? 'female' : 'booked';
        const icon = info.gender === 'MALE' ? '♂' : info.gender === 'FEMALE' ? '♀' : '●';
        const displayName = info.nickname || (info.name || '').split(' ')[0] || '';
        return `<div class="sc-cell ${cls}" title="${icon} ${info.name}">
            <span style="font-size:.75rem;line-height:1;">${icon}</span>
            <span class="sc-num">${s}</span>
            <span class="sc-name">${displayName}</span></div>`;
    };

    const vansHtml = vanPanels.map((van, vi) => {
        const seats = collapseToSingleGrid ? mergedSeats : (vanData[van] || {});
        const slotsThisVan = monitorSlotsPerVan(passengerSeats, vanPanels.length, vi);
        const nums = monitorSeatNumbersForPassengerCount(slotsThisVan);
        const cells = nums.map(n => seatCell(n, seats[n])).join('');
        const label = !collapseToSingleGrid && vanPanels.length > 1
            ? `<div class="text-muted small fw-semibold mb-2 text-center">รถตู้คันที่ ${van}</div>`
            : '';
        return `${vi > 0 ? '<hr class="my-3">' : ''}
        ${label}
        <div class="sc-windshield"></div>
        <div class="sc-front">
            <div class="sc-static"><i class="bi bi-person-badge"></i><span>Staff</span></div>
            <div class="sc-static"><i class="bi bi-person-workspace"></i><span>Driver</span></div>
        </div>
        <div class="sc-divider"></div>
        <div class="sc-grid">${cells}</div>`;
    }).join('');

    el.innerHTML = `
        ${vansHtml}
        <div class="sc-legend mt-3 pt-2 border-top">
            <div class="d-flex flex-wrap gap-2">
                <div><span class="sc-dot" style="background:#f8f9fa;border-color:#dee2e6;"></span><span>ว่าง</span></div>
                <div><span class="sc-dot" style="background:#dbeafe;border-color:#93c5fd;"></span><span>♂ ชาย</span></div>
                <div><span class="sc-dot" style="background:#fce7f3;border-color:#f9a8d4;"></span><span>♀ หญิง</span></div>
                <div><span class="sc-dot" style="background:#d1fae5;border-color:#6ee7b7;"></span><span>จอง</span></div>
            </div>
        </div>`;
}

/* ════════════════════════════════════════════════════════════════
   TAB 2 — สถานะการอนุมัติ  (1 row per booking, rich name column)
════════════════════════════════════════════════════════════════ */
function renderApproval(bookings, paymentMap, requiredDeposit = 0) {
    const el = document.getElementById('approvalBody');

    if (!bookings.length) {
        el.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-muted">ยังไม่มีการจอง</td></tr>`;
        document.getElementById('tabPendingBadge').style.display = 'none';
        return;
    }

    const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
    const badge = document.getElementById('tabPendingBadge');
    badge.textContent = pendingCount;
    badge.style.display = pendingCount > 0 ? '' : 'none';

    const dot = ok => `<span class="check-dot ${ok ? 'yes' : 'no'}">${ok ? '✓' : '✗'}</span>`;

    el.innerHTML = bookings.map((b, i) => {
        const payments = paymentMap[b.id] || [];
        const seats = b.seatBookings || [];

        // Use all active payments for display balance logic
        const activePays = payments.filter(p => p.status !== 'REJECTED');
        const paidTotal = activePays.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
        const confirmedAmt = activePays.filter(p => p.status === 'CONFIRMED').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
        const remaining = Math.max(0, parseFloat(b.totalAmount || 0) - paidTotal);

        const depositAmt = activePays.filter(p => p.type === 'DEPOSIT' && p.status === 'CONFIRMED')
            .reduce((s, p) => s + parseFloat(p.amount || 0), 0);

        const seatCount = seats.filter(s => s.seatNumber > 0).length;

        const isCancelled = b.status === 'CANCELLED';
        const isConfirmed = b.status === 'CONFIRMED';
        const rowCls = isCancelled ? 's-cancelled' : isConfirmed ? 's-confirmed' : 's-pending';

        const statusBadge = isCancelled
            ? `<span class="badge badge-cancelled">ยกเลิก</span>`
            : isConfirmed
                ? `<span class="badge badge-confirmed">ยืนยันแล้ว</span>`
                : `<span class="badge badge-pending">รอยืนยัน</span>`;

        const actionBtns = `
               <button class="btn btn-sm btn-success py-0 px-2 me-1 ${isConfirmed || isCancelled ? 'disabled' : ''}"
                   onclick="confirmBooking(${b.id})" title="อนุมัติ">
                   <i class="bi bi-check-lg"></i> อนุมัติ
               </button>
               <button class="btn btn-sm btn-danger py-0 px-2"
                   onclick="deleteBooking(${b.id})" title="ลบข้อมูลการจองออกจากระบบ">
                   <i class="bi bi-trash me-1"></i>ลบ
               </button>`;

        /* ── ชื่อผู้จอง (คนชำระเงิน) ── */
        const payerName = b.user?.name || `ผู้ใช้ #${b.userId}`;

        /* ── รายชื่อผู้โดยสารทุกคน ── */
        let passengerListHtml = '';
        if (seats.length) {
            const items = seats.map((s, si) => {
                const prefix = s.namePrefix || '';
                const fname = s.firstName || '';
                const lname = s.lastName || '';
                const fullName = `${prefix} ${fname} ${lname}`.trim() || '-';
                const vanSeat = s.vanOrder ? `${s.vanOrder}-${s.seatNumber}` : `ที่${s.seatNumber}`;
                const gIcon = s.gender === 'MALE' ? '♂' : s.gender === 'FEMALE' ? '♀' : '·';
                const pStatus = s.insuranceForm?.status || 'NONE';
                const pColor = pStatus === 'ISSUED' ? '#10b981' : pStatus === 'SUBMITTED' ? '#f59e0b' : '#94a3b8';

                return `<div class="d-flex align-items-center gap-1 py-0" style="font-size:.75rem;line-height:1.6;">
                    <span class="text-muted" style="min-width:14px;font-size:.65rem;">${si + 1}.</span>
                    <span class="seat-chip" style="font-size:.62rem;min-width:20px;height:18px;">${vanSeat}</span>
                    <span style="color:${s.gender === 'MALE' ? '#3b82f6' : s.gender === 'FEMALE' ? '#ec4899' : '#aab0be'};font-size:.7rem;">${gIcon}</span>
                    <span class="fw-semibold">${fullName}</span>
                    ${pStatus !== 'NONE' ? `<i class="bi bi-shield-fill-check ms-1" style="color:${pColor};font-size:.7rem;" title="ประกัน: ${pStatus}"></i>` : ''}
                </div>`;
            });
            passengerListHtml = `
                <div class="mt-1 pt-1" style="border-top:1px dashed #e4e6ef;">
                    ${items.join('')}
                </div>`;
        } else {
            passengerListHtml = `<div class="text-muted mt-1" style="font-size:.72rem;font-style:italic;">
                <i class="bi bi-exclamation-circle me-1 text-warning"></i>ยังไม่รับการเลือกที่นั่ง
            </div>`;
        }

        return `<tr class="${rowCls}">
            <td class="text-muted text-center" style="font-size:.72rem;vertical-align:middle;">${i + 1}</td>
            <td style="vertical-align:middle;padding:10px 12px;">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-person-circle text-primary" style="font-size:1.1rem;opacity:.8;"></i>
                    <div style="flex:1;">
                        <span class="fw-bold" style="font-size:.9rem;color:#1e293b;">${payerName}</span>
                        <span class="text-muted ms-1" style="font-size:.65rem;border-left:1px solid #e2e8f0;padding-left:6px;">ID: ${b.id}</span>
                    </div>
                </div>
                ${passengerListHtml}
            </td>
            <td class="text-center fw-medium" style="vertical-align:middle;color:#475569;">${b.user?.phone || '-'}</td>
            <td class="text-center" style="vertical-align:middle;">
                <span class="badge" style="background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;font-size:.78rem;font-weight:600;min-width:48px;">${b.seats}</span>
            </td>
            <td class="text-center" style="vertical-align:middle;">${dot(seatCount > 0)}</td>
            <td class="text-center" style="vertical-align:middle;">${dot(depositAmt >= requiredDeposit && requiredDeposit > 0)}</td>
            <td class="text-center" style="vertical-align:middle;">${dot(remaining <= 0)}</td>
            <td class="text-center" style="vertical-align:middle;">${statusBadge}</td>
            <td class="text-end fw-bold" style="vertical-align:middle;font-size:.95rem;color:#0f172a;padding-right:15px;">${formatMoney(b.totalAmount)}</td>
            <td class="text-center no-print" style="vertical-align:middle;">${actionBtns}</td>
        </tr>`;
    }).join('');
}

/* ════════════════════════════════════════════════════════════════
   BOOKING ACTIONS
════════════════════════════════════════════════════════════════ */
async function approveBookingAndInsurance(bookingId, seatBookingId = null) {
    try {
        // 1. Confirm Booking
        await API.bookings.updateStatus(bookingId, 'CONFIRMED');

        // 2. Approve Insurance(s)
        const forms = await API.insurance.getByBooking(bookingId);
        if (forms && forms.length > 0) {
            // If seatBookingId provided, only approve that one. Else approve ALL.
            const targets = seatBookingId
                ? forms.filter(f => f.seatBookingId === seatBookingId)
                : forms;

            for (const f of targets) {
                if (f.status !== 'ISSUED') {
                    await API.insurance.review(f.id, { status: 'ISSUED' });
                }
            }
        }

        showToast('อนุมัติการจองและกรมธรรม์เรียบร้อย');
        await loadMonitor();
    } catch (e) {
        showToast('ล้มเหลว: ' + e.message, 'danger');
    }
}

function openCancelModal(bookingId) {
    pendingCancelId = bookingId;
    document.getElementById('cancelBookingId').textContent = bookingId;
    document.getElementById('cancelReason').value = '';
    cancelModal.show();
}

async function confirmCancel() {
    if (!pendingCancelId) return;
    try {
        const reason = document.getElementById('cancelReason').value;
        await API.bookings.updateStatus(pendingCancelId, 'CANCELLED', reason);
        cancelModal.hide();
        showToast('ยกเลิกการจองสำเร็จ');
        pendingCancelId = null;
        await loadMonitor();
    } catch (e) { showToast(e.message, 'danger'); }
}

async function deleteBooking(id) {
    if (!confirm(`ลบการจอง #${id} ออกจากระบบ?\n\nข้อมูลจะถูกลบถาวร ไม่สามารถกู้คืนได้`)) return;
    try {
        // ยกเลิกก่อน (ถ้ายังไม่ถูกยกเลิก) แล้วลบ
        const booking = currentBookings.find(b => b.id === id);
        if (booking && booking.status !== 'CANCELLED') {
            await API.bookings.updateStatus(id, 'CANCELLED');
        }
        await API.bookings.delete(id);
        showToast(`ลบการจอง #${id} สำเร็จ`);
        await loadMonitor();
    } catch (e) {
        showToast('ลบไม่สำเร็จ: ' + (e.message || 'เกิดข้อผิดพลาด'), 'danger');
    }
}

/* ════════════════════════════════════════════════════════════════
   PRINT  —  เปิดหน้า report แยก
════════════════════════════════════════════════════════════════ */
function openReport(mode = 'passenger') {
    const roundId = document.getElementById('filterRound').value;
    if (!roundId) { showToast('กรุณาเลือกรอบรถก่อน', 'warning'); return; }
    window.open(`./report.html?roundId=${roundId}&mode=${mode}`, '_blank');
}

/* ── Individual Print Selection ── */
function toggleAllPax(el) {
    document.querySelectorAll('.pax-check').forEach(chk => chk.checked = el.checked);
    updateSelectedCount();
}

function onPaxCheck() {
    const all = document.querySelectorAll('.pax-check').length;
    const checked = document.querySelectorAll('.pax-check:checked').length;
    document.getElementById('checkAllPax').checked = (all === checked && all > 0);
    updateSelectedCount();
}

function updateSelectedCount() {
    const checked = document.querySelectorAll('.pax-check:checked').length;
    document.getElementById('selectedCount').textContent = checked;
    document.getElementById('btnPrintSelected').style.display = checked > 0 ? '' : 'none';
}

function printSelected() {
    const roundId = document.getElementById('filterRound').value;
    const selected = Array.from(document.querySelectorAll('.pax-check:checked')).map(chk => {
        return chk.dataset.seatid || `b:${chk.dataset.bookingid}`;
    });
    if (!selected.length) return;

    // Pass selection as comma-separated string
    const target = `./report.html?roundId=${roundId}&mode=passenger&select=${selected.join(',')}`;
    window.open(target, '_blank');
}

/* ════════════════════════════════════════════════════════════════
   EXPORT  (CSV / Excel)
════════════════════════════════════════════════════════════════ */
function buildPassengerExport() {
    if (!currentRows.length) return null;
    const headers = [
        '#', 'สถานะ', 'จุดขึ้นรถ', 'รถ#', 'นั่ง#',
        'คำนำ', 'ชื่อ', 'นามสกุล', 'เลขบัตร', 'อายุ', 'วันเกิด', 'ชื่อเล่น', 'โทรศัพท์', 'กรมธรรม์',
        'ยอดมัดจำเข้ามา', 'ยอดชำระเข้ามา(สะสม)', 'คงเหลือ', 'ยอดสุทธิ', 'สถานะสรุป',
        'รายการของเช่า (ทั้งหมด)', 'รวมค่าเช่า', 'สลิปเงินสดชำระเงิน (ลิงก์)'
    ];
    const data = currentRows.map((r, i) => {
        const { seat: f, booking: b, depositPaidSum, totalPaidActive, remaining, addons } = r;
        const tripDep = b.busRound?.trip?.deposit || 0;

        const isFirstSeat = !i || currentRows[i - 1].booking.id !== b.id;
        let addonSum = 0;
        if (isFirstSeat) addons.forEach(a => addonSum += (a.price || 0) * (a.quantity || 1));

        const policyStatus = f?.insuranceForm?.status || 'NONE';

        const addonsPlain = isFirstSeat && addons.length
            ? addons.map(a => {
                const t = (a.price || 0) * (a.quantity || 1);
                return `${(a.addon?.name || '').trim()} ×${a.quantity || 1} = ${t}`;
            }).join(' | ')
            : '';

        const cashSlipUrls = isFirstSeat && r.cashPaymentSlips?.length
            ? r.cashPaymentSlips.filter(s => isSafeHttpUrl(s.slipUrl)).map(s => s.slipUrl.trim()).join('; ')
            : '';

        return [
            i + 1, b.status,
            f?.pickupPoint || b.busRound?.startPoint || '',
            b.busRound?.busNumber || '', f?.seatNumber ?? '',
            f?.namePrefix || '',
            f?.firstName || b.user?.name || '',
            f?.lastName || '',
            f?.nationalId || '',
            f ? calcAge(f.birthDate) : '',
            f ? formatBirth(f.birthDate) : '',
            f?.nickname || '',
            f?.phone || b.user?.phone || '',
            policyStatus,
            depositPaidSum || 0,
            totalPaidActive || 0,
            remaining > 0 ? remaining : 0,
            b.totalAmount,
            payStatusLegend(r, tripDep),
            addonsPlain,
            addonSum || '',
            cashSlipUrls
        ];
    });
    return [headers, ...data];
}

function buildApprovalExport() {
    if (!currentBookings.length) return null;
    const headers = ['#', 'ผู้จอง / ID', 'โทรศัพท์', 'ที่นั่ง', 'เลือกที่นั่ง', 'มัดจำ', 'ชำระครบ', 'สถานะ', 'รวม'];
    const data = currentBookings.map((b, i) => {
        const pays = currentPaymentMap[b.id] || [];
        const paid = pays.filter(p => p.status === 'CONFIRMED').reduce((s, p) => s + p.amount, 0);
        const rem = Math.max(0, b.totalAmount - paid);
        const seats = b.seatBookings || [];
        const sCount = seats.filter(s => s.seatNumber > 0).length;
        const reqDep = b.busRound?.trip?.deposit || 0;
        return [
            i + 1, `${b.user?.name || '-'} (#${b.id})`, b.user?.phone || '',
            b.seats, sCount > 0 ? 'Y' : 'N', paid >= reqDep ? 'Y' : 'N', rem <= 0 ? 'Y' : 'N',
            b.status, b.totalAmount
        ];
    });
    return [headers, ...data];
}

function buildExpenseExport() {
    if (!currentRoundExpenses.length) return null;
    const headers = ['#', 'หมวดหมู่', 'รายละเอียด', 'จำนวนเงิน', 'วันที่'];
    const data = currentRoundExpenses.map((e, i) => [
        i + 1, e.category, e.description, e.amount, e.date ? formatBirth(e.date) : ''
    ]);
    return [headers, ...data];
}

function exportCSV() {
    if (!currentRows.length) { showToast('ไม่มีข้อมูล', 'warning'); return; }
    const parts = [
        { name: 'PASSENGER_LIST', data: buildPassengerExport() },
        { name: 'APPROVAL_STATUS', data: buildApprovalExport() },
        { name: 'EXPENSES', data: buildExpenseExport() }
    ];

    let content = '';
    parts.forEach(p => {
        if (!p.data) return;
        content += `\n--- ${p.name} ---\n`;
        content += p.data.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
    });

    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const roundId = document.getElementById('filterRound').value;
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `monitor_${roundId}.csv` }).click();
}

function exportExcel() {
    if (!currentRows.length) { showToast('ไม่มีข้อมูล', 'warning'); return; }
    const wb = XLSX.utils.book_new();

    // Sheet 1: Passengers
    const pData = buildPassengerExport();
    if (pData) {
        const ws = XLSX.utils.aoa_to_sheet(pData);
        ws['!cols'] = [
            { wch: 4 }, { wch: 10 }, { wch: 14 }, { wch: 5 }, { wch: 5 },
            { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 4 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 8 },
            { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 40 },
            { wch: 48 }, { wch: 10 }, { wch: 36 }
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'ผู้โดยสาร');
    }

    // Sheet 2: Approval
    const aData = buildApprovalExport();
    if (aData) {
        const ws = XLSX.utils.aoa_to_sheet(aData);
        ws['!cols'] = [{ wch: 4 }, { wch: 25 }, { wch: 12 }, { wch: 6 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, ws, 'สถานะอนุมัติ');
    }

    // Sheet 3: Expenses
    const eData = buildExpenseExport();
    if (eData) {
        const ws = XLSX.utils.aoa_to_sheet(eData);
        ws['!cols'] = [{ wch: 4 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, ws, 'รายจ่าย');
    }

    const roundId = document.getElementById('filterRound').value;
    XLSX.writeFile(wb, `monitor_round_${roundId}.xlsx`);
}

/* ════════════════════════════════════════════════════════════════
   TAB 3 — รายจ่าย (Expenses per round)
════════════════════════════════════════════════════════════════ */
let expenseModal;
let currentRoundExpenses = [];

const EXP_CAT_COLOR = {
    'รายจ่าย จานช้อน': 'bg-warning text-dark',
    'อุปกรณ์สิ้นเปลือง': 'bg-info text-dark',
    'ค่าซักเต็นท์เช่า': 'bg-primary',
    'ค่าบริการซักถุงนอนเช่า': 'bg-primary',
    'ค่าซักอุปกรณ์กองกลาง': 'bg-secondary',
    'อาหาร': 'bg-success',
    'เงินสำรอง': 'bg-light text-dark border',
    'ประกันภัย': 'bg-danger',
    'ค่ารถ': 'bg-dark',
    'ค่าสตาฟ': 'bg-purple text-white',
    'อื่นๆ': 'bg-secondary',
};

/* เรียกเมื่อ click tab รายจ่าย */
function onExpenseTabShow() {
    const roundId = document.getElementById('filterRound').value;
    if (!roundId) {
        document.getElementById('expenseBody').innerHTML =
            '<tr><td colspan="6" class="text-center py-4 text-muted">กรุณาเลือกรอบรถก่อน</td></tr>';
        return;
    }
    loadExpenseForRound(roundId);
}

async function loadExpenseForRound(roundId) {
    try {
        const all = await API.expenses.list();
        currentRoundExpenses = all.filter(e => String(e.busRoundId) === String(roundId));
        renderExpenseTab();
    } catch (e) {
        showToast('โหลดรายจ่ายล้มเหลว', 'danger');
    }
}

function renderExpenseTab() {
    const data = currentRoundExpenses;
    const total = data.reduce((s, e) => s + e.amount, 0);

    // Update badge on tab button
    const badge = document.getElementById('tabExpenseBadge');
    if (data.length > 0) {
        badge.textContent = data.length;
        badge.style.display = '';
    } else {
        badge.style.display = 'none';
    }

    // Update total label
    document.getElementById('expenseRoundTotal').textContent = '฿' + formatMoney(total);

    // Category summary chips
    const catMap = {};
    data.forEach(e => {
        if (!catMap[e.category]) catMap[e.category] = 0;
        catMap[e.category] += e.amount;
    });
    document.getElementById('expenseCatSummary').innerHTML = Object.entries(catMap).map(([cat, amt]) =>
        `<span class="badge ${EXP_CAT_COLOR[cat] || 'bg-secondary'} py-1 px-2" style="font-size:.75rem;">
            ${cat}: <strong>฿${formatMoney(amt)}</strong>
        </span>`
    ).join('');

    // Table
    const tbody = document.getElementById('expenseBody');
    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">ยังไม่มีรายจ่ายในรอบนี้</td></tr>';
        document.getElementById('expenseFoot').style.display = 'none';
        return;
    }

    tbody.innerHTML = data.map((e, i) => `
        <tr>
            <td class="text-muted" style="font-size:.7rem;">${i + 1}</td>
            <td><span class="badge ${EXP_CAT_COLOR[e.category] || 'bg-secondary'}">${e.category}</span></td>
            <td>${e.description || '<span class="text-muted">-</span>'}</td>
            <td class="text-end fw-bold text-danger">${formatMoney(e.amount)}</td>
            <td class="text-muted small">${formatDateThai ? formatDateThai(e.date) : (e.date || '-')}</td>
            <td class="text-center no-print">
                <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="deleteExpense(${e.id})" title="ลบ">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>`
    ).join('');

    document.getElementById('expenseFootTotal').textContent = formatMoney(total);
    document.getElementById('expenseFoot').style.display = '';
}

function openExpenseModal() {
    const roundId = document.getElementById('filterRound').value;
    if (!roundId) { showToast('กรุณาเลือกรอบรถก่อน', 'warning'); return; }

    if (!expenseModal) expenseModal = new bootstrap.Modal(document.getElementById('expenseModal'));
    document.getElementById('expenseForm').reset();
    document.getElementById('fExpDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('fExpRoundId').value = roundId;
    expenseModal.show();
}

async function saveExpenseFromMonitor() {
    const roundId = document.getElementById('fExpRoundId').value;
    const category = document.getElementById('fExpCategory').value;
    const desc = document.getElementById('fExpDesc').value;
    const amount = parseFloat(document.getElementById('fExpAmount').value);
    const date = document.getElementById('fExpDate').value;

    if (!category || isNaN(amount) || amount <= 0) {
        showToast('กรุณากรอกหมวดหมู่และจำนวนเงิน', 'warning');
        return;
    }

    try {
        await API.expenses.create({
            category,
            description: desc,
            amount,
            date: date || undefined,
            ...(roundId ? { busRoundId: Number(roundId) } : {})
        });
        expenseModal.hide();
        showToast('บันทึกค่าใช้จ่ายสำเร็จ');
        await loadExpenseForRound(roundId);
    } catch (e) {
        showToast(e.message || 'บันทึกล้มเหลว', 'danger');
    }
}

async function deleteExpense(id) {
    if (!confirm('ยืนยันลบรายการนี้?')) return;
    try {
        await API.expenses.delete(id);
        showToast('ลบรายการสำเร็จ');
        const roundId = document.getElementById('filterRound').value;
        await loadExpenseForRound(roundId);
    } catch (e) {
        showToast(e.message || 'ลบล้มเหลว', 'danger');
    }
}
