/**
 * Form Manager
 * Handles dynamic form generation and validation
 */

class FormManager {
    constructor(resourceName, options = {}) {
        this.resourceName = resourceName;
        this.resourceConfig = RESOURCES[resourceName];
        this.options = {
            formId: 'dataForm',
            mode: 'create', // 'create' or 'edit'
            onSubmit: null,
            ...options
        };

        this.formEl = document.getElementById(this.options.formId);
        this.recordId = null;
        this.referenceData = {};
    }

    // Get editable fields from config
    getEditableFields() {
        const fields = this.resourceConfig?.fields || {};
        return Object.entries(fields)
            .filter(([_, config]) => config.edit !== false)
            .map(([name, config]) => ({ name, ...config }));
    }

    // Initialize form
    async init() {
        // Get record ID from URL if editing
        const urlParams = new URLSearchParams(window.location.search);
        this.recordId = urlParams.get('id');

        if (this.recordId) {
            this.options.mode = 'edit';
        }

        // Load reference data for dropdowns
        await this.loadReferenceData();

        // Render form
        this.render();

        // Load record data if editing
        if (this.recordId) {
            await this.loadRecordData();
        }

        // Setup form submission
        this.setupSubmitHandler();
    }

    // Load reference data for dropdowns
    async loadReferenceData() {
        const fields = this.getEditableFields();
        const referenceFields = fields.filter(f => f.type === 'reference');

        for (const field of referenceFields) {
            try {
                const records = await apiClient.getReferenceOptions(field.reference);
                this.referenceData[field.reference] = records.map(r => {
                    const params = r.params || r;
                    let label;
                    if (params.first_name || params.last_name) {
                        label = `${params.title_owner || ''} ${params.first_name || ''} ${params.last_name || ''}`.trim()
                    } else {
                        label = params.title || params.name || params.fullName ||
                            params.year || params.username || `ID: ${params.id}`
                    }
                    return { value: params.id, label };
                });
            } catch (error) {
                console.error(`Error loading reference data for ${field.reference}:`, error);
                this.referenceData[field.reference] = [];
            }
        }
    }

