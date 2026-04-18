/**
 * Authentication Handler - Ticket Backoffice (JWT)
 */
class AuthManager {
    constructor() {
        this.storageKey = 'adminUser';
        this.tokenKey = 'adminToken';
    }

    isAuthenticated() { return !!this.getToken(); }

    getUser() {
        const u = localStorage.getItem(this.storageKey) || sessionStorage.getItem(this.storageKey);
        return u ? JSON.parse(u) : null;
    }

    getToken() {
        return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
    }

    saveAuth(user, token, remember = false) {
        const s = remember ? localStorage : sessionStorage;
        s.setItem(this.storageKey, JSON.stringify(user));
        s.setItem(this.tokenKey, token);
    }

    clearAuth() {
        ['adminUser', 'adminToken'].forEach(k => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
        });
    }

    async login(username, password, remember = false) {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                this.saveAuth(data.user, data.token, remember);
                return { success: true, user: data.user };
            }
            return { success: false, error: data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
        } catch (e) {
            return { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' };
        }
    }

    logout() {
        this.clearAuth();
        window.location.href = '/frontend/pages/login.html';
    }

    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/frontend/pages/login.html';
            return false;
        }
        return true;
    }

    hasRole(...roles) {
        const user = this.getUser();
        return user ? roles.includes(user.role) : false;
    }

    getRoleLabel(role) {
        return { ADMIN: 'ผู้ดูแลระบบ', STUFF: 'เจ้าหน้าที่', CUSTOMER: 'ลูกค้า' }[role] || role;
    }

    updateUserDisplay() {
        const user = this.getUser();
        const nameEl = document.getElementById('userName');
        const roleEl = document.getElementById('userRole');
        if (nameEl && user) nameEl.textContent = user.name || user.username;
        if (roleEl && user) roleEl.textContent = this.getRoleLabel(user.role);
    }
}

const authManager = new AuthManager();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, authManager };
}
