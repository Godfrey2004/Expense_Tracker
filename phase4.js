// ============================================================
//  Phase 4 – Calendar, Budget & Reports
//  Loaded AFTER db.js and app.js
// ============================================================

// ─── Utilities ──────────────────────────────────────────────
const fmt = (v) => window.formatCurrency(v);
const todayStr = () => new Date().toISOString().split('T')[0];

// ─── Budget Storage (localStorage key: 'ef_budgets') ────────
function loadBudgets() {
    try { return JSON.parse(localStorage.getItem('ef_budgets') || '{}'); }
    catch { return {}; }
}
function saveBudgets(obj) {
    localStorage.setItem('ef_budgets', JSON.stringify(obj));
}

// ─── Share expense data from app.js (polling) ───────────────
function getExpenses() {
    return window.currentExpenses || [];
}

// ==============================================================
// 1. CALENDAR
// ==============================================================
let calViewDate = new Date();
let calSelectedDate = null;

function initCalendar() {
    document.getElementById('cal-prev')?.addEventListener('click', () => {
        calViewDate.setMonth(calViewDate.getMonth() - 1);
        renderCalendar();
    });
    document.getElementById('cal-next')?.addEventListener('click', () => {
        calViewDate.setMonth(calViewDate.getMonth() + 1);
        renderCalendar();
    });
}

function renderCalendar() {
    const grid     = document.getElementById('cal-grid');
    const label    = document.getElementById('cal-month-label');
    if (!grid || !label) return;

    const expenses = getExpenses();
    const year     = calViewDate.getFullYear();
    const month    = calViewDate.getMonth();
    const today    = new Date();

    label.textContent = calViewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();   // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build a Set of dates that have transactions in this month
    const txDates = new Set(
        expenses
            .filter(tx => {
                const d = new Date(tx.date);
                return d.getFullYear() === year && d.getMonth() === month;
            })
            .map(tx => tx.date)
    );

    grid.innerHTML = '';

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement('div');
        blank.className = 'cal-day empty';
        grid.appendChild(blank);
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const cell = document.createElement('div');
        cell.className = 'cal-day';
        cell.textContent = d;

        const isToday = (today.getFullYear() === year && today.getMonth() === month && today.getDate() === d);
        if (isToday) cell.classList.add('today');
        if (txDates.has(dateStr)) cell.classList.add('has-tx');
        if (calSelectedDate === dateStr) cell.classList.add('selected');

        cell.addEventListener('click', () => {
            calSelectedDate = dateStr;
            renderCalendar();  // Re-render to update selected highlight
            showDayTransactions(dateStr);
        });

        grid.appendChild(cell);
    }
}

function showDayTransactions(dateStr) {
    const panel = document.getElementById('cal-day-panel');
    const list  = document.getElementById('cal-day-list');
    const title = document.getElementById('cal-day-title');
    const total = document.getElementById('cal-day-total');
    if (!panel || !list) return;

    const dayTx = getExpenses().filter(tx => tx.date === dateStr);
    const d = new Date(dateStr + 'T00:00:00');
    title.textContent = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

    const dayExpenses = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const dayIncome   = dayTx.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
    total.textContent = dayTx.length === 0 ? '' : `${fmt(dayExpenses)} spent`;

    panel.style.display = 'block';

    if (dayTx.length === 0) {
        list.innerHTML = `<p style="text-align:center; color: var(--text-secondary); padding: 20px 0;">No transactions on this day.</p>`;
        return;
    }

    list.innerHTML = '';
    dayTx.sort((a, b) => a.time.localeCompare(b.time)).forEach(tx => {
        const isIncome = tx.type === 'income';
        const iconMatch = tx.category.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\S+)\s*(.*)/);
        const icon = iconMatch ? iconMatch[1] : '💰';
        const catName = iconMatch ? (iconMatch[2] || tx.category) : tx.category;
        const el = document.createElement('div');
        el.className = 'transaction-item glass-item';
        el.innerHTML = `
            <div class="tx-icon" style="background: ${isIncome ? 'rgba(48,209,88,0.15)' : 'rgba(255,69,58,0.15)'}; color: ${isIncome ? '#30D158' : '#FF453A'}; font-size: 22px;">${icon}</div>
            <div class="tx-details"><h4>${catName}</h4><p>${tx.time} · ${tx.paymentMethod || ''}</p></div>
            <div class="tx-amount ${isIncome ? 'positive' : 'negative'}">${isIncome ? '+' : '-'}${fmt(tx.amount)}</div>
        `;
        list.appendChild(el);
    });
}

