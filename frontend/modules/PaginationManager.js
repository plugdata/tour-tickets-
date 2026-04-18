/**
 * Pagination Manager
 * Handles pagination controls and events
 */

class PaginationManager {
    constructor(options = {}) {
        this.options = {
            containerId: 'pagination',
            perPageOptions: [10, 25, 50, 100],
            maxVisiblePages: 5,
            onPageChange: null,
            onPerPageChange: null,
            ...options
        };

        this.containerEl = document.getElementById(this.options.containerId);
        this.currentPage = 1;
        this.perPage = 10;
        this.totalRecords = 0;
        this.totalPages = 0;
    }

    // Render pagination
    render(config) {
        this.currentPage = config.currentPage || 1;
        this.perPage = config.perPage || 10;
        this.totalRecords = config.totalRecords || 0;
        this.totalPages = Math.ceil(this.totalRecords / this.perPage) || 1;

        if (!this.containerEl) return;

        const html = `
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div class="d-flex align-items-center gap-2">
                    <label class="form-label mb-0 text-nowrap">${t('pagination.perPage')}:</label>
                    <select class="form-select form-select-sm" id="perPageSelect" style="width: auto;">
                        ${this.options.perPageOptions.map(opt =>
                            `<option value="${opt}" ${opt === this.perPage ? 'selected' : ''}>${opt}</option>`
                        ).join('')}
                    </select>
                </div>

                <nav>
                    <ul class="pagination pagination-sm mb-0">
                        ${this.renderPageButtons()}
                    </ul>
                </nav>
            </div>
        `;

        this.containerEl.innerHTML = html;
        this.setupEventListeners();
    }

    // Render page buttons
    renderPageButtons() {
        if (this.totalPages <= 1) {
            return `
                <li class="page-item active">
                    <span class="page-link">1</span>
                </li>
            `;
        }

        let html = '';

        // First and Previous buttons
        html += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="1" title="${t('pagination.first')}">
                    <i class="bi bi-chevron-double-left"></i>
                </a>
            </li>
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}" title="${t('pagination.previous')}">
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const { startPage, endPage } = this.getPageRange();

        if (startPage > 1) {
            html += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="1">1</a>
                </li>
            `;
            if (startPage > 2) {
                html += `
                    <li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>
                `;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                html += `
                    <li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>
                `;
            }
            html += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${this.totalPages}">${this.totalPages}</a>
                </li>
            `;
        }

        // Next and Last buttons
        html += `
            <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}" title="${t('pagination.next')}">
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>
            <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.totalPages}" title="${t('pagination.last')}">
                    <i class="bi bi-chevron-double-right"></i>
                </a>
            </li>
        `;

        return html;
    }

    // Calculate page range to display
    getPageRange() {
        const maxVisible = this.options.maxVisiblePages;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

        // Adjust if near the end
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        return { startPage, endPage };
    }

    // Setup event listeners
    setupEventListeners() {
        // Page links
        this.containerEl.querySelectorAll('.page-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(link.dataset.page);
                if (page && page !== this.currentPage && page >= 1 && page <= this.totalPages) {
                    if (this.options.onPageChange) {
                        this.options.onPageChange(page);
                    }
                }
            });
        });

        // Per page select
        const perPageSelect = this.containerEl.querySelector('#perPageSelect');
        if (perPageSelect) {
            perPageSelect.addEventListener('change', (e) => {
                const perPage = parseInt(e.target.value);
                if (this.options.onPerPageChange) {
                    this.options.onPerPageChange(perPage);
                }
            });
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PaginationManager };
}
