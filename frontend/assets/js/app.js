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

// Toast notification
function showToast(msg, type = 'success') {
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
        <div id="${id}" class="toast align-items-center text-bg-${type} border-0 show" role="alert">
            <div class="d-flex">
                <div class="toast-body">${msg}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>`);
    setTimeout(() => document.getElementById(id)?.remove(), 3500);
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

// Confirm modal
function confirmAction(msg, onConfirm) {
    if (confirm(msg)) onConfirm();
}
