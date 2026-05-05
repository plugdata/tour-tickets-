let modal, pagination;
let currentPage = 1, perPage = 10, filteredData = [], allTrips = [];
let currentTypeFilter = '';

document.addEventListener('DOMContentLoaded', async () => {
    await initPage();
    modal = new bootstrap.Modal(document.getElementById('tripModal'));

    pagination = new PaginationManager({
        containerId: 'tripPagination',
        onPageChange: (p) => { currentPage = p; renderTrips(); },
        onPerPageChange: (pp) => { perPage = pp; currentPage = 1; renderTrips(); }
    });

    await ThaiCalendar.init('#startDate', { onChange: loadTrips });
    await ThaiCalendar.init('#endDate', { onChange: loadTrips });

    FileUpload.init('#imageUploadContainer', { targetInputId: 'fImage', multiple: true });
    FileUpload.init('#docUploadContainer', {
        targetInputId: 'fDocUrl', multiple: false,
        btnText: 'เลือกไฟล์อธิบาย', btnIcon: 'bi-file-earmark-text',
        allowedTypes: ['application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/html']
    });

    // Form tabs
    document.querySelectorAll('#tripFormTabs .nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            document.querySelectorAll('#tripFormTabs .nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.querySelectorAll('[id^="ttab-"]').forEach(p => p.classList.add('d-none'));
            document.getElementById('ttab-' + link.dataset.ttab).classList.remove('d-none');
        });
    });

    loadTrips();
});

function setTypeFilter(type, el) {
    currentTypeFilter = type;
    document.querySelectorAll('#typeTabs .nav-link').forEach(l => l.classList.remove('active'));
    el.classList.add('active');
    applyFilter();
}

function clearDateRange() {
    document.getElementById('startDate')._flatpickr?.clear();
    document.getElementById('endDate')._flatpickr?.clear();
    loadTrips();
}

async function loadTrips() {
    try {
        allTrips = await API.trips.list();
        // Update counters
        document.getElementById('cntAll').textContent = allTrips.length;
        document.getElementById('cntDomestic').textContent = allTrips.filter(t => t.tripType === 'DOMESTIC').length;
        document.getElementById('cntIntl').textContent = allTrips.filter(t => t.tripType === 'INTERNATIONAL').length;
        document.getElementById('cntHot').textContent = allTrips.filter(t => t.isHot).length;
        applyFilter();
    } catch (e) {
        console.error('loadTrips error:', e);
        showToast('โหลดข้อมูลล้มเหลว', 'danger');
    }
}

function applyFilter() {
    const query = document.getElementById('searchTrip').value.toLowerCase();
    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;

    let trips = [...allTrips];
    if (currentTypeFilter === 'HOT') trips = trips.filter(t => t.isHot);
    else if (currentTypeFilter) trips = trips.filter(t => t.tripType === currentTypeFilter);
    if (query) trips = trips.filter(t =>
        t.title.toLowerCase().includes(query) ||
        (t.description || '').toLowerCase().includes(query) ||
        (t.country || '').toLowerCase().includes(query));
    if (start || end) trips = ThaiCalendar.filterByDateRange(trips, 'createdAt', start, end);

    filteredData = trips; currentPage = 1; renderTrips();
}

const typeLabel = { DOMESTIC: 'ในประเทศ', INTERNATIONAL: 'ต่างประเทศ' };
const typeBadge = { DOMESTIC: 'primary', INTERNATIONAL: 'info' };

