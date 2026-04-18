/**
 * File Upload Feature (Multiple & Delayed Upload support)
 */
const FileUpload = {
    pendingFiles: [], // List of { file, previewUrl }

    /**
     * Helper to handle file selection and upload
     * @param {File} file - The file to upload
     * @returns {Promise<Object>} - The upload object from API
     */
    async uploadSingle(file) {
        try {
            if (!file) throw new Error('No file selected');
            
            // Validate type
            const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowed.includes(file.type)) {
                throw new Error(`File ${file.name} type not allowed`);
            }

            // Validate size (e.g., 5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error(`File ${file.name} too large (max 5MB)`);
            }

            return await API.uploads.upload(file);
        } catch (e) {
            console.error('FileUpload Error:', e);
            throw e;
        }
    },

    /**
     * Upload all pending files and return their URLs
     */
    async uploadAllPending() {
        if (this.pendingFiles.length === 0) return [];
        const results = await Promise.all(this.pendingFiles.map(item => this.uploadSingle(item.file)));
        const urls = results.map(r => r.url);
        this.clearPending();
        return urls;
    },

    clearPending() {
        // Revoke object URLs to avoid memory leaks
        this.pendingFiles.forEach(item => URL.revokeObjectURL(item.previewUrl));
        this.pendingFiles = [];
        this._renderPreview();
    },

    /**
     * Create a standard upload UI component
     */
    init(containerSelector, { targetInputId, multiple = false }) {
        this.containerSelector = containerSelector;
        this.targetInputId = targetInputId;
        this.multiple = multiple;
        this.pendingFiles = [];

        const container = document.querySelector(containerSelector);
        if (!container) return;

        container.innerHTML = `
            <div class="upload-component">
                <div class="d-flex gap-2 mb-2">
                    <button class="btn btn-outline-primary btn-sm" type="button" onclick="document.getElementById('${targetInputId}_file').click()">
                        <i class="bi bi-images me-1"></i> เลือกรูปภาพ${multiple ? ' (หลายรูป)' : ''}
                    </button>
                    <button class="btn btn-outline-danger btn-sm d-none" id="${targetInputId}_clear" type="button" onclick="FileUpload.clearPending()">
                        ล้างทั้งหมด
                    </button>
                    <input type="file" class="d-none" accept="image/*" id="${targetInputId}_file" ${multiple ? 'multiple' : ''}>
                </div>
                <div id="${targetInputId}_preview" class="d-flex flex-wrap gap-2"></div>
                <!-- Hidden input to store existing URLs -->
                <input type="hidden" id="${targetInputId}" value="">
            </div>
        `;

        document.getElementById(`${targetInputId}_file`).onchange = (e) => {
            const files = Array.from(e.target.files);
            if (!files.length) return;

            if (!this.multiple) {
                this.pendingFiles.forEach(item => URL.revokeObjectURL(item.previewUrl));
                this.pendingFiles = [];
            }

            files.forEach(file => {
                const previewUrl = URL.createObjectURL(file);
                this.pendingFiles.push({ file, previewUrl });
            });

            this._renderPreview();
            e.target.value = ''; // clear for next selection
        };
    },

    _renderPreview() {
        const previewGrid = document.getElementById(`${this.targetInputId}_preview`);
        const clearBtn = document.getElementById(`${this.targetInputId}_clear`);
        if (!previewGrid) return;

        const existingUrls = document.getElementById(this.targetInputId).value.split(',').filter(x => x);
        
        previewGrid.innerHTML = '';
        
        // Render Existing
        existingUrls.forEach((url, i) => {
            previewGrid.innerHTML += this._getThumbHtml(url, true, i);
        });

        // Render Pending
        this.pendingFiles.forEach((item, i) => {
            previewGrid.innerHTML += this._getThumbHtml(item.previewUrl, false, i);
        });

        if (clearBtn) {
            clearBtn.classList.toggle('d-none', this.pendingFiles.length === 0 && existingUrls.length === 0);
        }
    },

    _getThumbHtml(url, isSaved, index) {
        return `
            <div class="position-relative" style="width: 80px; height: 80px;">
                <img src="${url}" class="rounded border w-100 h-100 object-fit-cover">
                ${!isSaved ? '<span class="badge bg-warning position-absolute top-0 start-0 m-1" style="font-size: 0.5rem;">รอกดยืนยัน</span>' : ''}
                <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 p-0 rounded-circle" 
                    style="width: 20px; height: 20px; font-size: 0.6rem; margin: -5px -5px 0 0;"
                    onclick="FileUpload.remove(${index}, ${isSaved})">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;
    },

    async remove(index, isSaved) {
        if (isSaved) {
            const input = document.getElementById(this.targetInputId);
            const urls = input.value.split(',').filter(x => x);
            const targetUrl = urls[index];

            if (confirm('คุณต้องการลบรูปภาพนี้ออกจากระบบถาวรหรือไม่?')) {
                try {
                    await API.uploads.remove(targetUrl);
                    urls.splice(index, 1);
                    input.value = urls.join(',');
                    showToast('ลบรูปภาพสำเร็จ');
                } catch (e) {
                    showToast('ลบรูปภาพล้มเหลว: ' + e.message, 'danger');
                    return;
                }
            } else {
                return;
            }
        } else {
            const item = this.pendingFiles.splice(index, 1)[0];
            if (item) URL.revokeObjectURL(item.previewUrl);
        }
        this._renderPreview();
    },

    setExisting(urls) {
        // urls can be a string separated by comma or array
        const val = Array.isArray(urls) ? urls.join(',') : (urls || '');
        document.getElementById(this.targetInputId).value = val;
        this.pendingFiles = [];
        this._renderPreview();
    }
};
