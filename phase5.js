// ============================================================
//  Phase 5 – Settings & Polish
//  Loaded AFTER app.js and phase4.js
// ============================================================

// ─── Global State & Utilities ─────────────────────────────
const currencyMap = {
    'INR': { symbol: '₹', locale: 'en-IN' },
    'USD': { symbol: '$', locale: 'en-US' },
    'EUR': { symbol: '€', locale: 'de-DE' },
    'GBP': { symbol: '£', locale: 'en-GB' }
};

let currentCurrency = localStorage.getItem('ef_currency') || 'INR';

// Global formatter (to be used across app.js and phase4.js)
window.formatCurrency = function(amount, skipDecimals = false) {
    const config = currencyMap[currentCurrency] || currencyMap['INR'];
    const opts = { 
        minimumFractionDigits: skipDecimals ? 0 : 2,
        maximumFractionDigits: skipDecimals ? 0 : 2 
    };
    return `${config.symbol}${Math.abs(amount).toLocaleString(config.locale, opts)}`;
};

// ─── Toast Notifications ──────────────────────────────────
window.showToast = function(message, type = 'info') {
    const toast = document.getElementById('toast-container');
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    
    if (!toast) return;

    msgEl.textContent = message;
    
    // Set colors/icons based on type
    if (type === 'success') {
        iconEl.textContent = 'check_circle';
        iconEl.style.color = '#30D158';
    } else if (type === 'error') {
        iconEl.textContent = 'error';
        iconEl.style.color = '#FF453A';
    } else if (type === 'warning') {
        iconEl.textContent = 'warning';
        iconEl.style.color = '#FF9F0A';
    } else {
        iconEl.textContent = 'info';
        iconEl.style.color = 'var(--accent-color)';
    }

    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    // Hide after 3 seconds
    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(100px)';
    }, 3000);
}

// ─── Custom Modal Dialogs (Alert / Confirm / Prompt) ──────
window.showConfirm = function(message, title = "Confirm Action") {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-dialog-modal');
        const titleEl = document.getElementById('custom-dialog-title');
        const msgEl = document.getElementById('custom-dialog-message');
        const cancelBtn = document.getElementById('custom-dialog-cancel-btn');
        const confirmBtn = document.getElementById('custom-dialog-confirm-btn');
        const inputContainer = document.getElementById('custom-dialog-input-container');

        if (!modal) {
            resolve(confirm(message));
            return;
        }

        titleEl.textContent = title;
        msgEl.textContent = message;
        inputContainer.style.display = 'none';
        cancelBtn.style.display = 'block';

        modal.classList.add('active');

        function cleanup(result) {
            modal.classList.remove('active');
            confirmBtn.onclick = null;
            cancelBtn.onclick = null;
            resolve(result);
        }

        confirmBtn.onclick = () => cleanup(true);
        cancelBtn.onclick = () => cleanup(false);
    });
};

window.showAlert = function(message, title = "Alert") {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-dialog-modal');
        const titleEl = document.getElementById('custom-dialog-title');
        const msgEl = document.getElementById('custom-dialog-message');
        const cancelBtn = document.getElementById('custom-dialog-cancel-btn');
        const confirmBtn = document.getElementById('custom-dialog-confirm-btn');
        const inputContainer = document.getElementById('custom-dialog-input-container');

        if (!modal) {
            alert(message);
            resolve();
            return;
        }

        titleEl.textContent = title;
        msgEl.textContent = message;
        inputContainer.style.display = 'none';
        cancelBtn.style.display = 'none';

        modal.classList.add('active');

        confirmBtn.onclick = () => {
            modal.classList.remove('active');
            confirmBtn.onclick = null;
            resolve();
        };
    });
};

window.showPrompt = function(message, defaultValue = "", title = "Prompt") {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-dialog-modal');
        const titleEl = document.getElementById('custom-dialog-title');
        const msgEl = document.getElementById('custom-dialog-message');
        const cancelBtn = document.getElementById('custom-dialog-cancel-btn');
        const confirmBtn = document.getElementById('custom-dialog-confirm-btn');
        const inputContainer = document.getElementById('custom-dialog-input-container');
        const inputEl = document.getElementById('custom-dialog-input');

        if (!modal) {
            resolve(prompt(message, defaultValue));
            return;
        }

        titleEl.textContent = title;
        msgEl.textContent = message;
        inputContainer.style.display = 'block';
        inputEl.value = defaultValue;
        cancelBtn.style.display = 'block';

        modal.classList.add('active');

        function cleanup(result) {
            modal.classList.remove('active');
            confirmBtn.onclick = null;
            cancelBtn.onclick = null;
            resolve(result);
        }

        confirmBtn.onclick = () => cleanup(inputEl.value);
        cancelBtn.onclick = () => cleanup(null);
    });
};