// ==============================================================
// 2. BUDGET
// ==============================================================
function initBudget() {
    document.getElementById('add-budget-btn')?.addEventListener('click', () => {
        document.getElementById('budget-edit-key').value = '';
        document.getElementById('budget-modal-title').textContent = 'Set Budget';
        document.getElementById('budget-limit-input').value = '';
        document.getElementById('budget-modal').classList.add('active');
    });

    document.getElementById('save-budget-btn')?.addEventListener('click', () => {
        const key   = document.getElementById('budget-cat-select').value;
        const limit = parseFloat(document.getElementById('budget-limit-input').value);
        if (!key || isNaN(limit) || limit <= 0) return;

        const budgets = loadBudgets();
        budgets[key] = limit;
        saveBudgets(budgets);
        document.getElementById('budget-modal').classList.remove('active');
        renderBudget();
    });
}

function renderBudget() {
    const budgets     = loadBudgets();
    const expenses    = getExpenses().filter(t => t.type === 'expense');
    const now         = new Date();
    const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter month expenses
    const monthExp = expenses.filter(t => new Date(t.date) >= monthStart);

    // Build category totals
    const catTotals = {};
    monthExp.forEach(tx => {
        catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount;
    });

    const allCats = new Set([...Object.keys(budgets), ...Object.keys(catTotals)]);
    let totalBudget = 0, totalSpent = 0;

    Object.keys(budgets).forEach(k => { totalBudget += budgets[k]; });
    Object.keys(catTotals).forEach(k => { totalSpent += catTotals[k]; });

    // Update summary card
    const setEl = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    setEl('budget-total-spent', fmt(totalSpent));
    setEl('budget-total-limit', fmt(totalBudget));
    setEl('budget-total-remaining', fmt(Math.max(0, totalBudget - totalSpent)));

    const overallPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
    const pctEl = document.getElementById('budget-overall-pct');
    const barEl = document.getElementById('budget-overall-bar');
    if (pctEl) pctEl.textContent = `${overallPct.toFixed(1)}%`;
    if (barEl) {
        barEl.style.background = overallPct >= 100 ? '#FF453A' : overallPct >= 75 ? '#FF9F0A' : 'var(--accent-gradient)';
        setTimeout(() => { barEl.style.width = overallPct + '%'; }, 100);
    }

    // Render per-category list
    const listEl = document.getElementById('budget-categories-list');
    if (!listEl) return;

    if (allCats.size === 0) {
        listEl.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">No budgets set. Tap "Add" to set one.</p>`;
        return;
    }

    listEl.innerHTML = '';
    allCats.forEach(cat => {
        const limit = budgets[cat] || 0;
        const spent = catTotals[cat] || 0;
        const rem   = limit - spent;
        const pct   = limit > 0 ? Math.min((spent / limit) * 100, 100) : (spent > 0 ? 100 : 0);

        const iconMatch = cat.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\S+)\s*(.*)/);
        const icon = iconMatch ? iconMatch[1] : '💰';
        const name = iconMatch ? (iconMatch[2] || cat) : cat;

        const warningClass = pct >= 100 ? 'danger' : pct >= 75 ? 'warning' : '';
        const badgeHtml = warningClass === 'danger' ? `<span class="budget-warning-badge danger">Over Budget!</span>`
            : warningClass === 'warning' ? `<span class="budget-warning-badge">⚠ Near Limit</span>` : '';

        const barColor = pct >= 100 ? '#FF453A' : pct >= 75 ? '#FF9F0A' : 'var(--accent-color)';
        const hasLimit = limit > 0;

        const card = document.createElement('div');
        card.className = 'budget-cat-card';
        card.innerHTML = `
            <div class="budget-cat-header">
                <span class="budget-cat-name">${icon} ${name} ${badgeHtml}</span>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="budget-cat-amounts">
                        <span class="spent">${fmt(spent)}</span>
                        ${hasLimit ? `<span class="limit"> / ${fmt(limit)}</span>` : ''}
                    </span>
                    ${hasLimit ? `<button class="budget-edit-btn" data-cat="${cat}" aria-label="Edit budget"><span class="material-symbols-rounded" style="font-size:18px;">edit</span></button>` : ''}
                </div>
            </div>
            ${hasLimit ? `
            <div class="progress-bar" style="height: 7px;">
                <div style="width: 0%; height: 100%; border-radius: 99px; background: ${barColor}; transition: width 0.8s ease;" data-target="${pct}%"></div>
            </div>
            <p class="budget-cat-remaining ${warningClass}">
                ${pct >= 100 ? `Overspent by ${fmt(Math.abs(rem))}` : `${fmt(rem)} remaining`}
            </p>` : `<p class="budget-cat-remaining">No limit set — ${fmt(spent)} spent this month</p>`}
        `;

        // Animate bar
        setTimeout(() => {
            const fill = card.querySelector('[data-target]');
            if (fill) fill.style.width = fill.getAttribute('data-target');
        }, 100);

        // Edit button
        card.querySelector('.budget-edit-btn')?.addEventListener('click', () => {
            document.getElementById('budget-edit-key').value = cat;
            document.getElementById('budget-cat-select').value = cat;
            document.getElementById('budget-limit-input').value = limit;
            document.getElementById('budget-modal-title').textContent = 'Edit Budget';
            document.getElementById('budget-modal').classList.add('active');
        });

        listEl.appendChild(card);
    });
}

