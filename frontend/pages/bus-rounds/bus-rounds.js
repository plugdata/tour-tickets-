/**
 * Bus Rounds Page Logic
 */

let roundModal, startPicker, endPicker;
let fStartPicker, fEndPicker, fNewRoundPicker;
let trips = [], allRounds = [];
let pagination;
let currentPage = 1, perPage = 9, filteredData = [];
let currentViewMode = 'grid';
let _tripRoundsByDate = {};
let _editingIds = [];
let _isCreatingNewRound = false;

async function initBusRoundsPage() {
    // 1. Initialize Authentication and Component Loading (Sidebar, Header)
    await initPage();

    // 2. Load Modal Component
    await loadComponent('bus-rounds-modal.html', 'modal-container');

    // 3. Initialize Modal Object
    roundModal = new bootstrap.Modal(document.getElementById('roundModal'));

    // 4. Fetch Trips and Populate Dropdown
    try {
        trips = await API.trips.list();
        const fSel = document.getElementById('fTripId');
        if (fSel) {
            fSel.innerHTML = '<option value="">-- กรุณาเลือกทริป --</option>';
            trips.forEach(t => fSel.insertAdjacentHTML('beforeend', `<option value="${t.id}">${t.title}</option>`));
        }
    } catch (e) {
        console.error('Failed to load trips:', e);
    }

    // 5. Initialize Pagination
    pagination = new PaginationManager({
        containerId: 'roundPagination',
        onPageChange: (p) => { currentPage = p; renderRounds(false); },
        onPerPageChange: (pp) => { perPage = pp; currentPage = 1; renderRounds(false); }
    });

    // 6. Handle URL Parameters
    const urlTripId = new URLSearchParams(location.search).get('tripId');
    if (urlTripId) {
        const matched = trips.find(t => String(t.id) === urlTripId);
        if (matched) {
            const filterInput = document.getElementById('filterTrip');
            if (filterInput) filterInput.value = matched.title;
        }
    }

    // 7. Load Bus Rounds Data
    await loadRounds();

    // 8. Initialize Thai Calendar Pickers
    startPicker = await ThaiCalendar.init('#startDate', { onChange: () => renderRounds() });
    endPicker = await ThaiCalendar.init('#endDate', { onChange: () => renderRounds() });
    fStartPicker = await ThaiCalendar.init('#fStartDate', { onChange: calcDuration });
    fEndPicker = await ThaiCalendar.init('#fEndDate', { onChange: calcDuration });
    fNewRoundPicker = await ThaiCalendar.init('#fNewRoundDate', { onChange: onNewRoundDateSelected, inline: false });

    // 9. Global Click Handler for Dropdowns
    document.addEventListener('click', e => {
        const filterTrip = document.getElementById('filterTrip');
        const dropdown = document.getElementById('tripFilterDropdown');
        if (filterTrip && dropdown && !filterTrip.contains(e.target) && !dropdown.contains(e.target)) {
            hideTripDropdown();
        }
    });

    console.log('Bus Rounds Page Initialized');
}

// ─── Trip Filter Autocomplete ────────────────────────────────
function showTripDropdown() {
    const filterInput = document.getElementById('filterTrip');
    const q = filterInput ? filterInput.value.toLowerCase().trim() : '';
    const dd = document.getElementById('tripFilterDropdown');
    if (!dd) return;

    const filtered = q ? trips.filter(t => t.title.toLowerCase().includes(q)) : trips;
    if (!filtered.length) { dd.classList.add('d-none'); return; }

    dd.innerHTML = filtered.map(t => `
        <div class="px-3 py-2" style="cursor:pointer;font-size:.88rem;border-bottom:1px solid #f0f0f0;"
            onmousedown="selectTrip('${t.title.replace(/'/g, "\\'")}')"
            onmouseover="this.style.background='#f0fdf9'" onmouseout="this.style.background=''">
            <i class="bi bi-map me-2 text-muted" style="font-size:.8rem;"></i>${t.title}
        </div>`).join('');
    dd.classList.remove('d-none');
}

function onFilterTripInput() { showTripDropdown(); renderRounds(); }
function selectTrip(title) { document.getElementById('filterTrip').value = title; hideTripDropdown(); renderRounds(); }
function hideTripDropdown() { 
    const dd = document.getElementById('tripFilterDropdown');
    if (dd) dd.classList.add('d-none'); 
}
function clearTripFilter() { document.getElementById('filterTrip').value = ''; hideTripDropdown(); renderRounds(); }
function clearDateRange() { if (startPicker) startPicker.clear(); if (endPicker) endPicker.clear(); renderRounds(); }
function handleTripFilterKey(e) {
    if (e.key === 'Escape') hideTripDropdown();
    if (e.key === 'Enter') { hideTripDropdown(); renderRounds(); }
}

// ─── Data Loading & Rendering ────────────────────────────────
async function loadRounds() {
    try {
        const published = await API.busRounds.list();
        const drafts = await API.draftBusRounds.list();

        // Mark drafts and merge with published rounds
        // Drafts don't have bookedSeats, so default to 0
        const draftRounds = drafts.map(d => ({
            ...d,
            isDraft: true,
            bookedSeats: 0,
            isOpen: true
        }));
        allRounds = [...published, ...draftRounds];

        renderRounds();
    } catch (e) {
        console.error(e);
        showToast('โหลดข้อมูลล้มเหลว', 'danger');
    }
}

