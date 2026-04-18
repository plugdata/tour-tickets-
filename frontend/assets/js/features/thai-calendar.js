/**
 * Thai Calendar & Date Filter Feature
 * Provides a Thai-localized date picker with Buddhist Era (พ.ศ.) display.
 * Internal values remain in AD for compatibility; only the display is converted.
 */
const ThaiCalendar = {
    /**
     * Initialize a Thai date picker with BE year display
     * @param {string} selector - CSS selector for the input
     * @param {Object} options   - Flatpickr options (onChange, enableTime, etc.)
     * @returns {Object}         - Flatpickr instance
     */
    init: async function (selector, options = {}) {
        await this._loadFlatpickr();
        const input = document.querySelector(selector);
        if (!input) return;

        const self = this;
        return flatpickr(input, {
            locale: 'th',
            dateFormat: options.enableTime ? 'Y-m-d H:i' : 'Y-m-d',
            altInput: true,
            altFormat: options.enableTime ? 'j F Y H:i' : 'j F Y',
            allowInput: true,
            disableMobile: true,

            onChange: (selectedDates, dateStr, ins) => {
                self._updateAltInput(ins);
                if (options.onChange) options.onChange(dateStr, selectedDates, ins);
            },
            onReady: (sd, ds, ins) => {
                self._patchYearInput(ins);
                self._updateAltInput(ins);
                if (options.onReady) options.onReady(sd, ds, ins);
            },
            onOpen: (sd, ds, ins) => {
                self._patchYearInput(ins);
            },
            onMonthChange: (sd, ds, ins) => {
                self._patchYearInput(ins);
            },
            onYearChange: (sd, ds, ins) => {
                self._patchYearInput(ins);
            },
            ...options
        });
    },

    /**
     * Patch the year <input> so flatpickr internally uses AD but displays BE (+543)
     * Uses Object.defineProperty to intercept get/set on the instance.
     */
    _patchYearInput: function (ins) {
        const yearInput = ins.currentYearElement;
        if (!yearInput || yearInput._bePatched) return;
        yearInput._bePatched = true;

        // Capture the prototype descriptor BEFORE overriding
        const proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        let _adYear = parseInt(proto.get.call(yearInput)) || new Date().getFullYear();

        Object.defineProperty(yearInput, 'value', {
            configurable: true,
            get: () => String(_adYear),          // Flatpickr reads AD → navigation stays correct
            set: (v) => {
                let n = parseInt(v);
                if (!isNaN(n)) {
                    // If someone types a BE year (≥2500), convert back to AD
                    _adYear = n >= 2500 ? n - 543 : n;
                    proto.set.call(yearInput, String(_adYear + 543)); // Show BE in UI
                }
            }
        });

        // Show current year as BE immediately
        proto.set.call(yearInput, String(_adYear + 543));
    },

    /**
     * Update the altInput display to show BE year and Thai month name
     */
    _updateAltInput: function (ins) {
        if (!ins.altInput || !ins.selectedDates.length) return;
        const date    = ins.selectedDates[0];
        const day     = date.getDate();
        const month   = ins.l10n.months.longhand[date.getMonth()];
        const beYear  = date.getFullYear() + 543;
        const timeStr = ins.config.enableTime
            ? ` ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} น.`
            : '';
        ins.altInput.value = `${day} ${month} ${beYear}${timeStr}`;
    },

    /**
     * Filter an array by a date range (inclusive)
     * @param {Array}  data       - Source array
     * @param {string} dateField  - Field name containing a parsable date
     * @param {string} startDate  - Start 'YYYY-MM-DD' (or empty to skip)
     * @param {string} endDate    - End   'YYYY-MM-DD' (or empty to skip)
     */
    filterByDateRange: function (data, dateField, startDate, endDate) {
        if (!startDate && !endDate) return data;
        const start = startDate ? new Date(startDate + 'T00:00:00') : null;
        const end   = endDate   ? new Date(endDate   + 'T23:59:59') : null;
        return data.filter(item => {
            const d = new Date(item[dateField]);
            if (start && d < start) return false;
            if (end   && d > end)   return false;
            return true;
        });
    },

    /**
     * Filter an array to a specific date
     * @param {Array}  data        - Source array
     * @param {string} dateField   - Field name
     * @param {string} targetDate  - 'YYYY-MM-DD'
     */
    filterByDate: function (data, dateField, targetDate) {
        if (!targetDate) return data;
        const target = new Date(targetDate).setHours(0, 0, 0, 0);
        return data.filter(item => new Date(item[dateField]).setHours(0, 0, 0, 0) === target);
    },

    // ─── Private helpers ─────────────────────────────────────────────────────

    _loadFlatpickr: function () {
        return new Promise((resolve) => {
            if (window.flatpickr && flatpickr.l10ns && flatpickr.l10ns.th) return resolve();

            if (!document.querySelector('link[href*="flatpickr"]')) {
                const link = document.createElement('link');
                link.rel  = 'stylesheet';
                link.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
                document.head.appendChild(link);

                const style = document.createElement('style');
                style.textContent = `
                    .flatpickr-calendar { font-family: 'Sarabun', sans-serif; }
                    .flatpickr-day.selected,
                    .flatpickr-day.selected:hover { background:#1cb8a0 !important; border-color:#1cb8a0 !important; }
                `;
                document.head.appendChild(style);
            }

            const loadCore = () => {
                if (window.flatpickr) { this._loadLocale(resolve); return; }
                const s = document.createElement('script');
                s.src    = 'https://cdn.jsdelivr.net/npm/flatpickr';
                s.onload = () => this._loadLocale(resolve);
                document.head.appendChild(s);
            };
            loadCore();
        });
    },

    _loadLocale: function (callback) {
        if (flatpickr.l10ns && flatpickr.l10ns.th) return callback();
        const s  = document.createElement('script');
        s.src    = 'https://npmcdn.com/flatpickr/dist/l10n/th.js';
        s.onload = callback;
        document.head.appendChild(s);
    }
};