// ==============================================================
// 3. REPORTS
// ==============================================================
let reportPeriod = 'today';
let reportCustomFrom = null;
let reportCustomTo   = null;

function initReports() {
    // Period tabs
    document.querySelectorAll('.period-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.period-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            reportPeriod = btn.getAttribute('data-period');

            const picker = document.getElementById('custom-range-picker');
            if (picker) picker.style.display = reportPeriod === 'custom' ? 'block' : 'none';
            if (reportPeriod !== 'custom') renderReport();
        });
    });

    document.getElementById('apply-custom-range')?.addEventListener('click', () => {
        reportCustomFrom = document.getElementById('report-from').value;
        reportCustomTo   = document.getElementById('report-to').value;
        if (reportCustomFrom && reportCustomTo) renderReport();
    });

    document.getElementById('export-csv-btn')?.addEventListener('click', exportCSV);
    document.getElementById('export-json-btn')?.addEventListener('click', exportJSON);
}

function getReportRange() {
    const now   = new Date();
    const start = new Date();
    switch (reportPeriod) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            return { from: start, to: now };
        case 'week':
            start.setDate(now.getDate() - now.getDay());
            start.setHours(0, 0, 0, 0);
            return { from: start, to: now };
        case 'month':
            return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
        case 'year':
            return { from: new Date(now.getFullYear(), 0, 1), to: now };
        case 'custom':
            return {
                from: reportCustomFrom ? new Date(reportCustomFrom + 'T00:00:00') : new Date(0),
                to:   reportCustomTo   ? new Date(reportCustomTo   + 'T23:59:59') : now
            };
    }
    return { from: new Date(0), to: now };
}

let reportFilteredTx = [];

