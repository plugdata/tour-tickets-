/**
 * Generic CRUD Manager
 * Handles create, read, update, delete operations for any resource
 */

class CrudManager {
    constructor(resourceName, options = {}) {
        this.resourceName = resourceName;
        this.resourceConfig = RESOURCES[resourceName];
        this.options = {
            tableId: 'dataTable',
            formId: 'dataForm',
            paginationId: 'pagination',
            searchInputId: 'searchInput',
            ...options
        };

        this.currentPage = 1;
        this.perPage = 10;
        this.totalRecords = 0;
        this.sortBy = 'id';          // เรียงตาม id → แสดงข้อมูลใหม่ก่อน
        this.sortDirection = 'desc'; // DESC = ใหม่ก่อน
        this.filters = {};
        this.selectedIds = new Set();

        this.tableManager = null;
        this.formManager = null;
        this.paginationManager = null;
    }

    // Initialize managers
    async init() {
        // Initialize TableManager if table exists
        const tableEl = document.getElementById(this.options.tableId);
        if (tableEl) {
            this.tableManager = new TableManager(this.resourceName, {
                tableId: this.options.tableId,
                onSort: (field, direction) => this.handleSort(field, direction),
                onSelect: (id, selected) => this.handleSelect(id, selected),
                onSelectAll: (selected) => this.handleSelectAll(selected),
                onEdit: (id) => this.editRecord(id),
                onDelete: (id) => this.deleteRecord(id),
                onView: (id) => this.viewRecord(id)
            });
        }

        // Initialize FormManager if form exists
        const formEl = document.getElementById(this.options.formId);
        if (formEl) {
            this.formManager = new FormManager(this.resourceName, {
                formId: this.options.formId,
                onSubmit: (data, id) => this.handleFormSubmit(data, id)
            });
            await this.formManager.init();
        }

        // Initialize PaginationManager if pagination exists
        const paginationEl = document.getElementById(this.options.paginationId);
        if (paginationEl) {
            this.paginationManager = new PaginationManager({
                containerId: this.options.paginationId,
                onPageChange: (page) => this.goToPage(page),
                onPerPageChange: (perPage) => this.changePerPage(perPage)
            });
        }

        // Setup search
        this.setupSearch();

        // Setup bulk actions
        this.setupBulkActions();
    }

