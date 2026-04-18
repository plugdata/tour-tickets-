/**
 * Thai Translations (i18n)
 */

const TRANSLATIONS = {
    // Common
    'common.actions': 'การดำเนินการ',
    'common.add': 'เพิ่ม',
    'common.edit': 'แก้ไข',
    'common.delete': 'ลบ',
    'common.save': 'บันทึก',
    'common.cancel': 'ยกเลิก',
    'common.search': 'ค้นหา',
    'common.filter': 'กรอง',
    'common.clear': 'ล้าง',
    'common.back': 'กลับ',
    'common.view': 'ดู',
    'common.create': 'สร้าง',
    'common.update': 'อัปเดต',
    'common.close': 'ปิด',
    'common.confirm': 'ยืนยัน',
    'common.loading': 'กำลังโหลด...',
    'common.noData': 'ไม่พบข้อมูล',
    'common.error': 'เกิดข้อผิดพลาด',
    'common.success': 'สำเร็จ',
    'common.all': 'ทั้งหมด',
    'common.selected': 'เลือกแล้ว',
    'common.selectAll': 'เลือกทั้งหมด',
    'common.deselectAll': 'ยกเลิกการเลือก',
    'common.refresh': 'รีเฟรช',
    'common.export': 'ส่งออก',
    'common.import': 'นำเข้า',
    'common.yes': 'ใช่',
    'common.no': 'ไม่',

    // Auth
    'auth.login': 'เข้าสู่ระบบ',
    'auth.logout': 'ออกจากระบบ',
    'auth.username': 'ชื่อผู้ใช้',
    'auth.password': 'รหัสผ่าน',
    'auth.rememberMe': 'จดจำการเข้าสู่ระบบ',
    'auth.forgotPassword': 'ลืมรหัสผ่าน?',
    'auth.loginFailed': 'เข้าสู่ระบบไม่สำเร็จ',
    'auth.unauthorized': 'ไม่มีสิทธิ์เข้าถึง',

    // CRUD
    'crud.list': 'รายการ',
    'crud.new': 'สร้างใหม่',
    'crud.show': 'รายละเอียด',
    'crud.editRecord': 'แก้ไขข้อมูล',
    'crud.deleteRecord': 'ลบข้อมูล',
    'crud.createSuccess': 'สร้างข้อมูลสำเร็จ',
    'crud.updateSuccess': 'อัปเดตข้อมูลสำเร็จ',
    'crud.deleteSuccess': 'ลบข้อมูลสำเร็จ',
    'crud.deleteConfirm': 'คุณต้องการลบข้อมูลนี้หรือไม่?',
    'crud.bulkDeleteConfirm': 'คุณต้องการลบข้อมูลที่เลือกทั้งหมดหรือไม่?',
    'crud.noRecordsFound': 'ไม่พบข้อมูล',
    'crud.recordNotFound': 'ไม่พบข้อมูลที่ต้องการ',

    // Pagination
    'pagination.showing': 'แสดง',
    'pagination.of': 'จาก',
    'pagination.records': 'รายการ',
    'pagination.page': 'หน้า',
    'pagination.first': 'หน้าแรก',
    'pagination.last': 'หน้าสุดท้าย',
    'pagination.previous': 'ก่อนหน้า',
    'pagination.next': 'ถัดไป',
    'pagination.perPage': 'ต่อหน้า',

    // Form
    'form.required': 'จำเป็น',
    'form.optional': 'ไม่บังคับ',
    'form.invalid': 'ข้อมูลไม่ถูกต้อง',
    'form.pleaseSelect': 'กรุณาเลือก',
    'form.pleaseEnter': 'กรุณากรอก',
    'form.uploadFile': 'อัปโหลดไฟล์',
    'form.chooseFile': 'เลือกไฟล์',
    'form.noFileChosen': 'ยังไม่ได้เลือกไฟล์',

    // Dashboard
    'dashboard.title': 'แดชบอร์ด',
    'dashboard.welcome': 'ยินดีต้อนรับ',
    'dashboard.totalUsers': 'ผู้ใช้ทั้งหมด',
    'dashboard.totalOwners': 'เจ้าของกรรมสิทธิ์ทั้งหมด',
    'dashboard.totalProjects': 'โครงการทั้งหมด',
    'dashboard.recentActivity': 'กิจกรรมล่าสุด',

    // Status
    'status.pending': 'รอดำเนินการ',
    'status.inProgress': 'กำลังดำเนินการ',
    'status.completed': 'เสร็จสิ้น',
    'status.cancelled': 'ยกเลิก',
    'status.approved': 'อนุมัติ',

    // Errors
    'error.network': 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
    'error.server': 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์',
    'error.validation': 'ข้อมูลไม่ถูกต้อง',
    'error.notFound': 'ไม่พบข้อมูล',
    'error.forbidden': 'ไม่มีสิทธิ์',
    'error.unknown': 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
};

// Translation function
function t(key, params = {}) {
    let text = TRANSLATIONS[key] || key;

    // Replace parameters
    Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, value);
    });

    return text;
}

// Format date to Thai
function formatDateThai(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format datetime to Thai
function formatDateTimeThai(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format number with commas
function formatNumber(num) {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('th-TH');
}

// Format currency
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB'
    }).format(amount);
}

// Format file size
function formatFileSize(bytes) {
    if (!bytes) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TRANSLATIONS,
        t,
        formatDateThai,
        formatDateTimeThai,
        formatNumber,
        formatCurrency,
        formatFileSize
    };
}
