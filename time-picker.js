/**
 * time-picker.js
 * Modern, touch-friendly time picker bottom sheet
 */

(function () {
    'use strict';

    let currentHour = '12';
    let currentMinute = '00';
    let currentAmpm = 'PM';

    // DOM Refs
    let sheet, backdrop, closeBtn, triggerBtn, displaySpan, hiddenInput, confirmBtn;
    let hourGrid, minuteGrid;
    let amBtn, pmBtn;

    const HOURS = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
    const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

    function openSheet() {
        renderGrids();
        sheet.classList.add('active');
        triggerBtn.classList.add('open');
        
        // Scroll selected items into view
        requestAnimationFrame(() => {
            const hSel = hourGrid.querySelector('.selected');
            if (hSel) hSel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            const mSel = minuteGrid.querySelector('.selected');
            if (mSel) mSel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
    }

    function closeSheet() {
        sheet.classList.remove('active');
        triggerBtn.classList.remove('open');
    }

    function renderGrids() {
        hourGrid.innerHTML = '';
        minuteGrid.innerHTML = '';

        HOURS.forEach(h => {
            const item = document.createElement('div');
            item.className = 'time-grid-item' + (currentHour === h ? ' selected' : '');
            item.textContent = h;
            item.addEventListener('click', () => {
                currentHour = h;
                renderGrids();
            });
            hourGrid.appendChild(item);
        });

        MINUTES.forEach(m => {
            const item = document.createElement('div');
            item.className = 'time-grid-item' + (currentMinute === m ? ' selected' : '');
            item.textContent = m;
            item.addEventListener('click', () => {
                currentMinute = m;
                renderGrids();
            });
            minuteGrid.appendChild(item);
        });

        if (currentAmpm === 'AM') {
            amBtn.classList.add('selected');
            pmBtn.classList.remove('selected');
        } else {
            amBtn.classList.remove('selected');
            pmBtn.classList.add('selected');
        }
    }

    function updateTimeValue() {
        // Update display
        displaySpan.textContent = `${currentHour}:${currentMinute} ${currentAmpm}`;
        
        // Update hidden 24h input
        let h24 = parseInt(currentHour, 10) % 12;
        if (currentAmpm === 'PM') h24 += 12;
        hiddenInput.value = String(h24).padStart(2, '0') + ':' + currentMinute;
    }

    function confirmTime() {
        updateTimeValue();
        closeSheet();
    }

    function setPickerValue(time24) {
        if (!time24) return;
        const parts = time24.split(':');
        let h = parseInt(parts[0], 10);
        const m = parts[1] || '00';
        
        currentAmpm = h >= 12 ? 'PM' : 'AM';
        
        let h12 = h % 12;
        if (h12 === 0) h12 = 12;
        currentHour = String(h12).padStart(2, '0');
        
        // Nearest 5-minute
        const nearest = Math.round(parseInt(m, 10) / 5) * 5;
        currentMinute = String(Math.min(nearest, 55)).padStart(2, '0');
        
        updateTimeValue();
    }

    // Expose API
    window.timePicker = {
        setValue: setPickerValue,
        getValue: () => hiddenInput ? hiddenInput.value : ''
    };

    document.addEventListener('DOMContentLoaded', () => {
        sheet = document.getElementById('time-picker-sheet');
        backdrop = document.getElementById('time-sheet-backdrop');
        closeBtn = document.getElementById('time-sheet-close');
        triggerBtn = document.getElementById('time-picker-trigger');
        displaySpan = document.getElementById('time-picker-display');
        hiddenInput = document.getElementById('tx-time');
        confirmBtn = document.getElementById('time-confirm-btn');
        hourGrid = document.getElementById('time-grid-hour');
        minuteGrid = document.getElementById('time-grid-minute');
        amBtn = document.querySelector('.time-ampm-btn[data-value="AM"]');
        pmBtn = document.querySelector('.time-ampm-btn[data-value="PM"]');

        if (!sheet || !triggerBtn || !hiddenInput) return;

        triggerBtn.addEventListener('click', openSheet);
        closeBtn.addEventListener('click', closeSheet);
        backdrop.addEventListener('click', closeSheet);
        confirmBtn.addEventListener('click', confirmTime);

        amBtn.addEventListener('click', () => {
            currentAmpm = 'AM';
            amBtn.classList.add('selected');
            pmBtn.classList.remove('selected');
        });

        pmBtn.addEventListener('click', () => {
            currentAmpm = 'PM';
            pmBtn.classList.add('selected');
            amBtn.classList.remove('selected');
        });
        
        // Initialize with default
        updateTimeValue();
    });
})();