function renderTrips() {
    const tbody = document.getElementById('tripsBody');
    const startIdx = (currentPage - 1) * perPage;
    const pagedData = filteredData.slice(startIdx, startIdx + perPage);

    if (!filteredData.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">ไม่พบข้อมูลทริป</td></tr>';
        pagination.render({ totalRecords: 0, currentPage, perPage }); return;
    }

    tbody.innerHTML = pagedData.map((t, i) => `
<tr>
    <td>${startIdx + i + 1}</td>
    <td>
        <strong>${t.title}</strong>
        ${t.imageUrl ? `<br><small class="text-primary"><i class="bi bi-image me-1"></i>รูปภาพ</small>` : ''}
        ${t.docUrl ? `<a href="${t.docUrl}" target="_blank" class="ms-2 small text-success"><i class="bi bi-file-earmark-text me-1"></i>เอกสาร</a>` : ''}
        ${t.description ? `<br><small class="text-muted">${t.description.substring(0, 60)}${t.description.length > 60 ? '...' : ''}</small>` : ''}
    </td>
    <td>
        <span class="badge bg-${typeBadge[t.tripType] || 'secondary'}">${typeLabel[t.tripType] || t.tripType}</span>
        ${t.country ? `<br><small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${t.country}</small>` : ''}
    </td>
    <td class="text-center">
        ${t.busRounds?.length ? `
            <span class="badge bg-info me-1">${t.busRounds.length} รอบ</span>
            <br><small class="text-muted d-block mt-1">เวลาออก<br>ต่างกัน</small>
        ` : `<span class="badge bg-light text-muted">ยังไม่มีรอบ</span>`}
    </td>
    <td>
        ${formatMoney(t.price)}
        ${t.deposit ? `<br><small class="text-warning">มัดจำ: ${formatMoney(t.deposit)}</small>` : ''}
    </td>
    <td class="text-center">
        ${t.isHot
            ? `<button class="btn btn-sm btn-danger py-0" onclick="toggleHot(${t.id},false)" title="ปิด Hot">
               <i class="bi bi-fire"></i> HOT</button>`
            : `<button class="btn btn-sm btn-outline-secondary py-0" onclick="toggleHot(${t.id},true)" title="ตั้ง Hot">
               <i class="bi bi-fire"></i></button>`}
    </td>
    <td><span class="badge ${t.isActive ? 'bg-success' : 'bg-secondary'}">${t.isActive ? 'เปิด' : 'ปิด'}</span></td>
    <td>${formatDateThai(t.createdAt)}</td>
    <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editTripById(${t.id})"><i class="bi bi-pencil"></i></button>
        <a href="/frontend/pages/bus-rounds/list.html?tripId=${t.id}" class="btn btn-sm btn-outline-success me-1" title="รอบรถ"><i class="bi bi-bus-front"></i></a>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteTrip(${t.id})"><i class="bi bi-trash"></i></button>
    </td>
</tr>`).join('');

    pagination.render({ totalRecords: filteredData.length, currentPage, perPage });
}

async function toggleHot(id, isHot) {
    try {
        await API.trips.update(id, { isHot });
        showToast(isHot ? '🔥 ตั้ง Hot แล้ว' : 'ยกเลิก Hot แล้ว');
        loadTrips();
    } catch (e) { showToast(e.message, 'danger'); }
}

function resetFormTabs() {
    document.querySelectorAll('#tripFormTabs .nav-link').forEach(l => l.classList.toggle('active', l.dataset.ttab === 'basic'));
    document.querySelectorAll('[id^="ttab-"]').forEach(p => p.classList.toggle('d-none', p.id !== 'ttab-basic'));
}

function openModal(title = 'เพิ่มทริป') {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('tripForm').reset();
    document.getElementById('tripId').value = '';
    document.getElementById('fActive').checked = true;
    document.getElementById('fIsHot').checked = false;
    document.getElementById('fHotOrder').value = 99;
    document.getElementById('fTripType').value = 'DOMESTIC';
    FileUpload.setExisting('', 'fImage');
    FileUpload.setExisting('', 'fDocUrl');
    resetFormTabs();
    document.getElementById('roundsList').innerHTML = '<div class="col-12 text-center text-muted py-3"><i class="bi bi-hourglass-split"></i> กรุณาบันทึกทริปก่อน</div>';
    document.getElementById('btnManageRounds').style.display = 'none';
    modal.show();
}

function editTripById(id) {
    const t = allTrips.find(x => x.id === id);
    if (!t) return;
    editTrip(t);
}