    // Setup search functionality
    setupSearch() {
        const searchInput = document.getElementById(this.options.searchInputId);
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.filters.search = e.target.value;
                    this.currentPage = 1;
                    this.loadData();
                }, 300);
            });
        }
    }

    // Setup bulk action buttons
    setupBulkActions() {
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent any accidental reloads
                console.log('🗑️ Bulk Delete Triggered for IDs:', Array.from(this.selectedIds));
                this.bulkDelete();
            });
        }
    }

    // Load data from API
    async loadData() {
        try {
            this.showLoading(true);

            let result;

            // If we have a search term, use the search action instead of list
            if (this.filters.search) {
                const query = this.filters.search;
                const searchFilters = { ...this.filters };
                delete searchFilters.search; // Don't pass search as a filter

                result = await apiClient.search(this.resourceName, query, {
                    page: this.currentPage,
                    perPage: this.perPage,
                    ...searchFilters
                });
            } else {
                result = await apiClient.list(this.resourceName, {
                    page: this.currentPage,
                    perPage: this.perPage,
                    sortBy: this.sortBy,
                    direction: this.sortDirection,
                    filters: this.filters
                });
            }

            this.totalRecords = result.meta?.total || result.records?.length || 0;
            const records = result.records || [];

            // Update table (renderAsync pre-fetches reference lookups)
            if (this.tableManager) {
                await this.tableManager.renderAsync(records);
            }

            // Update pagination
            if (this.paginationManager) {
                this.paginationManager.render({
                    currentPage: this.currentPage,
                    perPage: this.perPage,
                    totalRecords: this.totalRecords
                });
            }

            // Update record count display
            this.updateRecordCount();

            this.showLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError(t('error.network'));
            this.showLoading(false);
        }
    }

    // Load single record for view/edit
    async loadRecord(id) {
        try {
            this.showLoading(true);
            const result = await apiClient.show(this.resourceName, id);
            this.showLoading(false);
            return result.record || result;
        } catch (error) {
            console.error('Error loading record:', error);
            this.showError(t('crud.recordNotFound'));
            this.showLoading(false);
            return null;
        }
    }

    // Handle form submission
    async handleFormSubmit(data, id = null) {
        try {
            this.showLoading(true);

            let result;
            if (id) {
                result = await apiClient.update(this.resourceName, id, data);
                this.showSuccess(t('crud.updateSuccess'));
            } else {
                result = await apiClient.create(this.resourceName, data);
                this.showSuccess(t('crud.createSuccess'));
            }

            this.showLoading(false);

            // Redirect to list page after short delay
            setTimeout(() => {
                const resourcePath = getResourcePath(this.resourceName);
                window.location.href = `/frontend/pages/${resourcePath}/list.html`;
            }, 1000);

            return result;
        } catch (error) {
            console.error('Error saving record:', error);
            this.showError(error.message || t('error.server'));
            this.showLoading(false);
            throw error;
        }
    }

    // Edit record - redirect to form
    editRecord(id) {
        const resourcePath = getResourcePath(this.resourceName);
        window.location.href = `/frontend/pages/${resourcePath}/form.html?id=${id}`;
    }

    // View record - redirect to view page
    viewRecord(id) {
        const resourcePath = getResourcePath(this.resourceName);
        window.location.href = `/frontend/pages/${resourcePath}/view.html?id=${id}`;
    }

    // Delete single record
    async deleteRecord(id) {
        if (!confirm(t('crud.deleteConfirm'))) {
            return;
        }

        try {
            this.showLoading(true);
            await apiClient.delete(this.resourceName, id);
            this.showSuccess(t('crud.deleteSuccess'));
            await this.loadData();
        } catch (error) {
            console.error('Error deleting record:', error);
            this.showError(error.message || t('error.server'));
        } finally {
            this.showLoading(false);
        }
    }

    // Bulk delete selected records
    async bulkDelete() {
        if (this.selectedIds.size === 0) {
            this.showError('กรุณาเลือกข้อมูลที่ต้องการลบ');
            return;
        }

        if (!confirm(t('crud.bulkDeleteConfirm'))) {
            return;
        }

        try {
            this.showLoading(true);
            const ids = Array.from(this.selectedIds);

            // Use the native bulkDelete API instead of looping
            await apiClient.bulkDelete(this.resourceName, ids);

            this.selectedIds.clear();
            this.showSuccess(`ลบข้อมูล ${ids.length} รายการสำเร็จ`);
            await this.loadData();
        } catch (error) {
            console.error('Error bulk deleting:', error);
            this.showError(error.message || t('error.server'));
        } finally {
            this.showLoading(false);
        }
    }

    // Handle sort
    handleSort(field, direction) {
        this.sortBy = field;
        this.sortDirection = direction;
        this.loadData();
    }

    // Handle selection
    handleSelect(id, selected) {
        const stringId = String(id);
        if (selected) {
            this.selectedIds.add(stringId);
        } else {
            this.selectedIds.delete(stringId);
        }
        this.updateBulkActionButtons();
    }

    // Handle select all
    handleSelectAll(selected) {
        if (this.tableManager) {
            const visibleIds = this.tableManager.getVisibleIds();
            visibleIds.forEach(id => {
                const stringId = String(id);
                if (selected) {
                    this.selectedIds.add(stringId);
                } else {
                    this.selectedIds.delete(stringId);
                }
            });
        }
        this.updateBulkActionButtons();
    }

    // Update bulk action buttons state
    updateBulkActionButtons() {
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        const selectedCount = document.getElementById('selectedCount');

        if (bulkDeleteBtn) {
            bulkDeleteBtn.disabled = this.selectedIds.size === 0;
        }
        if (selectedCount) {
            selectedCount.textContent = this.selectedIds.size;
        }
    }

    // Go to specific page
    goToPage(page) {
        this.currentPage = page;
        this.loadData();
    }

    // Change per page
    changePerPage(perPage) {
        this.perPage = perPage;
        this.currentPage = 1;
        this.loadData();
    }

    // Update record count display
    updateRecordCount() {
        const countEl = document.getElementById('recordCount');
        if (countEl) {
            const start = (this.currentPage - 1) * this.perPage + 1;
            const end = Math.min(this.currentPage * this.perPage, this.totalRecords);
            countEl.textContent = `${t('pagination.showing')} ${start}-${end} ${t('pagination.of')} ${formatNumber(this.totalRecords)} ${t('pagination.records')}`;
        }
    }

    // Show/hide loading
    showLoading(show) {
        const loader = document.getElementById('loadingOverlay');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    // Show success message
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    // Show error message
    showError(message) {
        this.showToast(message, 'danger');
    }

    // Show toast notification
    showToast(message, type = 'info') {
        // Create toast container if not exists
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }

        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        container.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CrudManager };
}
