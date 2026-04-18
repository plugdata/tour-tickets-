/**
 * Table Manager
 * Handles data table rendering with sorting, selection, and actions
 */

class TableManager {
    constructor(resourceName, options = {}) {
        this.resourceName = resourceName;
        this.resourceConfig = RESOURCES[resourceName];
        this.options = {
            tableId: 'dataTable',
            showCheckbox: true,
            showActions: true,
            actions: ['view', 'edit', 'delete'],
            onSort: null,
            onSelect: null,
            onSelectAll: null,
            onEdit: null,
            onDelete: null,
            onView: null,
            ...options
        };

        this.records = [];
        this.currentSort = { field: null, direction: 'asc' };
        this.tableEl = document.getElementById(this.options.tableId);
        this.lookups = {}; // { fieldName: { id: displayLabel } }
    }

    // Pre-fetch lookup data for all reference fields
    async fetchLookups() {
        const fields = this.getListFields();
        const refFields = fields.filter(f => f.type === 'reference' && f.reference);
        const seen = new Set();
        await Promise.all(refFields.map(async field => {
            if (seen.has(field.reference)) return;
            seen.add(field.reference);
            try {
                const res = await fetch(`/admin/api/resources/${field.reference}/actions/list?perPage=1000`, { credentials: 'include' });
                const data = await res.json();
                const map = {};
                (data.records || []).forEach(r => {
                    const p = r.params || r;
                    let label;
                    if (p.year) label = String(p.year);
                    else if (p.first_name || p.last_name) label = `${p.title_owner || ''} ${p.first_name || ''} ${p.last_name || ''}`.trim();
                    else label = p.title || p.name || p.fullName || p.username || String(p.id);
                    map[String(p.id)] = label;
                });
                // Store under the field name (e.g. 'fiscalYearId')
                this.lookups[field.name] = map;
            } catch (_) {}
        }));
    }

    // Render table (async to support lookups)
    async renderAsync(records) {
        await this.fetchLookups();
        this.render(records);
    }

    // Get list fields from config
    getListFields() {
        const fields = this.resourceConfig?.fields || {};
        return Object.entries(fields)
            .filter(([_, config]) => config.list !== false)
            .map(([name, config]) => ({ name, ...config }));
    }

    // Render table
    render(records) {
        this.records = records;

        if (!this.tableEl) return;

        const fields = this.getListFields();

        // Build table HTML
        let html = `
            <thead class="table-light">
                <tr>
                    ${this.options.showCheckbox ? `
                        <th style="width: 40px;">
                            <input type="checkbox" class="form-check-input" id="selectAll">
                        </th>
                    ` : ''}
                    ${fields.map(field => `
                        <th class="sortable" data-field="${field.name}">
                            ${field.label}
                            <i class="bi bi-arrow-down-up sort-icon ms-1"></i>
                        </th>
                    `).join('')}
                    ${this.options.showActions ? `
                        <th style="width: 150px;">${t('common.actions')}</th>
                    ` : ''}
                </tr>
            </thead>
            <tbody>
                ${records.length === 0 ? `
                    <tr>
                        <td colspan="${fields.length + (this.options.showCheckbox ? 1 : 0) + (this.options.showActions ? 1 : 0)}"
                            class="text-center text-muted py-4">
                            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                            ${t('crud.noRecordsFound')}
                        </td>
                    </tr>
                ` : records.map(record => this.renderRow(record, fields)).join('')}
            </tbody>
        `;

        this.tableEl.innerHTML = html;

        // Setup event listeners
        this.setupEventListeners();
    }