// ─── Settings UI Logic ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Theme Toggle (Settings page)
    const themeItem = document.getElementById('setting-theme');
    const themeStatus = document.getElementById('theme-status-text');
    
    function updateThemeStatus() {
        const t = document.documentElement.getAttribute('data-theme');
        if (themeStatus) themeStatus.textContent = t === 'dark' ? 'Dark Mode' : 'Light Mode';
    }
    
    updateThemeStatus(); // initial call
    
    if (themeItem) {
        themeItem.addEventListener('click', () => {
            // Trigger the existing top-bar theme toggle button
            document.getElementById('theme-toggle')?.click();
            updateThemeStatus();
        });
    }

    // 2. Currency Selection
    const currSelect = document.getElementById('currency-select');
    
    function updateDynamicCurrencyTexts() {
        const config = currencyMap[currentCurrency] || currencyMap['INR'];
        const amountInput = document.getElementById('tx-amount');
        if (amountInput) amountInput.placeholder = `${config.symbol}0.00`;
        
        const budgetLabels = document.querySelectorAll('#budget-modal label');
        budgetLabels.forEach(lbl => {
            if (lbl.textContent.includes('Monthly Limit')) {
                lbl.textContent = `Monthly Limit (${config.symbol})`;
            }
        });
    }

    updateDynamicCurrencyTexts(); // initial call
    
    if (currSelect) {
        currSelect.value = currentCurrency;
        currSelect.addEventListener('change', (e) => {
            currentCurrency = e.target.value;
            localStorage.setItem('ef_currency', currentCurrency);
            showToast(`Currency changed to ${currentCurrency}`, 'success');
            updateDynamicCurrencyTexts();
            // Force re-render of views if visible
            if (typeof loadAndRenderTransactions === 'function') {
                loadAndRenderTransactions(); 
            }
        });
    }

    // 3. Backup Data
    document.getElementById('setting-backup')?.addEventListener('click', async () => {
        try {
            if (!expenseDB) throw new Error("DB not loaded");
            const expenses = await expenseDB.getAllExpenses();
            const profileName = localStorage.getItem('profileName') || 'User';
            const budgets = localStorage.getItem('ef_budgets') || '{}';
            const wallets = localStorage.getItem('ef_wallets') || '["Main Wallet", "Savings", "Business"]';
            
            const backupData = {
                timestamp: new Date().toISOString(),
                appVersion: '2.0.0',
                expenses: expenses,
                settings: {
                    profileName,
                    budgets: JSON.parse(budgets),
                    wallets: JSON.parse(wallets),
                    themeAccent: localStorage.getItem('theme-accent') || 'zinc',
                    theme: localStorage.getItem('theme'),
                    currency: currentCurrency
                }
            };
            
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; 
            a.download = `ExpenseFlow_Backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('Backup downloaded successfully', 'success');
        } catch (e) {
            console.error(e);
            showToast('Failed to create backup', 'error');
        }
    });

    // 4. Restore Data
    const restoreInput = document.getElementById('restore-file-input');
    document.getElementById('setting-restore')?.addEventListener('click', () => {
        restoreInput?.click();
    });

    restoreInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (!data.expenses) throw new Error("Invalid backup format");
                
                const proceed = await showConfirm("This will overwrite your current data. Proceed?", "Restore Backup");
                if (!proceed) {
                    restoreInput.value = '';
                    return;
                }

                showToast('Restoring data...', 'info');

                // Clear current DB and load new expenses
                if (!expenseDB) throw new Error("DB not ready");
                const store = expenseDB.db.transaction('transactions', 'readwrite').objectStore('transactions');
                store.clear();
                
                for (const tx of data.expenses) {
                    // Strip ID if restoring to let IndexedDB regenerate auto-increment safely
                    const cleanTx = { ...tx };
                    delete cleanTx.id;
                    await expenseDB.addExpense(cleanTx);
                }

                // Restore settings
                if (data.settings) {
                    if (data.settings.profileName) localStorage.setItem('profileName', data.settings.profileName);
                    if (data.settings.budgets) localStorage.setItem('ef_budgets', JSON.stringify(data.settings.budgets));
                    if (data.settings.wallets) localStorage.setItem('ef_wallets', JSON.stringify(data.settings.wallets));
                    if (data.settings.themeAccent) localStorage.setItem('theme-accent', data.settings.themeAccent);
                    if (data.settings.currency) {
                        currentCurrency = data.settings.currency;
                        localStorage.setItem('ef_currency', currentCurrency);
                        if (currSelect) currSelect.value = currentCurrency;
                    }
                    if (data.settings.theme) {
                        localStorage.setItem('theme', data.settings.theme);
                    }
                }

                showToast('Restore complete! Reloading...', 'success');
                setTimeout(() => window.location.reload(), 1500);

            } catch (err) {
                console.error(err);
                showToast('Invalid backup file', 'error');
            }
            restoreInput.value = '';
        };
        reader.readAsText(file);
    });

    // 5. Clear All Data
    document.getElementById('setting-clear')?.addEventListener('click', async () => {
        const firstConfirm = await showConfirm("⚠️ WARNING: This will permanently delete ALL your transactions, budgets, and settings. This cannot be undone. Proceed?", "Clear All Data");
        if (firstConfirm) {
            const check = await showPrompt("Type 'DELETE' to confirm wiping all data:", "", "Security Verification");
            if (check === 'DELETE') {
                try {
                    if (expenseDB) {
                        const store = expenseDB.db.transaction('transactions', 'readwrite').objectStore('transactions');
                        store.clear();
                    }
                    // Clear specific local storage keys
                    localStorage.removeItem('ef_budgets');
                    localStorage.removeItem('ef_currency');
                    localStorage.removeItem('profileName');
                    localStorage.removeItem('profileImage');
                    localStorage.removeItem('ef_wallets');
                    localStorage.removeItem('ef_pin');
                    localStorage.removeItem('ef_onboarded');
                    localStorage.removeItem('theme-accent');

                    showToast('Data wiped completely. Reloading...', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } catch (e) {
                    showToast('Failed to clear data', 'error');
                }
            } else {
                showToast('Wipe cancelled.', 'info');
            }
        }
    });
    
    // 6. Privacy & About
    document.getElementById('setting-privacy')?.addEventListener('click', async () => {
        await showAlert("ExpenseFlow is a 100% offline-first application. All your financial data is stored locally on this device using your browser's IndexedDB and LocalStorage.\n\nNo data is ever sent to any external server. You own your data.", "Privacy Policy");
    });
});