    // Load record data for editing
    async loadRecordData() {
        try {
            const result = await apiClient.show(this.resourceName, this.recordId);
            const record = result.record?.params || result.record || result;

            // Populate form fields
            Object.entries(record).forEach(([key, value]) => {
                const input = this.formEl.querySelector(`[name="${key}"]`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = value;
                    } else if (input.type === 'date' && value) {
                        // Format date for input
                        input.value = value.substring(0, 10);
                    } else if (input.type === 'datetime-local' && value) {
                        input.value = value.substring(0, 16);
                    } else {
                        input.value = value ?? '';
                    }
                }
            });

            // Update form title
            const formTitle = document.getElementById('formTitle');
            if (formTitle) {
                formTitle.textContent = `${t('common.edit')} ${this.resourceConfig.label}`;
            }
        } catch (error) {
            console.error('Error loading record:', error);
        }
    }

    // Render form
    render() {
        if (!this.formEl) return;

        const fields = this.getEditableFields();

        let html = '<div class="row">';

        fields.forEach(field => {
            const colClass = field.type === 'textarea' || field.type === 'json' ? 'col-12' : 'col-md-6';
            html += `
                <div class="${colClass} mb-3">
                    ${this.renderField(field)}
                </div>
            `;
        });

        html += '</div>';

        // Add submit buttons
        html += `
            <div class="d-flex gap-2 mt-4">
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-check-lg me-1"></i>
                    ${this.options.mode === 'edit' ? t('common.update') : t('common.save')}
                </button>
                <button type="button" class="btn btn-outline-secondary" onclick="history.back()">
                    <i class="bi bi-x-lg me-1"></i>
                    ${t('common.cancel')}
                </button>
            </div>
        `;

        this.formEl.innerHTML = html;
    }

    // Render individual field
    renderField(field) {
        const required = field.required ? 'required' : '';
        const requiredBadge = field.required ?
            '<span class="text-danger">*</span>' :
            `<small class="text-muted">(${t('form.optional')})</small>`;

        let inputHtml = '';

        switch (field.type) {
            case 'textarea':
                inputHtml = `
                    <textarea
                        class="form-control"
                        id="${field.name}"
                        name="${field.name}"
                        rows="4"
                        ${required}
                    ></textarea>
                `;
                break;

            case 'select':
                inputHtml = `
                    <select
                        class="form-select"
                        id="${field.name}"
                        name="${field.name}"
                        ${required}
                    >
                        <option value="">${t('form.pleaseSelect')}</option>
                        ${(field.options || []).map(opt =>
                    `<option value="${opt}">${opt}</option>`
                ).join('')}
                    </select>
                `;
                break;

            case 'reference':
                const refOptions = this.referenceData[field.reference] || [];
                inputHtml = `
                    <select
                        class="form-select"
                        id="${field.name}"
                        name="${field.name}"
                        ${required}
                    >
                        <option value="">${t('form.pleaseSelect')}</option>
                        ${refOptions.map(opt =>
                    `<option value="${opt.value}">${opt.label}</option>`
                ).join('')}
                    </select>
                `;
                break;

            case 'password':
                inputHtml = `
                    <input
                        type="password"
                        class="form-control"
                        id="${field.name}"
                        name="${field.name}"
                        ${this.options.mode === 'edit' ? 'placeholder="ไม่เปลี่ยนแปลงหากเว้นว่าง"' : required}
                    >
                `;
                break;

            case 'email':
                inputHtml = `
                    <input
                        type="email"
                        class="form-control"
                        id="${field.name}"
                        name="${field.name}"
                        ${required}
                    >
                `;
                break;

            case 'number':
                inputHtml = `
                    <input
                        type="number"
                        class="form-control"
                        id="${field.name}"
                        name="${field.name}"
                        step="any"
                        ${required}
                    >
                `;
                break;

            case 'date':
                inputHtml = `
                    <input
                        type="date"
                        class="form-control"
                        id="${field.name}"
                        name="${field.name}"
                        ${required}
                    >
                `;
                break;

            case 'datetime':
                inputHtml = `
                    <input
                        type="datetime-local"
                        class="form-control"
                        id="${field.name}"
                        name="${field.name}"
                        ${required}
                    >
                `;
                break;

            case 'boolean':
                inputHtml = `
                    <div class="form-check form-switch">
                        <input
                            type="checkbox"
                            class="form-check-input"
                            id="${field.name}"
                            name="${field.name}"
                            value="true"
                        >
                        <label class="form-check-label" for="${field.name}">
                            ${field.label}
                        </label>
                    </div>
                `;
                return inputHtml;

            case 'file':
            case 'image':
                inputHtml = `
                    <input
                        type="file"
                        class="form-control"
                        id="${field.name}"
                        name="${field.name}"
                        ${field.type === 'image' ? 'accept="image/*"' : ''}
                        ${required}
                    >
                `;
                break;

            case 'json':
                inputHtml = `
                    <textarea
                        class="form-control font-monospace"
                        id="${field.name}"
                        name="${field.name}"
                        rows="6"
                        placeholder='{"key": "value"}'
                        ${required}
                    ></textarea>
                    <small class="text-muted">กรอกข้อมูลในรูปแบบ JSON</small>
                `;
                break;

            case 'files':
                // Multiple file upload with dropzone
                inputHtml = `
                    <div id="${field.name}UploadContainer" class="file-upload-field"></div>
                    <input type="hidden" id="${field.name}" name="${field.name}">
                `;
                // Initialize FileUploadManager after render
                setTimeout(() => this.initFileUpload(field), 0);
                break;

            default:
                inputHtml = `
                    <input
                        type="text"
                        class="form-control"
                        id="${field.name}"
                        name="${field.name}"
                        ${required}
                    >
                `;
        }

        return `
            <label class="form-label" for="${field.name}">
                ${field.label} ${requiredBadge}
            </label>
            ${inputHtml}
        `;
    }

    // Setup form submission handler
    setupSubmitHandler() {
        if (!this.formEl) return;

        this.formEl.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validate form
            if (!this.formEl.checkValidity()) {
                this.formEl.classList.add('was-validated');
                return;
            }

            // Collect form data
            const formData = new FormData(this.formEl);
            const data = {};

            formData.forEach((value, key) => {
                // Handle file inputs
                const input = this.formEl.querySelector(`[name="${key}"]`);
                if (input && input.type === 'file') {
                    if (input.files && input.files.length > 0) {
                        data[key] = input.files[0];
                    }
                } else if (input && input.type === 'checkbox') {
                    data[key] = input.checked;
                } else if (value !== '') {
                    data[key] = value;
                }
            });

            // Skip empty password in edit mode
            if (this.options.mode === 'edit' && data.password === '') {
                delete data.password;
            }

            // Call submit handler
            if (this.options.onSubmit) {
                await this.options.onSubmit(data, this.recordId);
            }
        });
    }

    // Populate form with data
    populate(data) {
        if (!this.formEl || !data) return;

        Object.entries(data).forEach(([key, value]) => {
            const input = this.formEl.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = value;
                } else {
                    input.value = value ?? '';
                }
            }
        });
    }

    // Clear form
    clear() {
        if (this.formEl) {
            this.formEl.reset();
            this.formEl.classList.remove('was-validated');
        }
    }

    // Initialize file upload for 'files' type fields
    initFileUpload(field) {
        const containerId = `#${field.name}UploadContainer`;
        const hiddenInput = document.getElementById(field.name);

        if (!document.querySelector(containerId)) return;

        // Check if FileUploadManager is available
        if (typeof FileUploadManager === 'undefined') {
            console.warn('FileUploadManager not loaded. Include /frontend/modules/FileUploadManager.js');
            return;
        }

        // Determine fieldName based on apiEndpoint
        // /api/upload* expects 'image' or 'file'
        // /api/documents/upload expects 'files' (array)
        let fieldName = 'files'; // default
        const apiEndpoint = field.apiEndpoint || '/api/documents/upload';

        if (apiEndpoint.includes('/api/upload') && !apiEndpoint.includes('/api/documents')) {
            // /api/upload/image or /api/upload-image use single file field
            fieldName = field.fieldName || 'file';
        }

        const uploader = new FileUploadManager({
            container: containerId,
            apiEndpoint: apiEndpoint,
            fieldName: fieldName,
            maxTotalSize: field.maxSize || 15 * 1024 * 1024,

            onUploadComplete: (uploadedFiles) => {
                // Store uploaded file URLs in hidden input as JSON
                const urls = uploadedFiles.map(f => f.url);
                hiddenInput.value = JSON.stringify(urls);

                // Store full data for later access
                if (!this.uploadedFilesData) this.uploadedFilesData = {};
                this.uploadedFilesData[field.name] = uploadedFiles;
            }
        });

        uploader.init();

        // Store reference for cleanup
        if (!this.fileUploaders) this.fileUploaders = {};
        this.fileUploaders[field.name] = uploader;
    }

    // Get uploaded files data
    getUploadedFiles(fieldName) {
        if (fieldName && this.uploadedFilesData) {
            return this.uploadedFilesData[fieldName] || [];
        }
        return this.uploadedFilesData || {};
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormManager };
}
