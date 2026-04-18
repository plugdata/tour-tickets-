/**
 * API Client - Ticket Backoffice
 */
class ApiClient {
    constructor() {
        this.base = API_BASE_URL;
    }

    headers(json = true) {
        const h = { 'Accept': 'application/json' };
        if (json) h['Content-Type'] = 'application/json';
        const token = authManager.getToken();
        if (token) h['Authorization'] = `Bearer ${token}`;
        return h;
    }

    async req(path, opts = {}) {
        try {
            const res = await fetch(`${this.base}${path}`, {
                headers: this.headers(!opts.formData),
                ...opts
            });
            if (res.status === 401) { authManager.logout(); throw new Error('Unauthorized'); }
            const text = await res.text();
            const data = text ? JSON.parse(text) : {};
            if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
            return data;
        } catch (e) {
            console.error('API Error:', e);
            throw e;
        }
    }

    get(path)             { return this.req(path); }
    post(path, body)      { return this.req(path, { method: 'POST', body: JSON.stringify(body) }); }
    put(path, body)       { return this.req(path, { method: 'PUT',  body: JSON.stringify(body) }); }
    patch(path, body)     { return this.req(path, { method: 'PATCH',body: JSON.stringify(body) }); }
    delete(path)          { return this.req(path, { method: 'DELETE' }); }

    // FormData (for file uploads)
    postForm(path, fd) {
        return this.req(path, { method: 'POST', body: fd, formData: true,
            headers: { Authorization: `Bearer ${authManager.getToken()}` } });
    }
}

const api = new ApiClient();

// ====== Resource helpers ======
const API = {
    // Auth
    login: (u, p) => api.post('/auth/login', { username: u, password: p }),

    // Users
    users: {
        list: ()        => api.get('/users'),
        update: (id, d) => api.put(`/users/${id}`, d),
        delete: (id)    => api.delete(`/users/${id}`),
        register: (d)   => api.post('/auth/register', d),
    },

    // Trips
    trips: {
        list: (q = {})  => api.get('/trips' + (Object.keys(q).length ? '?' + new URLSearchParams(q) : '')),
        get: (id)       => api.get(`/trips/${id}`),
        create: (d)     => api.post('/trips', d),
        update: (id, d) => api.put(`/trips/${id}`, d),
        delete: (id)    => api.delete(`/trips/${id}`),
    },

    // BusRounds
    busRounds: {
        list: ()          => api.get('/bus-rounds'),
        byTrip: (tid)     => api.get(`/bus-rounds/trip/${tid}`),
        create: (d)       => api.post('/bus-rounds', d),
        update: (id, d)   => api.put(`/bus-rounds/${id}`, d),
        toggle: (id)      => api.patch(`/bus-rounds/${id}/toggle`, {}),
    },

    // Bookings
    bookings: {
        list: ()                      => api.get('/bookings'),
        get: (id)                     => api.get(`/bookings/${id}`),
        byRound: (roundId)            => api.get(`/bookings/round/${roundId}`),
        my: ()                        => api.get('/bookings/my'),
        create: (d)                   => api.post('/bookings', d),
        updateStatus: (id, s, reason) => api.patch(`/bookings/${id}/status`, { status: s, cancelReason: reason }),
    },

    // Payments
    payments: {
        list: ()               => api.get('/payments'),
        submit: (d)            => api.post('/payments', d),
        confirm: (id, status)  => api.patch(`/payments/${id}/confirm`, { status }),
    },

    // Addons
    addons: {
        list: ()        => api.get('/addons'),
        active: ()      => api.get('/addons/active'),
        byTrip: (tid)   => api.get(`/addons/trip/${tid}`),
        create: (d)     => api.post('/addons', d),
        update: (id, d) => api.put(`/addons/${id}`, d),
        delete: (id)    => api.delete(`/addons/${id}`),
    },

    // Contents
    contents: {
        list: (type)    => api.get(`/contents${type ? '?type=' + type : ''}`),
        create: (d)     => api.post('/contents', d),
        update: (id, d) => api.put(`/contents/${id}`, d),
        delete: (id)    => api.delete(`/contents/${id}`),
    },

    // Expenses
    expenses: {
        list: ()    => api.get('/expenses'),
        create: (d) => api.post('/expenses', d),
        delete: (id) => api.delete(`/expenses/${id}`),
    },

    // Reports
    reports: {
        summary: (q = {}) => api.get('/reports/summary' + (Object.keys(q).length ? '?' + new URLSearchParams(q) : '')),
        monthly: ()       => api.get('/reports/monthly'),
        print: (roundId)  => api.get(`/reports/print/${roundId}`),
    },

    // Seat Bookings (real-time seat status)
    seatBookings: {
        byRound: (roundId)                   => api.get(`/seat-bookings/round/${roundId}`),
        hold: (busRoundId, seatNumbers, token, gender) =>
            api.post('/seat-bookings/hold', { busRoundId, seatNumbers, sessionToken: token, gender }),
        releaseHold: (token)                 => api.delete(`/seat-bookings/hold/${token}`),
    },

    // Booking Sessions (serial token / flow tracking)
    sessions: {
        create: (data)   => api.post('/booking-sessions', data),
        update: (data)   => api.post('/booking-sessions', data),
        get: (token)     => api.get(`/booking-sessions/${token}`),
    },

    // Insurance
    insurance: {
        list: ()            => api.get('/insurance'),
        get: (id)           => api.get(`/insurance/${id}`),
        getByBooking: (bid) => api.get(`/insurance/booking/${bid}`),
        create: (d)         => api.post('/insurance', d),
        submit: (d)         => api.post('/insurance', d),
        submitDraft: (id)   => api.patch(`/insurance/${id}/submit`, {}),
        update: (id, d)     => api.put(`/insurance/${id}`, d),
        review: (id, d)     => api.patch(`/insurance/${id}/review`, d),
        policyContent: {
            get: ()    => api.get('/insurance/policy-content'),
            update: (d) => api.put('/insurance/policy-content', d),
        },
        conditions: {
            list: (all = false) => api.get('/insurance/conditions' + (all ? '?all=1' : '')),
            create: (d)         => api.post('/insurance/conditions', d),
            update: (id, d)     => api.put(`/insurance/conditions/${id}`, d),
            toggle: (id)        => api.patch(`/insurance/conditions/${id}/toggle`, {}),
            remove: (id)        => api.delete(`/insurance/conditions/${id}`),
        },
    },

    // Uploads
    uploads: {
        upload: (file) => {
            const fd = new FormData();
            fd.append('file', file);
            return api.postForm('/uploads', fd);
        },
        list: () => api.get('/uploads'),
        remove: (url) => api.delete(`/uploads?url=${encodeURIComponent(url)}`),
    },
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient, api, API };
}