    // Render single row
    renderRow(record, fields) {
        const id = record.id || record.params?.id;
        const params = record.params || record;
        const populated = record.populated || {};

        return `
            <tr data-id="${id}" class="table-row-clickable">
                ${this.options.showCheckbox ? `
                    <td class="no-row-click">
                        <input type="checkbox" class="form-check-input row-checkbox" data-id="${id}">
                    </td>
                ` : ''}
                ${fields.map(field => {
                    const rawVal = params[field.name];
                    let value = rawVal;
                    if (field.type === 'reference') {
                        const lookup = this.lookups[field.name];
                        if (lookup && rawVal != null) {
                            value = lookup[String(rawVal)] ?? rawVal;
                        } else if (populated[field.name]) {
                            value = populated[field.name].params || populated[field.name];
                        }
                    }
                    return `<td>${this.formatValue(value, field)}</td>`;
                }).join('')}
                ${this.options.showActions ? `
                    <td class="no-row-click">
                        <div class="btn-group btn-group-sm">
                            ${this.options.actions.includes('edit') ? `
                                <button class="btn btn-sm btn-outline-primary action-edit" data-id="${id}" title="${t('common.edit')}">
                                    <i class="bi bi-pencil-square me-1"></i>แก้ไข
                                </button>
                            ` : ''}
                            ${this.options.actions.includes('view') ? `
                                <button class="btn btn-sm btn-outline-secondary action-view" data-id="${id}" title="${t('common.view')}">
                                    <i class="bi bi-eye"></i>
                                </button>
                            ` : ''}
                            ${this.options.actions.includes('delete') ? `
                                <button class="btn btn-sm btn-outline-danger action-delete" data-id="${id}" title="${t('common.delete')}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                ` : ''}
            </tr>
        `;
    }

    // Format value for display
    formatValue(value, field) {
        if (value === null || value === undefined) {
            return '<span class="text-muted">-</span>';
        }

        switch (field.type) {
            case 'datetime':
                return formatDateTimeThai(value);

            case 'date':
                return formatDateThai(value);

            case 'number':
                return formatNumber(value);

            case 'currency':
                return formatCurrency(value);

            case 'select':
                return `<span class="badge bg-secondary">${value}</span>`;

            case 'reference':
                // Show reference display name if available
                if (typeof value === 'object') {
                    // year field for FiscalYear, name fields for Owner/others
                    if (value.year) return value.year
                    if (value.first_name || value.last_name) {
                        return `${value.title_owner || ''} ${value.first_name || ''} ${value.last_name || ''}`.trim()
                    }
                    return value.title || value.name || value.fullName || value.id;
                }
                return value;

            case 'boolean':
                return value ?
                    '<i class="bi bi-check-circle-fill text-success"></i>' :
                    '<i class="bi bi-x-circle-fill text-danger"></i>';

            case 'email':
                return `<a href="mailto:${value}">${this.escapeHtml(value)}</a>`;

            case 'password':
                return '••••••••';

            case 'file':
            case 'image':
                if (value) {
                    return `<a href="${value}" target="_blank" class="btn btn-sm btn-outline-secondary">
                        <i class="bi bi-file-earmark"></i> ดูไฟล์
                    </a>`;
                }
                return '-';

            case 'json':
                return '<code class="text-truncate d-inline-block" style="max-width: 200px;">JSON</code>';

            case 'textarea':
                const truncated = String(value).substring(0, 50);
                return this.escapeHtml(truncated) + (value.length > 50 ? '...' : '');

            default:
                const strValue = String(value);
                if (strValue.length > 100) {
                    return this.escapeHtml(strValue.substring(0, 100)) + '...';
                }
                return this.escapeHtml(strValue);
        }
    }

    // Escape HTML to prevent XSS
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Setup event listeners
    setupEventListeners() {
        // ── คลิก row → edit (ยกเว้น checkbox และ action buttons) ──
        // TODO: ยังไม่เปิดใช้งาน feature นี้
        // this.tableEl.querySelectorAll('tr.table-row-clickable').forEach(tr => {
        //     tr.addEventListener('click', (e) => {
        //         // ข้ามถ้าคลิกที่ cell ที่มี class no-row-click (checkbox / actions)
        //         if (e.target.closest('.no-row-click')) return;
        //         const id = tr.dataset.id;
        //         if (id && this.options.onEdit) {
        //             this.options.onEdit(id);
        //         }
        //     });
        // });

        // Select all checkbox
        const selectAll = this.tableEl.querySelector('#selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                const checkboxes = this.tableEl.querySelectorAll('.row-checkbox');
                checkboxes.forEach(cb => cb.checked = e.target.checked);
                if (this.options.onSelectAll) {
                    this.options.onSelectAll(e.target.checked);
                }
            });
        }

        // Row checkboxes
        this.tableEl.querySelectorAll('.row-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = String(e.target.dataset.id);
                if (this.options.onSelect) {
                    this.options.onSelect(id, e.target.checked);
                }
            });
        });

        // Sortable headers
        this.tableEl.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', (e) => {
                const field = th.dataset.field;
                let direction = 'asc';
                if (this.currentSort.field === field && this.currentSort.direction === 'asc') {
                    direction = 'desc';
                }
                this.currentSort = { field, direction };

                // Update sort icons
                this.tableEl.querySelectorAll('.sortable').forEach(header => {
                    header.classList.remove('sorted-asc', 'sorted-desc');
                });
                th.classList.add(`sorted-${direction}`);

                if (this.options.onSort) {
                    this.options.onSort(field, direction);
                }
            });
        });

        // Action buttons
        this.tableEl.querySelectorAll('.action-view').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.options.onView) {
                    this.options.onView(btn.dataset.id);
                }
            });
        });

        this.tableEl.querySelectorAll('.action-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.options.onEdit) {
                    this.options.onEdit(btn.dataset.id);
                }
            });
        });

        this.tableEl.querySelectorAll('.action-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.options.onDelete) {
                    this.options.onDelete(btn.dataset.id);
                }
            });
        });
    }

    // Get visible record IDs
    getVisibleIds() {
        return this.records.map(r => String(r.id || r.params?.id));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TableManager };
}