function renderReport() {
    const { from, to } = getReportRange();
    const expenses = getExpenses();

    reportFilteredTx = expenses.filter(tx => {
        const d = new Date(tx.date + 'T' + (tx.time || '00:00'));
        return d >= from && d <= to;
    }).sort((a, b) => b.timestamp - a.timestamp);

    const income   = reportFilteredTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense  = reportFilteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const setEl = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    setEl('rep-income',   fmt(income));
    setEl('rep-expenses', fmt(expense));
    setEl('rep-count',    reportFilteredTx.length);
    setEl('rep-net',      (income - expense >= 0 ? '+' : '-') + fmt(income - expense));

    const netEl = document.getElementById('rep-net');
    if (netEl) netEl.style.color = income - expense >= 0 ? '#30D158' : '#FF453A';

    // Period label
    const periodLabels = { today: 'Today', week: 'This Week', month: 'This Month', year: 'This Year', custom: 'Custom Range' };
    const titleEl = document.getElementById('report-list-title');
    if (titleEl) titleEl.textContent = `${periodLabels[reportPeriod]} Transactions (${reportFilteredTx.length})`;

    // Render transaction list
    const listEl = document.getElementById('report-tx-list');
    if (!listEl) return;

    if (reportFilteredTx.length === 0) {
        listEl.innerHTML = `<p style="text-align:center; color: var(--text-secondary); padding: 20px 0;">No transactions in this period.</p>`;
        return;
    }

    listEl.innerHTML = '';
    reportFilteredTx.forEach(tx => {
        const isIncome = tx.type === 'income';
        const iconMatch = tx.category.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\S+)\s*(.*)/);
        const icon = iconMatch ? iconMatch[1] : '💰';
        const name = iconMatch ? (iconMatch[2] || tx.category) : tx.category;
        const el = document.createElement('div');
        el.className = 'transaction-item glass-item';
        el.innerHTML = `
            <div class="tx-icon" style="background: ${isIncome ? 'rgba(48,209,88,0.15)' : 'rgba(255,69,58,0.15)'}; color: ${isIncome ? '#30D158' : '#FF453A'}; font-size: 22px;">${icon}</div>
            <div class="tx-details">
                <h4>${name}</h4>
                <p style="font-size:11px;">${tx.date} · ${tx.paymentMethod || ''}</p>
            </div>
            <div class="tx-amount ${isIncome ? 'positive' : 'negative'}">${isIncome ? '+' : '-'}${fmt(tx.amount)}</div>
        `;
        listEl.appendChild(el);
    });
}

// ─── Export CSV ──────────────────────────────────────────────
function exportCSV() {
    if (reportFilteredTx.length === 0) { window.showAlert?.('No data to export.', 'Export Failed'); return; }
    const headers = ['Date', 'Time', 'Type', 'Category', 'Amount', 'Payment Method', 'Wallet', 'Tags', 'Notes'];
    const rows = reportFilteredTx.map(tx => [
        tx.date, tx.time, tx.type, tx.category, tx.amount,
        tx.paymentMethod || '', tx.wallet || '',
        (tx.tags || []).join(' | '), (tx.notes || '').replace(/,/g, ';')
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    downloadFile(`ExpenseFlow_${reportPeriod}_${todayStr()}.csv`, 'text/csv', csvContent);
}

// ─── Export JSON ─────────────────────────────────────────────
function exportJSON() {
    if (reportFilteredTx.length === 0) { window.showAlert?.('No data to export.', 'Export Failed'); return; }
    const data = {
        exportedAt: new Date().toISOString(),
        period: reportPeriod,
        count: reportFilteredTx.length,
        transactions: reportFilteredTx
    };
    downloadFile(`ExpenseFlow_${reportPeriod}_${todayStr()}.json`, 'application/json', JSON.stringify(data, null, 2));
}

function downloadFile(filename, type, content) {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ==============================================================
// 4. HOOK INTO VIEW SWITCHING
// ==============================================================
document.addEventListener('DOMContentLoaded', () => {
    initCalendar();
    initBudget();
    initReports();

    // Intercept navigation clicks to refresh calendar/budget/report
    document.querySelectorAll('.nav-item, .drawer-item').forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            setTimeout(() => {
                if (target === 'calendar-view') renderCalendar();
                if (target === 'budget-view')   renderBudget();
                if (target === 'reports-view')  renderReport();
            }, 80);
        });
    });

    // Also re-render when DB data changes (poll every 2s for simplicity)
    setInterval(() => {
        const budgetView   = document.getElementById('budget-view');
        const reportsView  = document.getElementById('reports-view');
        const calendarView = document.getElementById('calendar-view');
        if (budgetView?.classList.contains('active'))   renderBudget();
        if (reportsView?.classList.contains('active'))  renderReport();
        if (calendarView?.classList.contains('active')) renderCalendar();
    }, 2000);
});
