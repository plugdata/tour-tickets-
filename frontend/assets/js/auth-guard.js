/**
 * Authentication Guard - Frontend Protection
 * ป้องกันการเข้าถึงหน้าที่ต้องการ authentication
 */
class AuthGuard {
    constructor() {
        this.loginUrl = '/frontend/pages/login.html';
        this.publicPages = [
            '/frontend/pages/login.html',
            '/frontend/pages/login',
            '/frontend/',
            '/'
        ];
    }

    /**
     * ตรวจสอบว่า current page เป็น public page หรือไม่
     */
    isPublicPage() {
        const currentPath = window.location.pathname;
        return this.publicPages.some(page => 
            currentPath === page || 
            currentPath.startsWith(page) ||
            currentPath.includes('login.html')
        );
    }

    /**
     * ตรวจสอบ authentication token
     */
    isAuthenticated() {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        const user = localStorage.getItem('adminUser') || sessionStorage.getItem('adminUser');
        
        if (!token || !user) {
            return false;
        }

        try {
            // ตรวจสอบว่า token ยังไม่หมดอายุ (JWT)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            
            if (payload.exp < currentTime) {
                this.clearAuth();
                return false;
            }
            
            return true;
        } catch (error) {
            this.clearAuth();
            return false;
        }
    }

    /**
     * ล้างข้อมูล authentication
     */
    clearAuth() {
        ['adminUser', 'adminToken'].forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    }

    /**
     * Redirect ไปหน้า login
     */
    redirectToLogin(returnUrl = null) {
        const url = returnUrl || `${this.loginUrl}?return=${encodeURIComponent(window.location.href)}`;
        window.location.href = url;
    }

    /**
     * ตรวจสอบและป้องกันการเข้าถึง
     */
    protect() {
        // ถ้าเป็น public page ไม่ต้องทำอะไร
        if (this.isPublicPage()) {
            return;
        }

        // ถ้าไม่ได้ authenticate ให้ redirect ไป login
        if (!this.isAuthenticated()) {
            console.warn('🚫 Authentication required - Redirecting to login');
            this.redirectToLogin();
            return;
        }

        // ถ้า authenticate แล้ว แต่อยู่หน้า login ให้ redirect ไป dashboard
        if (this.isAuthenticated() && this.isPublicPage()) {
            const returnUrl = new URLSearchParams(window.location.search).get('return');
            window.location.href = returnUrl || '/frontend/pages/dashboard.html';
        }
    }

    /**
     * ตรวจสอบ user role
     */
    hasRole(requiredRole) {
        if (!this.isAuthenticated()) {
            return false;
        }

        try {
            const user = JSON.parse(
                localStorage.getItem('adminUser') || 
                sessionStorage.getItem('adminUser') || '{}'
            );
            return user.role === requiredRole;
        } catch (error) {
            return false;
        }
    }

    /**
     * ตรวจสอบว่าเป็น admin หรือไม่
     */
    isAdmin() {
        return this.hasRole('ADMIN');
    }

    /**
     * ตรวจสอบว่าเป็น staff หรือ admin หรือไม่
     */
    isStaffOrAdmin() {
        return this.hasRole('STAFF') || this.hasRole('ADMIN');
    }
}

// สร้าง global instance
const authGuard = new AuthGuard();

// Auto-protect เมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', () => {
    authGuard.protect();
});

// Export สำหรับใช้ใน script อื่น
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthGuard, authGuard };
}