function renderRounds(resetPage = true) {
    if (resetPage) currentPage = 1;
    
    const tripFilter = document.getElementById('filterTrip');
    const searchFilter = document.getElementById('searchInput');
    const startFilter = document.getElementById('startDate');
    const endFilter = document.getElementById('endDate');

    const tripQ = tripFilter ? tripFilter.value.toLowerCase().trim() : '';
    const startQ = startFilter ? startFilter.value : '';
    const endQ = endFilter ? endFilter.value : '';
    const q = searchFilter ? searchFilter.value.toLowerCase().trim() : '';
    
    let data = allRounds;
    if (tripQ) data = data.filter(r => (r.trip?.title || '').toLowerCase().includes(tripQ));
    if (startQ || endQ) data = ThaiCalendar.filterByDateRange(data, 'departDate', startQ, endQ);
    if (q) data = data.filter(r => {
        const pts = typeof r.pickupPoints === 'string' ? JSON.parse(r.pickupPoints || '[]') : (r.pickupPoints || []);
        return (r.startPoint || '').toLowerCase().includes(q) ||
            pts.some(p => p.name.toLowerCase().includes(q));
    });

    filteredData = data;
    
    const gridContainer = document.getElementById('roundsGrid');
    const tableBody = document.getElementById('roundsTableBody');
    const noData = document.getElementById('tableNoData');

    if (!data.length) {
        if (gridContainer) gridContainer.innerHTML = '<div class="col-12 text-center py-4 text-muted">ไม่พบรอบรถ</div>';
        if (noData) noData.classList.remove('d-none');
        if (tableBody) tableBody.innerHTML = '';
        if (pagination) pagination.render({ totalRecords: 0, currentPage, perPage });
        return;
    }

    if (noData) noData.classList.add('d-none');
    const pagedData = data.slice((currentPage - 1) * perPage, currentPage * perPage);
    
    if (currentViewMode === 'grid') renderGridView(pagedData);
    else renderTableView(pagedData);
    
    if (pagination) pagination.render({ totalRecords: data.length, currentPage, perPage });
}

