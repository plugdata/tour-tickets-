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
    init: async function (selectorOrElement, options = {}) {
        console.log('ThaiCalendar.init called with:', selectorOrElement);
        await this._loadFlatpickr();
        
        // Handle both selector string and DOM element
        let input;
        if (typeof selectorOrElement === 'string') {
            input = document.querySelector(selectorOrElement);
            if (!input) {
                console.error('ThaiCalendar: Element not found for selector:', selectorOrElement);
                return;
            }
        } else if (selectorOrElement instanceof HTMLElement) {
            input = selectorOrElement;
        } else {
            console.error('ThaiCalendar: Invalid parameter, expected selector string or HTMLElement');
            return;
        }
        
        console.log('ThaiCalendar: Element found, initializing flatpickr');

        const self = this;
        return flatpickr(input, {
            locale: 'th',
            dateFormat: options.enableTime ? 'Y-m-d H:i' : 'Y-m-d',
            altInput: true,
            altFormat: options.enableTime ? 'j F Y H:i' : 'j F Y',
            allowInput: true,
            disableMobile: true,

            onChange: (selectedDates, dateStr, ins) => {
                // setTimeout(0): รอให้ flatpickr อัปเดต altInput ตาม altFormat เสร็จก่อน
                // แล้วค่อย override ด้วยปี ค.ศ. ของเรา
                setTimeout(() => self._updateAltInput(ins), 0);
                if (options.onChange) options.onChange(dateStr, selectedDates, ins);
            },
            onValueUpdate: (sd, ds, ins) => {
                // Catch ทุก event ที่ flatpickr update ค่า (รวม manual input)
                setTimeout(() => self._updateAltInput(ins), 0);
            },
            onReady: (sd, ds, ins) => {
                self._patchYearInput(ins);
                setTimeout(() => self._updateAltInput(ins), 0);
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
                    console.log('ThaiCalendar: Year input value:', v, 'parsed:', n);
                    
                    // Handle Thai year conversion
                    if (n >= 2400 && n <= 2600) {
                        // Likely Thai BE year, convert to AD
                        _adYear = n - 543;
                        console.log('ThaiCalendar: Converting BE year', n, 'to AD year', _adYear);
                    } else if (n >= 1900 && n <= 2100) {
                        // Likely AD year, keep as is
                        _adYear = n;
                        console.log('ThaiCalendar: Keeping AD year', n);
                    } else {
                        // For other values, assume AD if <2500, BE if >=2500
                        _adYear = n >= 2500 ? n - 543 : n;
                        console.log('ThaiCalendar: Fallback conversion for year', n, 'to AD year', _adYear);
                    }
                    
                    const displayYear = _adYear + 543;
                    proto.set.call(yearInput, String(displayYear)); // Show BE in UI
                    console.log('ThaiCalendar: Displaying BE year', displayYear);
                }
            }
        });

        // Show current year as BE immediately
        proto.set.call(yearInput, String(_adYear + 543));
    },

    /**
     * Update the altInput display: วันที่ภาษาไทย + ปี ค.ศ. (AD)
     * เช่น "17 เมษายน 2026"  (ไม่ใช่ 2569)
     * ปฏิทิน popup header ยังคงแสดง พ.ศ. ตามปกติ ผ่าน _patchYearInput
     */
    _updateAltInput: function (ins) {
        if (!ins.altInput || !ins.selectedDates.length) return;
        const date    = ins.selectedDates[0];
        const day     = date.getDate();
        const month   = ins.l10n.months.longhand[date.getMonth()];
        const adYear  = date.getFullYear();          // ค.ศ. เสมอ เช่น 2026
        const timeStr = ins.config.enableTime
            ? ` ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} น.`
            : '';
        ins.altInput.value = `${day} ${month} ${adYear}${timeStr}`;
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
        console.log('ThaiCalendar._loadFlatpickr called');
        return new Promise((resolve) => {
            if (window.flatpickr && flatpickr.l10ns && flatpickr.l10ns.th) {
                console.log('ThaiCalendar: flatpickr and Thai locale already loaded');
                return resolve();
            }

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
                console.log('ThaiCalendar: Loading flatpickr core...');
                if (window.flatpickr) { 
                    console.log('ThaiCalendar: flatpickr core already loaded, loading locale');
                    this._loadLocale(resolve); 
                    return; 
                }
                const s = document.createElement('script');
                s.src    = 'https://cdn.jsdelivr.net/npm/flatpickr';
                s.onload = () => {
                    console.log('ThaiCalendar: flatpickr core loaded, loading locale');
                    this._loadLocale(resolve);
                };
                s.onerror = () => console.error('ThaiCalendar: Failed to load flatpickr core');
                document.head.appendChild(s);
            };
            loadCore();
        });
    },

    _loadLocale: function (callback) {
        console.log('ThaiCalendar._loadLocale called');
        if (flatpickr.l10ns && flatpickr.l10ns.th) {
            console.log('ThaiCalendar: Thai locale already loaded');
            return callback();
        }
        console.log('ThaiCalendar: Loading Thai locale...');
        const s  = document.createElement('script');
        s.src    = 'https://npmcdn.com/flatpickr/dist/l10n/th.js';
        s.onload = () => {
            console.log('ThaiCalendar: Thai locale loaded successfully');
            callback();
        };
        s.onerror = () => console.error('ThaiCalendar: Failed to load Thai locale');
        document.head.appendChild(s);
    },

    /**
     * Process birthdate from Thai calendar input to ISO format
     * @param {string} dateStr - Date string from input (YYYY-MM-DD)
     * @returns {string|null} ISO date string or null
     */
    processBirthdate: function(dateStr) {
        if (!dateStr) return null;
        
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return null;
            
            return date.toISOString();
        } catch (error) {
            console.error('Error processing birthdate:', error);
            return null;
        }
    }
};
