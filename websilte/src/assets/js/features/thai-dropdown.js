/**
 * Thai Dropdown Date Picker (Senior-friendly)
 * แยกส่วนออกมาเพื่อใช้สำหรับหน้ากรอกข้อมูลที่ต้องการ 3-Dropdown (วัน/เดือน/ปี พ.ศ.)
 * โดยเฉพาะ เพื่อความง่ายสำหรับผู้สูงอายุและใช้งานบนมือถือ
 */
const ThaiDropdown = {
    MONTHS_TH: [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
        'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
        'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ],

    init: function (selectorOrElement, options = {}) {
        let input;
        if (typeof selectorOrElement === 'string') {
            input = document.querySelector(selectorOrElement);
        } else if (selectorOrElement instanceof HTMLElement) {
            input = selectorOrElement;
        }
        if (!input || input._thaiDropdownDone) return;
        input._thaiDropdownDone = true;

        const todayAD = new Date();
        const maxADNum = options.maxDate === 'today' ? todayAD.getFullYear() : (parseInt(options.maxDate) || todayAD.getFullYear());
        const minADNum = maxADNum - 120;
        const maxBENum = maxADNum + 543;
        const minBENum = minADNum + 543;

        let initDay = '', initMonth = '', initYear = '';
        if (input.value && /^\d{4}-\d{2}-\d{2}$/.test(input.value)) {
            const [y, m, d] = input.value.split('-');
            initDay = String(parseInt(d));
            initMonth = String(parseInt(m));
            initYear = String(parseInt(y) + 543);
        }

        // Wrapper ใช้ Grid จัดการ Layout ให้เป๊ะ
        const wrapper = document.createElement('div');
        wrapper.className = 'thai-date-picker-container';
        wrapper.style.cssText = `
            display: grid;
            grid-template-columns: 2fr 3.5fr 2.5fr;
            gap: 6px;
            width: 100%;
            margin-top: 4px;
        `;

        const createSelect = (placeholder, cls) => {
            const sel = document.createElement('select');
            sel.className = `form-select ${cls}`;
            sel.style.cssText = 'height: 44px !important; padding: 0 4px; font-size: 16px !important;';
            sel.innerHTML = `<option value="">${placeholder}</option>`;
            return sel;
        };

        const selDay = createSelect('วัน', 'thai-day');
        for (let d = 1; d <= 31; d++) {
            const opt = document.createElement('option');
            opt.value = d; opt.textContent = d;
            if (String(d) === initDay) opt.selected = true;
            selDay.appendChild(opt);
        }

        const selMonth = createSelect('เดือน', 'thai-month');
        this.MONTHS_TH.forEach((name, idx) => {
            const opt = document.createElement('option');
            opt.value = idx + 1; opt.textContent = name;
            if (String(idx + 1) === initMonth) opt.selected = true;
            selMonth.appendChild(opt);
        });

        const selYear = createSelect('ปี', 'thai-year');
        for (let be = maxBENum; be >= minBENum; be--) {
            const opt = document.createElement('option');
            opt.value = be; opt.textContent = be;
            if (String(be) === initYear) opt.selected = true;
            selYear.appendChild(opt);
        }

        const syncDays = () => {
            const m = parseInt(selMonth.value) || 0;
            const be = parseInt(selYear.value) || 0;
            const ad = be > 0 ? be - 543 : todayAD.getFullYear();
            const daysInMonth = m ? new Date(ad, m, 0).getDate() : 31;
            
            Array.from(selDay.options).forEach(opt => {
                if (!opt.value) return;
                const v = parseInt(opt.value);
                opt.disabled = v > daysInMonth;
                opt.style.display = v > daysInMonth ? 'none' : '';
            });
            if (parseInt(selDay.value) > daysInMonth) selDay.value = '';
        };

        const writeBack = () => {
            syncDays();
            const d = selDay.value;
            const m = selMonth.value;
            const be = selYear.value;
            if (d && m && be) {
                const ad = parseInt(be) - 543;
                const dateStr = `${ad}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                input.value = dateStr;
                if (options.onChange) options.onChange(dateStr);
            } else {
                input.value = '';
            }
        };

        selDay.addEventListener('change', writeBack);
        selMonth.addEventListener('change', writeBack);
        selYear.addEventListener('change', writeBack);

        wrapper.appendChild(selDay);
        wrapper.appendChild(selMonth);
        wrapper.appendChild(selYear);
        input.parentNode.insertBefore(wrapper, input.nextSibling);

        if (initDay) syncDays();
    }
};
