function initSidebarToggle() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    var toggle = document.getElementById('btn-menu-toggle');
    if (toggle && sidebar) {
        toggle.addEventListener('click', function () {
            sidebar.classList.toggle('show');
            if (overlay) overlay.classList.toggle('show');
        });
    }
    if (overlay && sidebar) {
        overlay.addEventListener('click', function () {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        });
    }
}

function setActiveNav() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('a.nav-link[href]').forEach(function (link) {
        const href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('javascript')) return;
        
        // Match exact path or handle cases where / refers to index.html
        const linkPath = new URL(href, window.location.origin).pathname;
        if (currentPath === linkPath || (currentPath === '/' && linkPath.endsWith('index.html'))) {
            link.classList.add('active');
        }
    });
}

async function loadComponent(url, elementId) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to load ${url}`);
        document.getElementById(elementId).innerHTML = await res.text();
        if (elementId === 'sidebar') setActiveNav();
        if (elementId === 'main-header') {
            initSidebarToggle();
            if (typeof authManager !== 'undefined') authManager.updateUserDisplay();
        }
    } catch (e) {
        console.error('Error loading component:', e);
    }
}

async function initPage() {
    // Dev bypass: inject mock admin session if not logged in
    if (!authManager.isAuthenticated()) {
        authManager.saveAuth(
            { id: 1, username: 'admin', name: 'Admin System', role: 'ADMIN' },
            'dev-bypass-token',
            false
        );
    }
    await Promise.all([
        loadComponent('/frontend/components/navMenu.html', 'sidebar'),
        loadComponent('/frontend/components/header.html', 'main-header')
    ]);
}

// Toast notification (Using SweetAlert2)
function showToast(msg, type = 'success') {
    if (typeof Swal !== 'undefined') {
        const toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
            }
        });
        toast.fire({
            icon: type, // 'success', 'error', 'warning', 'info'
            title: msg
        });
    } else {
        // Fallback to basic toast if Swal not loaded
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'position-fixed bottom-0 end-0 p-3';
            container.style.zIndex = 9999;
            document.body.appendChild(container);
        }
        const id = 'toast_' + Date.now();
        container.insertAdjacentHTML('beforeend', `
            <div id="${id}" class="toast align-items-center text-bg-${type === 'danger' ? 'danger' : type} border-0 show" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${msg}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>`);
        setTimeout(() => document.getElementById(id)?.remove(), 3500);
    }
}

// Format date Thai
function formatDateThai(d) {
    if (!d) return '-';
    const date = new Date(d);
    return date.toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    }).replace(/(\d{4})/, (match) => parseInt(match) < 2500 ? parseInt(match) + 543 : match);
}

function formatDateTime(d) {
    if (!d) return '-';
    const date = new Date(d);
    const options = { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    };
    let str = date.toLocaleString('th-TH', options);
    // Display AD year (2026) instead of BE year (2569) for consistency
    return str.replace(/(\d{4})/, (match) => parseInt(match) >= 2500 ? parseInt(match) - 543 : match);
}

function formatMoney(n) {
    return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });
}

function formatTime(d) {
    if (!d) return '-';
    const date = new Date(d);
    return date.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

function formatDateRange(departDate, duration, gridView = true) {
    if (!departDate) return '-';
    const startDate = new Date(departDate);

    // Extract number of days from duration (e.g., "2 วัน 1 คืน" => 2 days)
    let days = 1;
    if (duration) {
        const match = duration.match(/(\d+)\s*วัน/);
        if (match) days = parseInt(match[1]);
    }

    // Calculate end date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);

    // Format dates in Thai locale
    const startStr = startDate.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit'
    }).replace(/(\d{4})/, (match) => {
        const year = parseInt(match);
        return year < 100 ? (year >= 70 ? 19 : 20) + String(year).padStart(2, '0') : year >= 2500 ? year : year + 543;
    });

    const endStr = endDate.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit'
    }).replace(/(\d{4})/, (match) => {
        const year = parseInt(match);
        return year < 100 ? (year >= 70 ? 19 : 20) + String(year).padStart(2, '0') : year >= 2500 ? year : year + 543;
    });

    // Parse formatted strings (e.g., "29 ส.ค. 69")
    const [startDay, ...startRest] = startStr.split(' ');
    const [endDay, ...endRest] = endStr.split(' ');
    const monthYear = startRest.join(' '); // "ส.ค. 69"

    // Return format: "29-30 ส.ค. 69" or "29-30 ส.ค. 69 (2 วัน 1 คืน)"
    const dateRangeStr = `${startDay}-${endDay} ${monthYear}`;
    return gridView && duration ? `${dateRangeStr} (${duration})` : dateRangeStr;
}

// Confirm modal (Using SweetAlert2)
function confirmAction(msg, onConfirm, options = {}) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: options.title || 'คุณแน่ใจหรือไม่?',
            text: msg,
            icon: options.icon || 'warning',
            showCancelButton: true,
            confirmButtonColor: options.confirmColor || '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: options.confirmText || 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                onConfirm();
            }
        });
    } else {
        if (confirm(msg)) onConfirm();
    }
}

// Inject SweetAlert2 if not present
(function() {
    if (typeof Swal === 'undefined') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
        document.head.appendChild(script);
    }
})();
