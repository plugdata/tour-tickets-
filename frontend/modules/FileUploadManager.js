/**
 * File Upload Manager
 * Reusable drag & drop file upload with preview
 *
 * Features:
 * - Drag & drop zone (dropbox UI)
 * - Multiple file upload
 * - Preview for images, PDF, and documents
 * - 15MB total size limit
 * - Can be imported and used in any page
 *
 * Usage:
 *   const uploader = new FileUploadManager({
 *     container: '#uploadArea',
 *     onUploadComplete: (files) => console.log(files),
 *     maxTotalSize: 15 * 1024 * 1024
 *   });
 *   uploader.init();
 */

class FileUploadManager {
    constructor(options = {}) {
        this.options = {
            container: '#fileUploadContainer',
            apiEndpoint: '/api/documents/upload',
            fieldName: 'files', // Custom field name for the upload (default: 'files' for /api/documents/upload)
            maxTotalSize: 15 * 1024 * 1024, // 15MB
            maxFiles: 50,
            allowedTypes: [
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain',
                'application/rtf'
            ],
            onFileSelect: null,
            onUploadStart: null,
            onUploadProgress: null,
            onUploadComplete: null,
            onUploadError: null,
            onFileRemove: null,
            ...options
        };

        this.container = null;
        this.dropZone = null;
        this.fileInput = null;
        this.previewContainer = null;
        this.selectedFiles = [];
        this.uploadedFiles = [];
    }

    // Initialize the upload manager
    init() {
        this.container = typeof this.options.container === 'string'
            ? document.querySelector(this.options.container)
            : this.options.container;

        if (!this.container) {
            console.error('FileUploadManager: Container not found');
            return;
        }

        this.render();
        this.bindEvents();
    }

    // Render the upload UI
    render() {
        this.container.innerHTML = `
            <div class="file-upload-manager">
                <!-- Drop Zone -->
                <div class="file-dropzone" id="fileDropzone">
                    <div class="dropzone-content">
                        <i class="bi bi-cloud-arrow-up fs-1 text-primary"></i>
                        <p class="mb-1 fw-medium">ลากไฟล์มาวางที่นี่</p>
                        <p class="text-muted small mb-2">หรือ</p>
                        <button type="button" class="btn btn-outline-primary btn-sm" id="selectFilesBtn">
                            <i class="bi bi-folder2-open me-1"></i>เลือกไฟล์
                        </button>
                        <input type="file" id="fileInput" multiple hidden
                            accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf">
                    </div>
                    <div class="dropzone-info text-muted small mt-2">
                        <span>รองรับ: รูปภาพ (JPG, PNG, GIF), PDF, เอกสาร (DOC, DOCX, XLS, XLSX)</span>
                        <span class="d-block">ขนาดรวมไม่เกิน 15MB</span>
                    </div>
                </div>

                <!-- Size Progress -->
                <div class="size-progress mt-3" id="sizeProgress" style="display: none;">
                    <div class="d-flex justify-content-between small mb-1">
                        <span>ขนาดไฟล์รวม</span>
                        <span id="sizeText">0 / 15 MB</span>
                    </div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar" id="sizeProgressBar" role="progressbar" style="width: 0%"></div>
                    </div>
                </div>

                <!-- Preview Container -->
                <div class="file-preview-container mt-3" id="previewContainer"></div>

                <!-- Upload Button -->
                <div class="upload-actions mt-3" id="uploadActions" style="display: none;">
                    <button type="button" class="btn btn-primary" id="uploadBtn">
                        <i class="bi bi-cloud-upload me-1"></i>อัปโหลด
                    </button>
                    <button type="button" class="btn btn-outline-secondary ms-2" id="clearAllBtn">
                        <i class="bi bi-x-lg me-1"></i>ล้างทั้งหมด
                    </button>
                </div>

                <!-- Upload Status -->
                <div class="upload-status mt-3" id="uploadStatus" style="display: none;"></div>
            </div>
        `;

        // Add styles if not already added
        this.addStyles();

        // Store references
        this.dropZone = this.container.querySelector('#fileDropzone');
        this.fileInput = this.container.querySelector('#fileInput');
        this.previewContainer = this.container.querySelector('#previewContainer');
    }