function editTrip(t) {
    document.getElementById('modalTitle').textContent = 'แก้ไขทริป';
    document.getElementById('tripId').value = t.id;
    document.getElementById('fTitle').value = t.title;
    document.getElementById('fTripType').value = t.tripType || 'DOMESTIC';
    document.getElementById('fCountry').value = t.country || '';
    document.getElementById('fDesc').value = t.description || '';
    document.getElementById('fPrice').value = t.price;
    document.getElementById('fDeposit').value = t.deposit || 0;
    document.getElementById('fIsHot').checked = t.isHot || false;
    document.getElementById('fHotOrder').value = t.hotOrder || 99;
    document.getElementById('fActive').checked = t.isActive;
    FileUpload.setExisting(t.imageUrl, 'fImage');
    FileUpload.setExisting(t.docUrl, 'fDocUrl');
    resetFormTabs();
    loadRoundsForTrip(t.id, t.busRounds || []);
    modal.show();
}

function loadRoundsForTrip(tripId, rounds) {
    const roundsList = document.getElementById('roundsList');
    const btnManage = document.getElementById('btnManageRounds');

    if (!rounds || rounds.length === 0) {
        roundsList.innerHTML = '<div class="col-12 text-center text-muted py-3"><i class="bi bi-exclamation-circle"></i> ยังไม่มีรอบเที่ยว</div>';
        btnManage.style.display = 'block';
        return;
    }

    roundsList.innerHTML = rounds.map(r => `
        <div class="col-md-6">
            <div class="card border-0 bg-light h-100">
                <div class="card-body py-2">
                    <div class="small fw-semibold text-dark">รอบที่ ${r.roundNumber || r.id}</div>
                    <div class="small text-muted">
                        <i class="bi bi-calendar me-1"></i>${r.departDate ? formatDateThai(r.departDate) : 'ไม่ระบุ'}
                    </div>
                    <div class="small text-muted">
                        <i class="bi bi-clock me-1"></i>${r.departureTime || 'ไม่ระบุ'}
                    </div>
                    <div class="small text-muted">
                        <i class="bi bi-chair me-1"></i>${r.totalSeats || 0} ที่นั่ง
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    btnManage.style.display = 'block';
}

function openRoundsManager() {
    const tripId = document.getElementById('tripId').value;
    if (!tripId) {
        showToast('กรุณาบันทึกทริปก่อน', 'warning');
        return;
    }
    window.location.href = `/frontend/pages/bus-rounds/list.html?tripId=${tripId}`;
}

async function saveTrip() {
    const id = document.getElementById('tripId').value;
    const btnSave = document.querySelector('.modal-footer .btn-primary');
    const originalText = btnSave.innerHTML;

    try {
        btnSave.disabled = true;
        btnSave.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> กำลังบันทึก...';

        // 1. Upload pending for both containers
        const [newImages, newDocs] = await Promise.all([
            FileUpload.uploadAllPending('fImage'),
            FileUpload.uploadAllPending('fDocUrl')
        ]);

        // 2. Combine with existing
        const existingImages = document.getElementById('fImage').value.split(',').filter(x => x);
        const finalImages = [...existingImages, ...newImages].join(',');

        const existingDocs = document.getElementById('fDocUrl').value.split(',').filter(x => x);
        const finalDoc = [...existingDocs, ...newDocs][0] || ''; // Single doc expected

        const data = {
            title: document.getElementById('fTitle').value,
            tripType: document.getElementById('fTripType').value,
            country: document.getElementById('fCountry').value || null,
            description: document.getElementById('fDesc').value,
            price: parseFloat(document.getElementById('fPrice').value),
            deposit: parseFloat(document.getElementById('fDeposit').value || 0),
            isHot: document.getElementById('fIsHot').checked,
            hotOrder: parseInt(document.getElementById('fHotOrder').value || 99),
            imageUrl: finalImages,
            docUrl: finalDoc,
            isActive: document.getElementById('fActive').checked,
        };

        if (id) await API.trips.update(id, data);
        else await API.trips.create(data);

        modal.hide();
        showToast('บันทึกสำเร็จ');
        loadTrips();
    } catch (e) {
        showToast(e.message, 'danger');
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = originalText;
    }
}

async function deleteTrip(id) {
    confirmAction('ต้องการลบทริปนี้?', async () => {
        try {
            await API.trips.delete(id);
            showToast('ลบสำเร็จ');
            loadTrips();
        } catch (e) {
            showToast(e.message || 'ลบล้มเหลว', 'danger');
        }
    });
}
