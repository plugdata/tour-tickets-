/**
 * File Upload Feature (Multiple Instance & Generic File support)
 */
const FileUpload = {
    instances: {}, // map of targetInputId -> { pendingFiles, options }

    init(containerSelector, options = {}) {
        const { 
            targetInputId, 
            multiple = false, 
            btnText = 'เลือกรูปภาพ', 
            btnIcon = 'bi-images',
            allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
        } = options;

        this.instances[targetInputId] = {
            pendingFiles: [],
            options: { targetInputId, multiple, btnText, btnIcon, allowedTypes }
        };

        const container = document.querySelector(containerSelector);
        if (!container) return;

        container.innerHTML = `
            <div class="upload-component" data-id="${targetInputId}">
                <div class="d-flex gap-2 mb-2">
                    <button class="btn btn-outline-primary btn-sm" type="button" onclick="document.getElementById('${targetInputId}_file').click()">
                        <i class="bi ${btnIcon} me-1"></i> ${btnText}${multiple ? ' (หลายไฟล์)' : ''}
                    </button>
                    <button class="btn btn-outline-danger btn-sm d-none" id="${targetInputId}_clear" type="button" onclick="FileUpload.clearPending('${targetInputId}')">
                        ล้างทั้งหมด
                    </button>
                    <input type="file" class="d-none" id="${targetInputId}_file" ${multiple ? 'multiple' : ''}>
                </div>
                <div id="${targetInputId}_preview" class="d-flex flex-wrap gap-2"></div>
                <input type="hidden" id="${targetInputId}" value="">
            </div>
        `;

        const fileInput = document.getElementById(`${targetInputId}_file`);
        fileInput.onchange = (e) => this._handleFileSelect(e, targetInputId);
    },

    async _handleFileSelect(e, id) {
        const inst = this.instances[id];
        const files = Array.from(e.target.files);
        if (!files.length) return;

        if (!inst.options.multiple) {
            inst.pendingFiles.forEach(item => URL.revokeObjectURL(item.previewUrl));
            inst.pendingFiles = [];
        }

        files.forEach(file => {
            // Validate type if needed
            if (inst.options.allowedTypes && !inst.options.allowedTypes.includes(file.type)) {
                // Fallback: if it's a generic file and the user provided specific types
                // we check extension or just trust 'accept' if we added it
            }
            const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
            inst.pendingFiles.push({ file, previewUrl });
        });

        this._renderPreview(id);
        e.target.value = '';
    },

    async uploadAllPending(id) {
        const inst = this.instances[id];
        if (!inst || inst.pendingFiles.length === 0) return [];

        const results = await Promise.all(inst.pendingFiles.map(async (item) => {
            try {
                return await API.uploads.upload(item.file);
            } catch (e) {
                showToast(`อัปโหลด ${item.file.name} ล้มเหลว: ${e.message}`, 'danger');
                throw e;
            }
        }));

        const urls = results.map(r => r.url);
        this.clearPending(id);
        return urls;
    },

    async remove(index, isSaved, id) {
        const inst = this.instances[id];
        if (!inst) return;

        if (isSaved) {
            const input = document.getElementById(id);
            const urls = input.value.split(',').filter(x => x);
            const targetUrl = urls[index];

            if (confirm('คุณต้องการลบไฟล์นี้ออกจากระบบถาวรหรือไม่?')) {
                try {
                    await API.uploads.remove(targetUrl);
                    urls.splice(index, 1);
                    input.value = urls.join(',');
                    showToast('ลบไฟล์สำเร็จ');
                } catch (e) {
                    showToast('ลบไฟล์ล้มเหลว: ' + e.message, 'danger');
                    return;
                }
            } else return;
        } else {
            const item = inst.pendingFiles.splice(index, 1)[0];
            if (item && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        }
        this._renderPreview(id);
    },

    clearPending(id) {
        const inst = this.instances[id];
        if (!inst) return;
        inst.pendingFiles.forEach(item => { if (item.previewUrl) URL.revokeObjectURL(item.previewUrl); });
        inst.pendingFiles = [];
        this._renderPreview(id);
    },

    setExisting(urls, id) {
        const inst = this.instances[id];
        if (!inst) return;
        const val = Array.isArray(urls) ? urls.join(',') : (urls || '');
        document.getElementById(id).value = val;
        inst.pendingFiles = [];
        this._renderPreview(id);
    },

    _renderPreview(id) {
        const inst = this.instances[id];
        const previewGrid = document.getElementById(`${id}_preview`);
        const clearBtn = document.getElementById(`${id}_clear`);
        if (!previewGrid) return;

        const existingUrls = document.getElementById(id).value.split(',').filter(x => x);
        previewGrid.innerHTML = '';
        
        existingUrls.forEach((url, i) => { previewGrid.innerHTML += this._getThumbHtml(url, true, i, id); });
        inst.pendingFiles.forEach((item, i) => { 
            const url = item.previewUrl || ''; // No preview for non-images
            previewGrid.innerHTML += this._getThumbHtml(url, false, i, id, item.file.name); 
        });

        if (clearBtn) clearBtn.classList.toggle('d-none', inst.pendingFiles.length === 0 && existingUrls.length === 0);
    },

    _getThumbHtml(url, isSaved, index, id, fileName = '') {
        const isImage = url && (url.startsWith('blob:') || url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || url.startsWith('http'));
        const display = isImage 
            ? `<img src="${url}" class="rounded border w-100 h-100 object-fit-cover">`
            : `<div class="rounded border w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-light text-primary p-1 text-center" style="font-size: 0.6rem; overflow: hidden; word-break: break-all;">
                 <i class="bi bi-file-earmark-text fs-4"></i>
                 <span class="d-block w-100">${fileName || url.split('/').pop()}</span>
               </div>`;

        return `
            <div class="position-relative" style="width: 80px; height: 80px;">
                ${display}
                ${!isSaved ? '<span class="badge bg-warning position-absolute top-0 start-0 m-1" style="font-size: 0.5rem; z-index: 2;">รอเซฟ</span>' : ''}
                <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 p-0 rounded-circle" 
                    style="width: 20px; height: 20px; font-size: 0.6rem; margin: -5px -5px 0 0; z-index: 3;"
                    onclick="FileUpload.remove(${index}, ${isSaved}, '${id}')">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;
    }
};