    // Add CSS styles
    addStyles() {
        if (document.getElementById('fileUploadManagerStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'fileUploadManagerStyles';
        styles.textContent = `
            .file-upload-manager {
                width: 100%;
            }

            .file-dropzone {
                border: 2px dashed #dee2e6;
                border-radius: 12px;
                padding: 40px 20px;
                text-align: center;
                background: #f8f9fa;
                transition: all 0.3s ease;
                cursor: pointer;
            }

            .file-dropzone:hover,
            .file-dropzone.dragover {
                border-color: #0d6efd;
                background: #e7f1ff;
            }

            .file-dropzone.dragover {
                transform: scale(1.02);
            }

            .dropzone-content i {
                color: #6c757d;
                transition: color 0.3s;
            }

            .file-dropzone:hover .dropzone-content i,
            .file-dropzone.dragover .dropzone-content i {
                color: #0d6efd;
            }

            .file-preview-container {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 12px;
            }

            .file-preview-item {
                position: relative;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 8px;
                background: #fff;
                transition: box-shadow 0.2s;
            }

            .file-preview-item:hover {
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .file-preview-thumb {
                width: 100%;
                height: 100px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f8f9fa;
                border-radius: 4px;
                overflow: hidden;
            }

            .file-preview-thumb img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            }

            .file-preview-thumb .file-icon {
                font-size: 48px;
            }

            .file-preview-thumb .file-icon.pdf { color: #dc3545; }
            .file-preview-thumb .file-icon.doc { color: #0d6efd; }
            .file-preview-thumb .file-icon.xls { color: #198754; }
            .file-preview-thumb .file-icon.ppt { color: #fd7e14; }
            .file-preview-thumb .file-icon.txt { color: #6c757d; }

            .file-preview-info {
                margin-top: 8px;
            }

            .file-preview-name {
                font-size: 12px;
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .file-preview-size {
                font-size: 11px;
                color: #6c757d;
            }

            .file-preview-remove {
                position: absolute;
                top: 4px;
                right: 4px;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: none;
                background: rgba(220, 53, 69, 0.9);
                color: #fff;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                opacity: 0;
                transition: opacity 0.2s;
            }

            .file-preview-item:hover .file-preview-remove {
                opacity: 1;
            }

            .file-preview-remove:hover {
                background: #dc3545;
            }

            .upload-status .alert {
                margin-bottom: 0;
            }

            .uploaded-file-item {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                margin-bottom: 8px;
                background: #fff;
            }

            .uploaded-file-item .file-thumb {
                width: 40px;
                height: 40px;
                border-radius: 4px;
                overflow: hidden;
                margin-right: 12px;
                background: #f8f9fa;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .uploaded-file-item .file-thumb img {
                max-width: 100%;
                max-height: 100%;
                object-fit: cover;
            }

            .uploaded-file-item .file-info {
                flex: 1;
            }

            .uploaded-file-item .file-name {
                font-weight: 500;
                font-size: 14px;
            }

            .uploaded-file-item .file-meta {
                font-size: 12px;
                color: #6c757d;
            }
        `;
        document.head.appendChild(styles);
    }

    // Bind event listeners
    bindEvents() {
        // Select files button
        this.container.querySelector('#selectFilesBtn').addEventListener('click', () => {
            this.fileInput.click();
        });

        // Click on dropzone
        this.dropZone.addEventListener('click', (e) => {
            if (e.target === this.dropZone || e.target.closest('.dropzone-content')) {
                this.fileInput.click();
            }
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.remove('dragover');
            });
        });

        this.dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });

        // Upload button
        this.container.querySelector('#uploadBtn').addEventListener('click', () => {
            this.upload();
        });

        // Clear all button
        this.container.querySelector('#clearAllBtn').addEventListener('click', () => {
            this.clearAll();
        });
    }

    // Handle selected files
    handleFiles(fileList) {
        const files = Array.from(fileList);

        // Validate file types
        const validFiles = files.filter(file => {
            if (!this.options.allowedTypes.includes(file.type)) {
                this.showError(`ไฟล์ "${file.name}" ไม่รองรับ`);
                return false;
            }
            return true;
        });

        // Check total size
        const currentSize = this.getTotalSize();
        const newSize = validFiles.reduce((sum, f) => sum + f.size, 0);

        if (currentSize + newSize > this.options.maxTotalSize) {
            this.showError('ขนาดไฟล์รวมเกิน 15MB');
            return;
        }

        // Check file count
        if (this.selectedFiles.length + validFiles.length > this.options.maxFiles) {
            this.showError(`จำนวนไฟล์มากเกินไป (สูงสุด ${this.options.maxFiles} ไฟล์)`);
            return;
        }

        // Add files
        validFiles.forEach(file => {
            file._id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            this.selectedFiles.push(file);
        });

        // Update UI
        this.updatePreview();
        this.updateSizeProgress();
        this.updateActions();

        // Callback
        if (this.options.onFileSelect) {
            this.options.onFileSelect(this.selectedFiles);
        }

        // Reset input
        this.fileInput.value = '';
    }

    // Get total size of selected files
    getTotalSize() {
        return this.selectedFiles.reduce((sum, f) => sum + f.size, 0);
    }

    // Format file size
    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Get file icon based on type
    getFileIcon(file) {
        const ext = file.name.split('.').pop().toLowerCase();

        if (file.type.startsWith('image/')) {
            return null; // Will use image preview
        }

        const iconMap = {
            pdf: { icon: 'bi-file-earmark-pdf', class: 'pdf' },
            doc: { icon: 'bi-file-earmark-word', class: 'doc' },
            docx: { icon: 'bi-file-earmark-word', class: 'doc' },
            xls: { icon: 'bi-file-earmark-excel', class: 'xls' },
            xlsx: { icon: 'bi-file-earmark-excel', class: 'xls' },
            ppt: { icon: 'bi-file-earmark-ppt', class: 'ppt' },
            pptx: { icon: 'bi-file-earmark-ppt', class: 'ppt' },
            txt: { icon: 'bi-file-earmark-text', class: 'txt' },
            rtf: { icon: 'bi-file-earmark-text', class: 'txt' }
        };

        return iconMap[ext] || { icon: 'bi-file-earmark', class: 'txt' };
    }

    // Update preview
    updatePreview() {
        this.previewContainer.innerHTML = '';

        this.selectedFiles.forEach(file => {
            const item = document.createElement('div');
            item.className = 'file-preview-item';
            item.dataset.fileId = file._id;

            const isImage = file.type.startsWith('image/');
            const fileIcon = this.getFileIcon(file);

            let thumbHtml = '';
            if (isImage) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = item.querySelector('.preview-img');
                    if (img) img.src = e.target.result;
                };
                reader.readAsDataURL(file);
                thumbHtml = `<img class="preview-img" src="" alt="${file.name}">`;
            } else {
                thumbHtml = `<i class="bi ${fileIcon.icon} file-icon ${fileIcon.class}"></i>`;
            }

            item.innerHTML = `
                <button type="button" class="file-preview-remove" data-file-id="${file._id}">
                    <i class="bi bi-x"></i>
                </button>
                <div class="file-preview-thumb">
                    ${thumbHtml}
                </div>
                <div class="file-preview-info">
                    <div class="file-preview-name" title="${file.name}">${file.name}</div>
                    <div class="file-preview-size">${this.formatSize(file.size)}</div>
                </div>
            `;

            // Remove button event
            item.querySelector('.file-preview-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFile(file._id);
            });

            this.previewContainer.appendChild(item);
        });
    }

    // Update size progress
    updateSizeProgress() {
        const totalSize = this.getTotalSize();
        const percentage = (totalSize / this.options.maxTotalSize) * 100;

        const progressEl = this.container.querySelector('#sizeProgress');
        const progressBar = this.container.querySelector('#sizeProgressBar');
        const sizeText = this.container.querySelector('#sizeText');

        if (this.selectedFiles.length > 0) {
            progressEl.style.display = 'block';
            progressBar.style.width = `${percentage}%`;
            sizeText.textContent = `${this.formatSize(totalSize)} / 15 MB`;

            // Change color based on usage
            progressBar.classList.remove('bg-success', 'bg-warning', 'bg-danger');
            if (percentage < 50) {
                progressBar.classList.add('bg-success');
            } else if (percentage < 80) {
                progressBar.classList.add('bg-warning');
            } else {
                progressBar.classList.add('bg-danger');
            }
        } else {
            progressEl.style.display = 'none';
        }
    }

    // Update action buttons visibility
    updateActions() {
        const actionsEl = this.container.querySelector('#uploadActions');
        actionsEl.style.display = this.selectedFiles.length > 0 ? 'block' : 'none';
    }

    // Remove a file
    removeFile(fileId) {
        this.selectedFiles = this.selectedFiles.filter(f => f._id !== fileId);

        this.updatePreview();
        this.updateSizeProgress();
        this.updateActions();

        if (this.options.onFileRemove) {
            this.options.onFileRemove(fileId, this.selectedFiles);
        }
    }

    // Clear all files
    clearAll() {
        this.selectedFiles = [];
        this.updatePreview();
        this.updateSizeProgress();
        this.updateActions();
        this.hideStatus();
    }

    // Upload files
    async upload() {
        if (this.selectedFiles.length === 0) {
            this.showError('กรุณาเลือกไฟล์');
            return;
        }

        const formData = new FormData();
        const fieldName = this.options.fieldName || 'files';
        this.selectedFiles.forEach(file => {
            formData.append(fieldName, file);
        });

        if (this.options.onUploadStart) {
            this.options.onUploadStart(this.selectedFiles);
        }

        this.showStatus('กำลังอัปโหลด...', 'info');
        this.setUploading(true);

        try {
            const response = await fetch(this.options.apiEndpoint, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'เกิดข้อผิดพลาด');
            }

            this.uploadedFiles = result.data;
            this.selectedFiles = [];

            this.updatePreview();
            this.updateSizeProgress();
            this.updateActions();

            this.showSuccess(`อัปโหลดสำเร็จ ${result.totalFiles} ไฟล์`);
            this.showUploadedFiles(result.data);

            if (this.options.onUploadComplete) {
                this.options.onUploadComplete(result.data);
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showError(error.message);

            if (this.options.onUploadError) {
                this.options.onUploadError(error);
            }
        } finally {
            this.setUploading(false);
        }
    }

    // Show uploaded files
    showUploadedFiles(files) {
        let html = '<div class="uploaded-files mt-3"><h6 class="mb-2">ไฟล์ที่อัปโหลดแล้ว</h6>';

        files.forEach(file => {
            const isImage = file.type === 'image';
            const thumbHtml = isImage
                ? `<img src="${file.url}" alt="${file.originalName}">`
                : `<i class="bi bi-file-earmark-${file.type === 'pdf' ? 'pdf text-danger' : 'text'}"></i>`;

            html += `
                <div class="uploaded-file-item">
                    <div class="file-thumb">${thumbHtml}</div>
                    <div class="file-info">
                        <div class="file-name">${file.originalName}</div>
                        <div class="file-meta">${this.formatSize(file.size)}</div>
                    </div>
                    <a href="${file.url}" target="_blank" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-eye"></i>
                    </a>
                </div>
            `;
        });

        html += '</div>';
        this.previewContainer.innerHTML = html;
    }

    // Set uploading state
    setUploading(uploading) {
        const uploadBtn = this.container.querySelector('#uploadBtn');
        const clearBtn = this.container.querySelector('#clearAllBtn');

        if (uploading) {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>กำลังอัปโหลด...';
            clearBtn.disabled = true;
        } else {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="bi bi-cloud-upload me-1"></i>อัปโหลด';
            clearBtn.disabled = false;
        }
    }

    // Show status message
    showStatus(message, type = 'info') {
        const statusEl = this.container.querySelector('#uploadStatus');
        statusEl.style.display = 'block';
        statusEl.innerHTML = `<div class="alert alert-${type} mb-0">${message}</div>`;
    }

    // Show success message
    showSuccess(message) {
        this.showStatus(`<i class="bi bi-check-circle me-1"></i>${message}`, 'success');
    }

    // Show error message
    showError(message) {
        this.showStatus(`<i class="bi bi-exclamation-triangle me-1"></i>${message}`, 'danger');
    }

    // Hide status
    hideStatus() {
        const statusEl = this.container.querySelector('#uploadStatus');
        statusEl.style.display = 'none';
    }

    // Get uploaded files
    getUploadedFiles() {
        return this.uploadedFiles;
    }

    // Get selected files (not yet uploaded)
    getSelectedFiles() {
        return this.selectedFiles;
    }

    // Destroy instance
    destroy() {
        this.container.innerHTML = '';
        this.selectedFiles = [];
        this.uploadedFiles = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FileUploadManager };
}
