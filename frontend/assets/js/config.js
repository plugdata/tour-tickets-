/**
 * Ticket Backoffice - API Configuration
 */

const API_BASE_URL = '/api';

// Navigation menu
const NAV_MENU = [
    { type: 'header', label: 'หน้าหลัก' },
    { resource: null, label: 'แดชบอร์ด', icon: 'bi-speedometer2', path: '/frontend/pages/dashboard.html' },
    { type: 'header', label: 'จัดการทริป' },
    { resource: 'trips',      label: 'ทริปท่องเที่ยว',    icon: 'bi-map' },
    { resource: 'bus-rounds', label: 'รอบรถ / ตั๋ว',      icon: 'bi-bus-front' },
    { resource: 'addons',     label: 'อุปกรณ์เช่า/บริการ', icon: 'bi-bag-plus' },
    { type: 'header', label: 'การจองและการเงิน' },
    { resource: 'bookings',   label: 'การจอง',            icon: 'bi-ticket-detailed' },
    { resource: 'payments',   label: 'การชำระเงิน/สลิป',  icon: 'bi-credit-card' },
    { type: 'header', label: 'เนื้อหาเว็บ' },
    { resource: 'contents',   label: 'โพสต์ / FAQ / About', icon: 'bi-file-text' },
    { type: 'header', label: 'ประกันภัย' },
    { resource: 'insurance',  label: 'กรมธรรม์ประกันภัย',   icon: 'bi-shield-check' },
    { type: 'header', label: 'รายงาน' },
    { resource: 'expenses',   label: 'บันทึกค่าใช้จ่าย',  icon: 'bi-wallet2' },
    { resource: 'reports',    label: 'สรุปรายงาน',         icon: 'bi-bar-chart' },
    { type: 'header', label: 'ระบบ' },
    { resource: 'users',      label: 'ผู้ใช้งาน',          icon: 'bi-people' },
];

function getResourcePath(resourceName) {
    return resourceName.toLowerCase();
}

function getResourceFromPath(path) {
    const map = {
        'trips': 'trips', 'bus-rounds': 'bus-rounds', 'addons': 'addons',
        'bookings': 'bookings', 'payments': 'payments', 'contents': 'contents',
        'expenses': 'expenses', 'reports': 'reports', 'users': 'users'
    };
    return map[path] || null;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_BASE_URL, NAV_MENU, getResourcePath, getResourceFromPath };
}