function renderGridView(pagedData) {
    const grid = document.getElementById('roundsGrid');
    if (!grid) return;

    grid.innerHTML = pagedData.map(r => {
        const pct = r.totalSeats ? Math.round(((r.bookedSeats || 0) / r.totalSeats) * 100) : 0;
        const isFull = r.bookedSeats >= r.totalSeats;
        const pts = typeof r.pickupPoints === 'string' ? JSON.parse(r.pickupPoints || '[]') : (r.pickupPoints || []);

        return `<div class="col-md-6 col-xl-4">
            <div class="card h-100 ${!r.isOpen ? 'border-secondary opacity-75' : ''} ${r.isDraft ? 'border-warning' : ''}">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span class="fw-semibold"><i class="bi bi-bus-front me-1"></i>รถ${r.busNumber} — ${r.trip?.title || ''}</span>
                    <div class="d-flex gap-2">
                        ${r.isDraft ? `<span class="badge bg-warning text-dark">ร่าง</span>` : ''}
                        <span class="badge ${r.isOpen ? 'bg-success' : 'bg-secondary'}">${r.isOpen ? 'เปิดจอง' : 'ปิดจอง'}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="mb-1 text-primary small fw-bold"><i class="bi bi-geo-alt-fill me-1"></i>${r.startPoint}</div>
                    ${pts.length > 1 ? `<div class="mb-2 ps-2 border-start text-muted" style="font-size:.75rem;margin-left:.35rem;">
                        ${pts.slice(1).map(p => `<div class="mb-1"><i class="bi bi-plus-circle me-1" style="font-size:.6rem"></i>${p.name}${p.price > 0 ? ` <span class="text-success fw-bold">+${p.price}</span>` : ''}</div>`).join('')}
                    </div>` : ''}
                    <div class="mb-2 text-muted small"><i class="bi bi-calendar me-1"></i>${formatDateTime(r.departDate)}</div>
                    ${r.extraPrice > 0 ? `<div class="mb-2 text-success small fw-semibold"><i class="bi bi-plus-circle me-1"></i>ราคาเพิ่ม: +${formatMoney(r.extraPrice)}</div>` : ''}
                    ${r.duration ? `<div class="mb-2 text-muted small"><i class="bi bi-clock me-1"></i>${r.duration}</div>` : ''}
                    <div class="mb-1 d-flex justify-content-between small">
                        <span>ที่นั่ง</span>
                        <span class="fw-semibold ${isFull ? 'text-danger' : ''}">${r.bookedSeats}/${r.totalSeats}</span>
                    </div>
                    <div class="progress mb-3" style="height:6px">
                        <div class="progress-bar ${isFull ? 'bg-danger' : 'bg-success'}" style="width:${pct}%"></div>
                    </div>
                    <div class="d-flex gap-2 flex-wrap">
                        <a href="/frontend/pages/monitor/list.html?roundId=${r.id}" class="btn btn-sm btn-outline-primary flex-fill">
                            <i class="bi bi-ticket-perforated me-1"></i>ดูตั๋ว
                            ${r.bookedSeats > 0 ? `<span class="badge bg-primary ms-1">${r.bookedSeats}</span>` : ''}
                        </a>
                        <a href="/frontend/pages/booking/seats.html?roundId=${r.id}" class="btn btn-sm btn-outline-warning" target="_blank" title="จองที่นั่ง">
                            <i class="bi bi-grid-3x3-gap"></i>
                        </a>
                        <button class="btn btn-sm ${r.isOpen ? 'btn-outline-danger' : 'btn-outline-success'}"
                            onclick="toggleRound(${r.id})" title="${r.isOpen ? 'ปิดจอง' : 'เปิดจอง'}">
                            <i class="bi bi-${r.isOpen ? 'lock' : 'unlock'}"></i>
                        </button>
                        <a href="/frontend/pages/reports/print.html?roundId=${r.id}" class="btn btn-sm btn-outline-secondary" title="พิมพ์">
                            <i class="bi bi-printer"></i>
                        </a>
                        <button class="btn btn-sm btn-outline-primary" onclick="editRoundById(${r.id})" title="แก้ไข">
                            <i class="bi bi-pencil"></i>
                        </button>
                        ${r.isDraft ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteDraft(${r.id})" title="ลบร่าง">
                            <i class="bi bi-trash"></i>
                        </button>` : ''}
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

function renderTableView(pagedData) {
    const tableBody = document.getElementById('roundsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = pagedData.map(r => {
        const pct = r.totalSeats ? Math.round(((r.bookedSeats || 0) / r.totalSeats) * 100) : 0;
        const isFull = (r.bookedSeats || 0) >= (r.totalSeats || 0);
        const pts = typeof r.pickupPoints === 'string' ? JSON.parse(r.pickupPoints || '[]') : (r.pickupPoints || []);
        const allPts = pts.map(p => p.name).join(' → ');
        
        return `<tr style="height:50px;border-bottom:1px solid #e9ecef;background-color:${!r.isOpen ? '#f8f9fa' : '#fff'};">
            <td style="padding:12px 10px;border-right:1px solid #e9ecef;text-align:center;font-weight:500;">${formatDateTime(r.departDate)}</td>
            <td style="padding:12px 10px;border-right:1px solid #e9ecef;text-align:center;font-weight:600;font-size:1.1rem;">
                <i class="bi bi-bus-front me-2 text-info"></i><span class="text-primary">${r.busNumber}</span>
            </td>
            <td style="padding:12px 10px;border-right:1px solid #e9ecef;"><strong>${r.trip?.title || '-'}</strong></td>
            <td style="padding:12px 10px;border-right:1px solid #e9ecef;"><small class="text-muted">${allPts || r.startPoint}</small></td>
            <td style="padding:12px 10px;border-right:1px solid #e9ecef;text-align:center;">
                <span class="fw-semibold ${isFull ? 'text-danger' : 'text-success'}">${r.bookedSeats || 0}/${r.totalSeats}</span>
                <div class="progress mt-1" style="height:5px;width:70px;margin:0 auto;">
                    <div class="progress-bar ${isFull ? 'bg-danger' : 'bg-success'}" style="width:${pct}%"></div>
                </div>
            </td>
            <td style="padding:12px 10px;border-right:1px solid #e9ecef;text-align:center;">
                <span class="badge ${r.isDraft ? 'bg-warning text-dark' : (r.isOpen ? 'bg-success' : 'bg-secondary')} px-2 py-1">${r.isDraft ? '✎ ร่าง' : (r.isOpen ? '✓ เปิด' : '✕ ปิด')}</span>
            </td>
            <td style="padding:12px 10px;text-align:center;">
                <div class="d-flex gap-1 justify-content-center">
                    <a href="/frontend/pages/monitor/list.html?roundId=${r.id}" class="btn btn-sm btn-outline-info"><i class="bi bi-ticket-perforated"></i></a>
                    <button class="btn btn-sm btn-outline-warning" onclick="toggleRound(${r.id})"><i class="bi bi-${r.isOpen ? 'lock' : 'unlock'}"></i></button>
                    <a href="/frontend/pages/reports/print.html?roundId=${r.id}" class="btn btn-sm btn-outline-secondary"><i class="bi bi-printer"></i></a>
                    <button class="btn btn-sm btn-outline-primary" onclick="editRoundById(${r.id})"><i class="bi bi-pencil"></i></button>
                    ${r.isDraft ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteDraft(${r.id})"><i class="bi bi-trash"></i></button>` : ''}
                </div>
            </td>
        </tr>`;
    }).join('');
}

function switchView(viewMode) {
    currentViewMode = viewMode;
    const isGrid = viewMode === 'grid';
    
    const gridBtn = document.getElementById('gridViewBtn');
    const tableBtn = document.getElementById('tableViewBtn');
    const gridContainer = document.getElementById('gridContainer');
    const tableContainer = document.getElementById('tableContainer');

    if (gridBtn) {
        gridBtn.classList.toggle('active', isGrid);
        gridBtn.classList.toggle('text-muted', !isGrid);
    }
    if (tableBtn) {
        tableBtn.classList.toggle('active', !isGrid);
        tableBtn.classList.toggle('text-muted', isGrid);
    }
    if (gridContainer) gridContainer.classList.toggle('d-none', !isGrid);
    if (tableContainer) tableContainer.classList.toggle('d-none', isGrid);
    
    renderRounds(false);
}

// ─── Export ───────────────────────────────────────────────────
function exportToCSV() {
    if (!filteredData.length) return showToast('ไม่มีข้อมูล', 'warning');
    const headers = ['วันที่ออกเดินทาง', 'ตู่', 'ทริป', 'เส้นทาง', 'ที่นั่ง', 'สถานะ'];
    const rows = filteredData.map(r => {
        const pts = typeof r.pickupPoints === 'string' ? JSON.parse(r.pickupPoints || '[]') : (r.pickupPoints || []);
        return [formatDateTime(r.departDate), r.busNumber, r.trip?.title || '-', pts.map(p => p.name).join(' → ') || r.startPoint, `${r.bookedSeats || 0}/${r.totalSeats}`, r.isDraft ? 'ร่าง' : (r.isOpen ? 'เปิด' : 'ปิด')];
    });
    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { 
        href: URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })), 
        download: `bus-rounds-${new Date().toISOString().split('T')[0]}.csv` 
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('ส่งออก CSV สำเร็จ', 'success');
}

function exportToPDF() {
    if (!filteredData.length) return showToast('ไม่มีข้อมูล', 'warning');
    const w = window.open('', '', 'height=600,width=800');
    const rows = filteredData.map(r => {
        const pts = typeof r.pickupPoints === 'string' ? JSON.parse(r.pickupPoints || '[]') : (r.pickupPoints || []);
        return `<tr><td>${formatDateTime(r.departDate)}</td><td>${r.busNumber}</td><td>${r.trip?.title || '-'}</td><td>${pts.map(p => p.name).join(' → ') || r.startPoint}</td><td>${r.bookedSeats || 0}/${r.totalSeats}</td><td class="${r.isDraft ? 'draft' : (r.isOpen ? 'open' : 'closed')}">${r.isDraft ? 'ร่าง' : (r.isOpen ? 'เปิด' : 'ปิด')}</td></tr>`;
    }).join('');
    w.document.write(`<html><head><meta charset="UTF-8"><title>รอบรถ</title><style>body{font-family:Sarabun,Arial,sans-serif;margin:20px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ddd;text-align:left}th{background:#f0f0f0}.open{color:green;font-weight:bold}.closed{color:gray}</style></head><body><h2>รอบรถ / ตั๋ว</h2><p>${new Date().toLocaleString('th-TH')}</p><table><thead><tr><th>วันที่</th><th>ตู่</th><th>ทริป</th><th>เส้นทาง</th><th>ที่นั่ง</th><th>สถานะ</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 250);
}

// ─── Modal Logic: Trip → Round ────────────────────────────────
function onTripChange() {
    const tripId = parseInt(document.getElementById('fTripId').value);
    const details = document.getElementById('roundDetailsSection');
    const roundSelect = document.getElementById('fRoundSelect');

    if (details) details.style.display = 'none';
    if (roundSelect) roundSelect.innerHTML = '<option value="">-- ไม่มีการเลือก --</option>';

    _tripRoundsByDate = {};
    if (!tripId) return;

    allRounds.filter(r => r.tripId === tripId).forEach(r => {
        const dk = new Date(r.departDate).toISOString().split('T')[0];
        if (!_tripRoundsByDate[dk]) _tripRoundsByDate[dk] = [];
        _tripRoundsByDate[dk].push(r);
    });

    // Populate Round Select directly
    if (roundSelect) {
        Object.keys(_tripRoundsByDate).sort().forEach(d => {
            const label = new Date(d + 'T00:00:00').toLocaleDateString('th-TH', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
            });
            roundSelect.insertAdjacentHTML('beforeend', `<option value="${d}">${label}</option>`);
        });
    }
}

// Remove filterRoundsByMonth as it's no longer used

function onRoundSelect() {
    const roundSelect = document.getElementById('fRoundSelect');
    const dateKey = roundSelect ? roundSelect.value : '';
    const details = document.getElementById('roundDetailsSection');

    if (!dateKey) {
        if (details) details.style.display = 'none';
        return;
    }

    const buses = _tripRoundsByDate[dateKey] || [];
    const first = buses[0];

    if (fStartPicker) fStartPicker.setDate(new Date(dateKey + 'T00:00:00'));
    if (fEndPicker && first?.returnDate) fEndPicker.setDate(new Date(first.returnDate));

    const durationDisplay = document.getElementById('durationDisplay');
    if (durationDisplay) {
        durationDisplay.textContent = first?.duration || '-';
    }

    const responsibleInput = document.getElementById('fResponsiblePerson');
    if (responsibleInput) responsibleInput.value = first?.responsiblePerson || '';

    const extraPriceInput = document.getElementById('fExtraPrice');
    if (extraPriceInput) extraPriceInput.value = first?.extraPrice || 0;

    const departureTimeInput = document.getElementById('fDepartureTime');
    if (departureTimeInput && first?.departDate) {
        const departTime = new Date(first.departDate);
        departureTimeInput.value = `${String(departTime.getHours()).padStart(2, '0')}:${String(departTime.getMinutes()).padStart(2, '0')}`;
    }

    const vehicleList = document.getElementById('vehicleList');
    if (vehicleList) {
        vehicleList.innerHTML = '';
        _editingIds = [];
        buses.forEach(b => {
            _editingIds.push(b.id);
            addVehicleRow(b.busNumber, b.totalSeats, b.isOpen, b.id);
        });
    }

    const pickupList = document.getElementById('pickupList');
    if (pickupList) {
        pickupList.innerHTML = '';
        const pts = first?.pickupPoints
            ? (typeof first.pickupPoints === 'string' ? JSON.parse(first.pickupPoints) : first.pickupPoints)
            : [];
        if (pts.length) pts.forEach(p => addPickupRow(p.name, p.price));
        else addPickupRow('ลานจอดรถ BTS หมอชิต', 0);
    }

    if (details) details.style.display = 'block';
}

// ─── New Round Creation ─────────────────────────────────────
function toggleAddRound() {
    const inp = document.getElementById('fNewRoundDate');
    if (!inp) return;

    const show = inp.style.display === 'none' || !inp.style.display;
    inp.style.display = show ? 'inline-block' : 'none';

    const btnAddRound = document.getElementById('btnAddRound');
    if (btnAddRound) btnAddRound.classList.toggle('d-none', show);

    const btnCancelAddRound = document.getElementById('btnCancelAddRound');
    if (btnCancelAddRound) btnCancelAddRound.classList.toggle('d-none', !show);

    if (show && fNewRoundPicker) fNewRoundPicker.clear();

    _isCreatingNewRound = show;
}

function cancelAddRound() {
    const inp = document.getElementById('fNewRoundDate');
    if (inp) inp.style.display = 'none';
    if (inp) inp.value = '';

    const btnAddRound = document.getElementById('btnAddRound');
    if (btnAddRound) btnAddRound.classList.remove('d-none');

    const btnCancelAddRound = document.getElementById('btnCancelAddRound');
    if (btnCancelAddRound) btnCancelAddRound.classList.add('d-none');

    const roundSelect = document.getElementById('fRoundSelect');
    if (roundSelect) roundSelect.value = '';

    const durationDisplay = document.getElementById('durationDisplay');
    if (durationDisplay) durationDisplay.textContent = '-';

    const detailsSection = document.getElementById('roundDetailsSection');
    if (detailsSection) detailsSection.style.display = 'none';

    _isCreatingNewRound = false;
    resetRoundForm();
}

function onNewRoundDateSelected() {
    const newRoundDateInput = document.getElementById('fNewRoundDate');
    const dateVal = newRoundDateInput ? newRoundDateInput.value : '';
    if (!dateVal) return;

    let m = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m && fStartPicker) {
        let [, y, mo, d] = m.map(Number);
        fStartPicker.setDate(new Date(y, mo - 1, d));
    } else {
        m = dateVal.match(/^(\d+)\/(\d+)\/(\d+)$/);
        if (m && fStartPicker) {
            let [, d, mo, y] = m.map(Number);
            if (y > 2500) y -= 543;
            fStartPicker.setDate(new Date(y, mo - 1, d));
        }
    }

    if (fEndPicker) fEndPicker.clear();

    const roundSelect = document.getElementById('fRoundSelect');
    if (roundSelect) roundSelect.value = '';

    // Clear additional fields
    const responsibleInput = document.getElementById('fResponsiblePerson');
    if (responsibleInput) responsibleInput.value = '';

    const extraPriceInput = document.getElementById('fExtraPrice');
    if (extraPriceInput) extraPriceInput.value = '0';

    const departureTimeInput = document.getElementById('fDepartureTime');
    if (departureTimeInput) departureTimeInput.value = '08:00';

    const durationDisplay = document.getElementById('durationDisplay');
    if (durationDisplay) durationDisplay.textContent = '-';

    const vehicleList = document.getElementById('vehicleList');
    if (vehicleList) vehicleList.innerHTML = '';

    const pickupList = document.getElementById('pickupList');
    if (pickupList) pickupList.innerHTML = '';

    _editingIds = [];
    _isCreatingNewRound = true;

    addVehicleRow(1, 40, true);
    addPickupRow('ลานจอดรถ BTS หมอชิต', 0);

    const detailsSection = document.getElementById('roundDetailsSection');
    if (detailsSection) detailsSection.style.display = 'block';
}

function resetRoundForm() {
    const form = document.getElementById('roundForm');
    if (form) form.reset();

    const vehicleList = document.getElementById('vehicleList');
    if (vehicleList) vehicleList.innerHTML = '';

    const pickupList = document.getElementById('pickupList');
    if (pickupList) pickupList.innerHTML = '';

    const durationDisplay = document.getElementById('durationDisplay');
    if (durationDisplay) durationDisplay.textContent = '-';

    // Reset additional fields
    const responsibleInput = document.getElementById('fResponsiblePerson');
    if (responsibleInput) responsibleInput.value = '';

    const extraPriceInput = document.getElementById('fExtraPrice');
    if (extraPriceInput) extraPriceInput.value = '0';

    const departureTimeInput = document.getElementById('fDepartureTime');
    if (departureTimeInput) departureTimeInput.value = '08:00';
}

// ─── Duration Calculation ─────────────────────────────────────
function calcDuration() {
    const sInput = document.getElementById('fStartDate');
    const eInput = document.getElementById('fEndDate');
    const s = sInput ? sInput.value.trim() : '';
    const e = eInput ? eInput.value.trim() : '';
    const el = document.getElementById('durationDisplay');
    const eInputEl = document.getElementById('fEndDate');

    function parseD(str) {
        if (!str) return null;
        // Try YYYY-MM-DD format (from flatpickr)
        let m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (m) {
            let [, y, mo, d] = m.map(Number);
            return new Date(y, mo - 1, d);
        }
        // Try Thai calendar format: วัน/เดือน/ปี
        m = str.match(/^(\d+)\/(\d+)\/(\d+)$/);
        if (m) {
            let [, d, mo, y] = m.map(Number);
            // If year > 2500, it's Buddhist year, convert to CE
            if (y > 2500) y -= 543;
            return new Date(y, mo - 1, d);
        }
        return null;
    }

    // Reset border states
    if (eInputEl) eInputEl.classList.remove('is-invalid');

    // If no start date, show default
    if (!s) {
        if (el) el.textContent = '-';
        return;
    }

    const sd = parseD(s);
    if (!sd) {
        if (el) el.textContent = '-';
        return;
    }

    // If end date exists, calculate days and nights
    if (e) {
        const ed = parseD(e);
        if (!ed || ed < sd) {
            // Show error: end date before start date
            if (eInputEl) eInputEl.classList.add('is-invalid');
            if (el) {
                el.textContent = '⚠ วันสิ้นสุดต้องหลังวันเริ่มต้น';
                el.style.color = '#dc3545';
                el.style.fontSize = '0.75rem';
            }
            return;
        }

        // Reset color on valid
        if (el) { el.style.color = ''; el.style.fontSize = ''; }

        // Calculate days and nights
        const diffMs = ed.getTime() - sd.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const daysCount = diffDays + 1; // Include both start and end day
        const nightsCount = diffDays;

        let durationText = `${daysCount} วัน`;
        if (nightsCount > 0) durationText += ` ${nightsCount} คืน`;

        if (el) el.textContent = durationText;
    } else {
        // If only start date, show 1 day
        if (el) { el.style.color = ''; el.style.fontSize = ''; }
        if (el) el.textContent = '1 วัน';
    }
}

// ─── Vehicle Management ───────────────────────────────────────
function addVehicleRow(busNum = null, seats = 10, isOpen = true, id = null) {
    const list = document.getElementById('vehicleList');
    if (!list) return;

    const num = busNum ?? (list.querySelectorAll('.vehicle-row').length + 1);
    const div = document.createElement('div');
    div.className = 'vehicle-row';
    div.dataset.id = id || '';
    div.innerHTML = `
        <div class="d-flex justify-content-between align-items-start gap-2">
            <div class="flex-grow-1">
                <div class="d-flex gap-3 align-items-end flex-wrap">
                    <div>
                        <label class="form-label small fw-semibold mb-1"><i class="bi bi-bus-front-fill text-info me-1"></i>รถคันที่ <span class="vbus-num">${num}</span></label>
                        <input type="text" class="form-control form-control-sm" placeholder="ทะเบียนรถ (เช่น 1234)" style="width:120px;">
                    </div>
                    <div>
                        <label class="form-label small fw-semibold mb-1">ที่นั่ง</label>
                        <input type="number" class="form-control form-control-sm v-seats" value="${seats}" min="1" placeholder="10" style="width:80px;">
                    </div>
                    <div>
                        <label class="form-label small fw-semibold mb-1">สถานะ</label>
                        <div class="d-flex align-items-center gap-2">
                            <div class="form-check form-switch mb-0">
                                <input class="form-check-input v-status" type="checkbox" ${isOpen ? 'checked' : ''} onchange="updateVehicleLabel(this)">
                            </div>
                            <span class="v-status-lbl small fw-semibold ${isOpen ? 'text-success' : 'text-secondary'}">${isOpen ? 'เปิด' : 'ปิด'}</span>
                        </div>
                    </div>
                </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeVehicle(this)" title="ลบรถคันนี้">
                <i class="bi bi-trash"></i>
            </button>
        </div>`;
    list.appendChild(div);
    updateBusNumbers();
}

function removeVehicle(btn) { btn.closest('.vehicle-row').remove(); updateBusNumbers(); }

function updateBusNumbers() {
    document.querySelectorAll('.vehicle-row').forEach((r, i) => {
        const numLabel = r.querySelector('.vbus-num');
        if (numLabel) numLabel.textContent = i + 1;
    });
}

function updateVehicleLabel(chk) {
    const lbl = chk.closest('.d-flex').querySelector('.v-status-lbl');
    if (lbl) {
        lbl.textContent = chk.checked ? 'เปิด' : 'ปิด';
        lbl.className = `v-status-lbl small fw-semibold ${chk.checked ? 'text-success' : 'text-secondary'}`;
    }
}

// ─── Pickup Points Management ─────────────────────────────────
function addPickupRow(name = '', price = 0) {
    const list = document.getElementById('pickupList');
    if (!list) return;

    const isFirst = !list.querySelectorAll('.pickup-row').length;
    
    // Default naming for the first point if empty
    if (isFirst && !name) name = 'ลานจอดรถ BTS หมอชิต';

    list.insertAdjacentHTML('beforeend', `
        <div class="pickup-row d-flex gap-2 mb-2 align-items-center">
            <span class="badge ${isFirst ? 'bg-secondary' : 'bg-light border text-muted'} text-nowrap" style="font-size:.65rem;min-width:52px;text-align:center;">${isFirst ? 'DEFAULT' : 'จุด'}</span>
            <input type="text" class="form-control form-control-sm p-name flex-grow-1" placeholder="ชื่อจุดรับ" value="${name}" required>
            <div class="input-group input-group-sm" style="width:110px;">
                <span class="input-group-text">+฿</span>
                <input type="number" class="form-control p-price" placeholder="0" value="${price}" min="0" step="1">
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger px-2" onclick="removePickup(this)" ${isFirst ? 'style="visibility:hidden;"' : ''}>
                <i class="bi bi-trash"></i>
            </button>
        </div>`);
}

function removePickup(btn) {
    btn.closest('.pickup-row').remove();
    document.querySelectorAll('.pickup-row').forEach((r, i) => {
        const badge = r.querySelector('.badge');
        const delBtn = r.querySelector('.btn-outline-danger');
        if (badge) {
            if (i === 0) { 
                badge.className = 'badge bg-secondary text-nowrap'; 
                badge.textContent = 'DEFAULT'; 
                if (delBtn) delBtn.style.visibility = 'hidden'; 
            } else { 
                badge.className = 'badge bg-light border text-muted text-nowrap'; 
                badge.textContent = 'จุด'; 
                if (delBtn) delBtn.style.visibility = ''; 
            }
        }
    });
}

// ─── Modal Control ──────────────────────────────────────────
function openModal() {
    const form = document.getElementById('roundForm');
    if (form) form.reset();

    const detailsSection = document.getElementById('roundDetailsSection');
    if (detailsSection) detailsSection.style.display = 'none';

    const roundSelect = document.getElementById('fRoundSelect');
    if (roundSelect) roundSelect.innerHTML = '<option value="">-- ไม่มีการเลือก --</option>';

    const vehicleList = document.getElementById('vehicleList');
    if (vehicleList) vehicleList.innerHTML = '';

    const pickupList = document.getElementById('pickupList');
    if (pickupList) pickupList.innerHTML = '';

    const durationDisplay = document.getElementById('durationDisplay');
    if (durationDisplay) durationDisplay.textContent = '-';

    const newRoundDate = document.getElementById('fNewRoundDate');
    if (newRoundDate) newRoundDate.style.display = 'none';

    const btnAddRound = document.getElementById('btnAddRound');
    if (btnAddRound) btnAddRound.classList.remove('d-none');

    const btnCancelAddRound = document.getElementById('btnCancelAddRound');
    if (btnCancelAddRound) btnCancelAddRound.classList.add('d-none');

    _editingIds = [];
    _tripRoundsByDate = {};
    _isCreatingNewRound = false;

    if (fStartPicker) fStartPicker.clear();
    if (fEndPicker) fEndPicker.clear();
    if (fNewRoundPicker) fNewRoundPicker.clear();

    const tripFilterInput = document.getElementById('filterTrip');
    const tripQ = tripFilterInput ? tripFilterInput.value.toLowerCase().trim() : '';
    if (tripQ) {
        const found = trips.find(t => t.title.toLowerCase().includes(tripQ));
        if (found) {
            const tripSelect = document.getElementById('fTripId');
            if (tripSelect) {
                tripSelect.value = found.id;
                onTripChange();
            }
        }
    }
    if (roundModal) roundModal.show();
}

function editRoundById(id) {
    const r = allRounds.find(x => x.id === id);
    if (!r) return;

    const form = document.getElementById('roundForm');
    if (form) form.reset();

    const vehicleList = document.getElementById('vehicleList');
    if (vehicleList) vehicleList.innerHTML = '';

    const pickupList = document.getElementById('pickupList');
    if (pickupList) pickupList.innerHTML = '';

    const durationDisplay = document.getElementById('durationDisplay');
    if (durationDisplay) durationDisplay.textContent = '-';

    const newRoundDate = document.getElementById('fNewRoundDate');
    if (newRoundDate) newRoundDate.style.display = 'none';

    const btnAddRound = document.getElementById('btnAddRound');
    if (btnAddRound) btnAddRound.classList.remove('d-none');

    const btnCancelAddRound = document.getElementById('btnCancelAddRound');
    if (btnCancelAddRound) btnCancelAddRound.classList.add('d-none');

    _editingIds = [r.id];
    _isCreatingNewRound = false;

    const tripSelect = document.getElementById('fTripId');
    if (tripSelect) {
        tripSelect.value = r.tripId;
        onTripChange();
    }

    const dateKey = new Date(r.departDate).toISOString().split('T')[0];
    setTimeout(() => {
        const roundSelect = document.getElementById('fRoundSelect');
        if (roundSelect) {
            roundSelect.value = dateKey;
            onRoundSelect();
        }
    }, 100);

    if (roundModal) roundModal.show();
}

// ─── parseToISO helper ────────────────────────────────────────
function parseToISO(str) {
    if (!str) return null;
    str = str.trim();
    // DD/MM/YYYY or DD/MM/BBBB (Buddhist year)
    const m = str.match(/(\d+)\/(\d+)\/(\d+)/);
    if (!m) return null;
    let [, d, mo, y] = m.map(Number);
    if (d < 1 || d > 31 || mo < 1 || mo > 12 || y < 1) return null;
    if (y > 2500) y -= 543;
    if (y < 1900 || y > 2100) return null;
    const date = new Date(y, mo - 1, d);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
}

// ─── Save Round Logic ────────────────────────────────────────
async function saveDraft() {
    const tripSelect = document.getElementById('fTripId');
    const tripId = tripSelect ? parseInt(tripSelect.value) : null;
    if (!tripId) return showToast('กรุณาเลือกทริป', 'warning');

    // Get dates from flatpickr instances, fallback to input value
    const startDate = fStartPicker?.selectedDates[0];
    const endDate = fEndPicker?.selectedDates[0];

    const startDateInput = document.getElementById('fStartDate');
    const endDateInput = document.getElementById('fEndDate');
    const startVal = startDate ? startDate.toISOString().split('T')[0] : (startDateInput?.value?.trim() || '');
    const endVal = endDate ? endDate.toISOString().split('T')[0] : (endDateInput?.value?.trim() || '');

    if (!startVal) return showToast('กรุณาเลือกวันเริ่มต้น', 'warning');
    if (!endVal) return showToast('กรุณาเลือกวันสิ้นสุด', 'warning');

    // Parse back to Date object
    const [sy, sm, sd] = startVal.split('-').map(Number);
    const startDateObj = new Date(sy, sm - 1, sd);

    const [ey, em, ed] = endVal.split('-').map(Number);
    const endDateObj = new Date(ey, em - 1, ed);

    const vehicles = document.querySelectorAll('.vehicle-row');
    if (!vehicles.length) return showToast('กรุณาเพิ่มรถอย่างน้อย 1 คัน', 'warning');

    const pickups = [...document.querySelectorAll('.pickup-row')].map(r => ({
        name: r.querySelector('.p-name').value.trim(),
        price: parseFloat(r.querySelector('.p-price').value || 0)
    })).filter(p => p.name);

    if (!pickups.length) return showToast('กรุณาเพิ่มจุดรับอย่างน้อย 1 จุด', 'warning');

    if (endDateObj < startDateObj) return showToast('วันสิ้นสุดต้องอยู่หลังวันเริ่มต้น', 'warning');

    const durationDisplay = document.getElementById('durationDisplay');
    const durationText = durationDisplay ? durationDisplay.textContent.trim() : '';
    if (durationText.includes('⚠')) return showToast('วันสิ้นสุดต้องอยู่หลังวันเริ่มต้น', 'warning');
    const duration = durationText && durationText !== '-' ? durationText : null;

    try {
        const vehicleRows = [...vehicles];
        const vehiclesData = vehicleRows.map((v, idx) => ({
            id: idx + 1,
            busNumber: idx + 1,
            seatCapacity: parseInt(v.querySelector('.v-seats').value) || 40,
            status: v.querySelector('.v-status').checked ? 'Open' : 'Closed'
        }));

        const responsiblePersonInput = document.getElementById('fResponsiblePerson');
        const extraPriceInput = document.getElementById('fExtraPrice');
        const departureTimeInput = document.getElementById('fDepartureTime');

        // startPoint is the first pickup point name
        const startPoint = pickups[0]?.name || '';
        const responsiblePerson = responsiblePersonInput ? responsiblePersonInput.value.trim() : null;
        const extraPrice = extraPriceInput ? parseFloat(extraPriceInput.value || 0) : 0;
        const departureTime = departureTimeInput ? departureTimeInput.value : '08:00';

        // Combine date + time for departDate
        const [hours, minutes] = departureTime.split(':').map(Number);
        const departDateWithTime = new Date(startDateObj);
        departDateWithTime.setHours(hours, minutes, 0, 0);

        // Also handle returnDate with same time
        let returnDateWithTime = null;
        if (endDateObj) {
            returnDateWithTime = new Date(endDateObj);
            returnDateWithTime.setHours(hours, minutes, 0, 0);
        }

        const draftData = {
            tripId,
            busNumber: 1,
            startPoint,
            departDate: departDateWithTime.toISOString(),
            returnDate: returnDateWithTime.toISOString(),
            duration,
            totalSeats: vehiclesData.reduce((sum, v) => sum + v.seatCapacity, 0),
            responsiblePerson,
            extraPrice,
            pickupPoints: pickups,
            vehicles: vehiclesData
        };

        await API.draftBusRounds.create(draftData);
        showToast(`บันทึกร่างสำเร็จ (${vehicleRows.length} คัน)`);
        if (roundModal) roundModal.hide();
        await loadRounds();
    } catch (e) {
        showToast(e.message || 'บันทึกร่างล้มเหลว', 'danger');
    }
}

async function publishDraft() {
    if (_editingIds.length === 0) return showToast('ไม่พบร่างที่บันทึก', 'warning');

    try {
        const draftId = _editingIds[0];
        await API.draftBusRounds.publish(draftId);
        showToast('ส่งไปใช้งานสำเร็จ');
        if (roundModal) roundModal.hide();
        await loadRounds();
    } catch (e) {
        showToast(e.message || 'ส่งไปใช้งานล้มเหลว', 'danger');
    }
}

async function deleteDraft(draftId) {
    if (!confirm('คุณแน่ใจว่าต้องการลบร่างนี้?')) return;

    try {
        await API.draftBusRounds.delete(draftId);
        showToast('ลบร่างสำเร็จ');
        await loadRounds();
    } catch (e) {
        showToast(e.message || 'ลบร่างล้มเหลว', 'danger');
    }
}

async function toggleRound(id) {
    try { 
        await API.busRounds.toggle(id); 
        showToast('อัปเดตสถานะสำเร็จ'); 
        await loadRounds(); 
    } catch (e) { 
        showToast(e.message, 'danger'); 
    }
}

// ─── Entry Point ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initBusRoundsPage);
