/**
 * Phase 7 – Premium Feature Enhancement
 * Implements Receipt Upload, Savings Goals, Custom Wallets, Advanced Filters, Smart Tags,
 * Local AI Insights, PIN Security, Onboarding Slides, and Recurring Transactions.
 */

document.addEventListener('DOMContentLoaded', () => {



    // ==========================================
    // 3. SAVINGS GOALS SYSTEM
    // ==========================================
    const goalsList = document.getElementById('goals-list');
    const btnAddGoal = document.getElementById('btn-add-goal');
    const goalModal = document.getElementById('goal-modal');
    const saveGoalBtn = document.getElementById('save-goal-btn');

    const goalNameInput = document.getElementById('goal-name-input');
    const goalTargetInput = document.getElementById('goal-target-input');
    const goalCurrentInput = document.getElementById('goal-current-input');
    const goalDateInput = document.getElementById('goal-date-input');

    function getGoals() {
        try {
            return JSON.parse(localStorage.getItem('ef_goals')) || [];
        } catch {
            return [];
        }
    }

    function saveGoals(goalsList) {
        localStorage.setItem('ef_goals', JSON.stringify(goalsList));
    }

    if (btnAddGoal) {
        btnAddGoal.addEventListener('click', () => {
            if (goalModal) {
                goalModal.classList.add('active');
                goalNameInput.value = '';
                goalTargetInput.value = '';
                goalCurrentInput.value = '0';
                goalDateInput.value = new Date().toISOString().split('T')[0];
            }
        });
    }

    if (saveGoalBtn) {
        saveGoalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const name = goalNameInput.value.trim();
            const target = parseFloat(goalTargetInput.value);
            const current = parseFloat(goalCurrentInput.value) || 0;
            const date = goalDateInput.value;

            if (!name || isNaN(target) || target <= 0 || !date) {
                window.showToast?.("Please fill out all fields correctly", "warning");
                return;
            }

            const newGoal = {
                id: Date.now().toString(),
                name,
                target,
                current,
                date
            };

            const list = getGoals();
            list.push(newGoal);
            saveGoals(list);

            if (goalModal) goalModal.classList.remove('active');
            renderGoals();
            window.showToast?.("Goal added successfully", "savings");
        });
    }

    function renderGoals() {
        if (!goalsList) return;
        goalsList.innerHTML = '';

        const list = getGoals();
        if (list.length === 0) {
            goalsList.innerHTML = `<p style="text-align: center; color: var(--text-secondary); margin-top: var(--space-xl);">No savings goals yet. Add one to track your dreams!</p>`;
            return;
        }

        const fmt = (v) => window.formatCurrency(v);

        list.forEach(goal => {
            const pct = Math.min(((goal.current / goal.target) * 100), 100).toFixed(0);
            const card = document.createElement('div');
            card.className = 'glass-card';
            card.style.padding = 'var(--space-md)';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '8px';

            const remaining = goal.target - goal.current;
            const remainingText = remaining <= 0 ? "Goal achieved! 🎉" : `${fmt(remaining)} remaining`;

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="font-size: 16px; font-weight: 600; color: var(--text-primary);">${goal.name}</h3>
                    <button class="icon-btn btn-delete-goal" data-id="${goal.id}" aria-label="Delete Goal" style="color: #FF453A;">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary);">
                    <span>Target: ${fmt(goal.target)}</span>
                    <span>Date: ${String(new Date(goal.date).getDate()).padStart(2, '0') + '/' + String(new Date(goal.date).getMonth() + 1).padStart(2, '0') + '/' + new Date(goal.date).getFullYear()}</span>
                </div>
                <div style="width: 100%; height: 8px; background: var(--border-color); border-radius: var(--radius-full); overflow: hidden; margin-top: 4px;">
                    <div style="width: ${pct}%; height: 100%; background: var(--accent-gradient); border-radius: var(--radius-full); transition: width 0.5s ease;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                    <span style="font-size: 12px; color: var(--text-muted); font-weight: 500;">${pct}% Saved (${fmt(goal.current)})</span>
                    <span style="font-size: 12px; font-weight: 600; color: ${remaining <= 0 ? '#30D158' : 'var(--text-secondary)'};">${remainingText}</span>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                    <button class="btn-primary btn-add-funds" data-id="${goal.id}" style="margin: 0; padding: 6px 12px; font-size: 12px; width: auto; flex: 1;">+ Add Funds</button>
                </div>
            `;

            // Delete action
            card.querySelector('.btn-delete-goal').addEventListener('click', async () => {
                const confirmed = await window.showConfirm("Are you sure you want to delete this goal?", "Delete Goal");
                if (confirmed) {
                    const list = getGoals();
                    const filtered = list.filter(g => g.id !== goal.id);
                    saveGoals(filtered);
                    renderGoals();
                    window.showToast?.("Goal removed", "delete");
                }
            });

            // Add funds action
            card.querySelector('.btn-add-funds').addEventListener('click', async () => {
                const amt = await window.showPrompt(`How much would you like to add to "${goal.name}"?`, "Add Funds");
                if (amt) {
                    const parsed = parseFloat(amt);
                    if (!isNaN(parsed) && parsed > 0) {
                        const list = getGoals();
                        const targetGoal = list.find(g => g.id === goal.id);
                        if (targetGoal) {
                            targetGoal.current += parsed;
                            saveGoals(list);
                            renderGoals();
                            window.showToast?.(`Added ${fmt(parsed)} to goal!`, "savings");
                        }
                    } else {
                        await window.showAlert("Please enter a valid positive number", "Invalid Amount");
                    }
                }
            });

            goalsList.appendChild(card);
        });
    }

    // Refresh goals list on navigation drawer click
    document.querySelectorAll('.drawer-item').forEach(item => {
        item.addEventListener('click', () => {
            if (item.getAttribute('data-target') === 'goals-view') {
                renderGoals();
            }
        });
    });


    // ==========================================
    // 4. CUSTOM WALLETS SYSTEM
    // ==========================================
    const walletsList = document.getElementById('wallets-list');
    const btnAddWallet = document.getElementById('btn-add-wallet');
    const walletModal = document.getElementById('wallet-modal');
    const saveWalletBtn = document.getElementById('save-wallet-btn');

    const walletNameInput = document.getElementById('wallet-name-input');
    const walletBalanceInput = document.getElementById('wallet-balance-input');

    function getWallets() {
        try {
            return JSON.parse(localStorage.getItem('ef_wallets')) || ["Main Wallet", "Savings", "Business"];
        } catch {
            return ["Main Wallet", "Savings", "Business"];
        }
    }

    function saveWallets(wallets) {
        localStorage.setItem('ef_wallets', JSON.stringify(wallets));
    }

    if (btnAddWallet) {
        btnAddWallet.addEventListener('click', () => {
            if (walletModal) {
                walletModal.classList.add('active');
                walletNameInput.value = '';
                walletBalanceInput.value = '0';
            }
        });
    }

    if (saveWalletBtn) {
        saveWalletBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const name = walletNameInput.value.trim();
            const initial = parseFloat(walletBalanceInput.value) || 0;

            if (!name) {
                window.showToast?.("Wallet name is required", "warning");
                return;
            }

            const wallets = getWallets();
            if (wallets.map(w => typeof w === 'string' ? w : w.name).includes(name)) {
                window.showToast?.("Wallet already exists", "warning");
                return;
            }

            wallets.push({ name, initial });
            saveWallets(wallets);

            if (walletModal) walletModal.classList.remove('active');
            updateWalletDropdowns();
            renderWallets();
            window.showToast?.("Wallet created", "account_balance");
        });
    }

    function updateWalletDropdowns() {
        const selects = [document.getElementById('tx-wallet'), document.getElementById('filter-wallet')];
        const wallets = getWallets();

        selects.forEach(select => {
            if (!select) return;
            const isFilter = select.id === 'filter-wallet';
            select.innerHTML = isFilter ? '<option value="all">All Wallets</option>' : '';
            
            wallets.forEach(w => {
                const name = typeof w === 'string' ? w : w.name;
                select.innerHTML += `<option value="${name}">${name}</option>`;
            });
        });
    }

    function renderWallets() {
        if (!walletsList) return;
        walletsList.innerHTML = '';

        const wallets = getWallets();
        const transactions = window.currentExpenses || [];
        const fmt = (v) => window.formatCurrency(v);

        wallets.forEach(w => {
            const name = typeof w === 'string' ? w : w.name;
            const initial = typeof w === 'string' ? 0 : w.initial;

            // Calculate wallet current balance from transactions
            let balance = initial;
            transactions.forEach(tx => {
                if (tx.wallet === name) {
                    if (tx.type === 'income') balance += tx.amount;
                    else balance -= tx.amount;
                }
            });

            const card = document.createElement('div');
            card.className = 'glass-card';
            card.style.padding = 'var(--space-md)';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '4px';

            card.innerHTML = `
                <span class="material-symbols-rounded" style="color: var(--accent-color); font-size: 28px;">account_balance_wallet</span>
                <h4 style="margin-top: 4px; font-weight: 600;">${name}</h4>
                <p style="font-size: 18px; font-weight: 700; color: ${balance >= 0 ? 'var(--text-primary)' : '#FF453A'};">${fmt(balance)}</p>
                <span style="font-size: 11px; color: var(--text-muted);">Dynamic Ledger Balance</span>
            `;
            walletsList.appendChild(card);
        });
    }

    // Refresh wallet state on navigation select
    document.querySelectorAll('.drawer-item').forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            if (target === 'wallets-view') {
                renderWallets();
            }
        });
    });

    // Populate dropdowns on initial load
    setTimeout(updateWalletDropdowns, 200);


    // ==========================================
    // 5. RECEIPT ATTACHMENT SYSTEM
    // ==========================================
    const receiptFileInput = document.getElementById('tx-receipt-file');
    const receiptDataInput = document.getElementById('tx-receipt-data');
    const receiptPreviewContainer = document.getElementById('receipt-preview-container');
    const receiptPreview = document.getElementById('receipt-preview');
    const btnRemoveReceipt = document.getElementById('btn-remove-receipt');

    if (receiptFileInput && receiptDataInput) {
        receiptFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const dataUrl = event.target.result;
                    receiptDataInput.value = dataUrl;
                    if (receiptPreview) receiptPreview.src = dataUrl;
                    if (receiptPreviewContainer) receiptPreviewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (btnRemoveReceipt) {
        btnRemoveReceipt.addEventListener('click', () => {
            if (receiptFileInput) receiptFileInput.value = '';
            if (receiptDataInput) receiptDataInput.value = '';
            if (receiptPreviewContainer) receiptPreviewContainer.style.display = 'none';
        });
    }


    // ==========================================
    // 6. SMART TAG SUGGESTIONS
    // ==========================================
    const txCategorySelect = document.getElementById('tx-category');
    const smartTagsContainer = document.getElementById('smart-tags-container');
    const txTagsInput = document.getElementById('tx-tags');

    const SMART_TAGS = {
        "🍔 Food & Beverage": ["lunch", "dinner", "groceries", "coffee", "restaurant", "snacks"],
        "🚗 Transport": ["fuel", "uber", "bus", "train", "parking", "maintenance"],
        "🛍️ Shopping": ["clothes", "electronics", "gifts", "amazon", "groceries", "home decor"],
        "🎬 Entertainment": ["movie", "netflix", "concert", "game", "hobbies", "party"],
        "🏠 Housing": ["rent", "electricity", "water", "internet", "maintenance", "gas"],
        "💼 Salary": ["paycheck", "freelance", "bonus", "reimbursement", "dividends"],
        "🔄 Other": ["miscellaneous", "cashback", "gift", "refund"]
    };

    function updateSmartTags() {
        if (!smartTagsContainer || !txCategorySelect) return;
        smartTagsContainer.innerHTML = '';
        const cat = txCategorySelect.value;
        const tags = SMART_TAGS[cat] || [];

        tags.forEach(tag => {
            const chip = document.createElement('span');
            chip.className = 'filter-chip';
            chip.style.fontSize = '11px';
            chip.style.padding = '4px 8px';
            chip.style.cursor = 'pointer';
            chip.style.margin = '0';
            chip.textContent = `#${tag}`;
            
            chip.addEventListener('click', () => {
                const current = txTagsInput.value.split(',').map(t => t.trim()).filter(t => t);
                if (!current.includes(tag)) {
                    current.push(tag);
                    txTagsInput.value = current.join(', ');
                }
            });

            smartTagsContainer.appendChild(chip);
        });
    }

    if (txCategorySelect) {
        txCategorySelect.addEventListener('change', updateSmartTags);
        // Initial setup
        setTimeout(updateSmartTags, 300);
    }


    // ==========================================
    // 7. ADVANCED FILTERS INTEGRATION
    // ==========================================
    const filterCategory = document.getElementById('filter-category');
    const filterWallet = document.getElementById('filter-wallet');
    const filterMinAmt = document.getElementById('filter-min-amt');
    const filterMaxAmt = document.getElementById('filter-max-amt');
    const filterStartDate = document.getElementById('filter-start-date');
    const filterEndDate = document.getElementById('filter-end-date');
    const filterFavorites = document.getElementById('filter-favorites');

    function applyPremiumFilters() {
        if (typeof window.applyFiltersAndSort !== 'function' || !window.currentExpenses) return;

        let filtered = [...window.currentExpenses];

        // 1. Category Filter
        const cat = filterCategory?.value || 'all';
        if (cat !== 'all') {
            filtered = filtered.filter(tx => tx.category === cat);
        }

        // 2. Wallet Filter
        const wal = filterWallet?.value || 'all';
        if (wal !== 'all') {
            filtered = filtered.filter(tx => tx.wallet === wal);
        }

        // 3. Amount Filter
        const min = parseFloat(filterMinAmt?.value);
        const max = parseFloat(filterMaxAmt?.value);
        if (!isNaN(min)) filtered = filtered.filter(tx => tx.amount >= min);
        if (!isNaN(max)) filtered = filtered.filter(tx => tx.amount <= max);

        // 4. Date Range Filter
        const start = filterStartDate?.value;
        const end = filterEndDate?.value;
        if (start) filtered = filtered.filter(tx => tx.date >= start);
        if (end) filtered = filtered.filter(tx => tx.date <= end);

        // 5. Favorites Filter
        if (filterFavorites?.checked) {
            filtered = filtered.filter(tx => tx.favorite);
        }

        // 6. Base Sort
        const sortBy = document.getElementById('sort-by')?.value || 'date-desc';
        filtered.sort((a, b) => {
            if (sortBy === 'date-desc') return b.timestamp - a.timestamp;
            if (sortBy === 'date-asc') return a.timestamp - b.timestamp;
            if (sortBy === 'amount-desc') return b.amount - a.amount;
            if (sortBy === 'amount-asc') return a.amount - b.amount;
            return 0;
        });

        // Render output list
        if (window.renderList && window.allTransactionsList) {
            window.renderList(filtered, window.allTransactionsList);
        }
    }

    // Attach listeners
    [filterCategory, filterWallet, filterMinAmt, filterMaxAmt, filterStartDate, filterEndDate, filterFavorites]
    .forEach(el => {
        if (el) {
            el.addEventListener('input', applyPremiumFilters);
            el.addEventListener('change', applyPremiumFilters);
        }
    });

    // Override the base trigger so advanced filters apply when sort panel toggles or inputs change
    const baseApply = window.applyFiltersAndSort;
    window.applyFiltersAndSort = function() {
        if (typeof baseApply === 'function') baseApply();
        applyPremiumFilters();
    };


    // ==========================================
    // 8. LOCAL AI SPENDING INSIGHTS
    // ==========================================
    const insightsEl = document.getElementById('insights-content');

    function generateAIInsights() {
        if (!insightsEl || !window.currentExpenses) return;
        const allTx = window.currentExpenses;
        if (allTx.length === 0) return;

        const expenseTx = allTx.filter(t => t.type === 'expense');
        const incomeTx = allTx.filter(t => t.type === 'income');
        const totalExpenses = expenseTx.reduce((s, t) => s + t.amount, 0);
        const totalIncome = incomeTx.reduce((s, t) => s + t.amount, 0);

        const aiInsights = [];

        // 1. Wallet balance distribution warning
        const wallets = getWallets().map(w => typeof w === 'string' ? w : w.name);
        wallets.forEach(w => {
            let balance = 0;
            allTx.forEach(tx => {
                if (tx.wallet === w) {
                    if (tx.type === 'income') balance += tx.amount;
                    else balance -= tx.amount;
                }
            });
            if (balance < 0) {
                aiInsights.push({
                    emoji: '⚠️',
                    text: `Your wallet <strong>"${w}"</strong> is overdrawn by <strong>${window.formatCurrency(Math.abs(balance))}</strong>. Replenish it soon.`
                });
            }
        });

        // 2. High single expense warning
        const highExpense = expenseTx.find(tx => tx.amount > (totalExpenses * 0.4) && totalExpenses > 0);
        if (highExpense) {
            aiInsights.push({
                emoji: '💡',
                text: `Your purchase of <strong>${window.formatCurrency(highExpense.amount)}</strong> in "${highExpense.category}" accounts for over 40% of your total monthly budget.`
            });
        }

        // 3. Smart savings goal projection
        const goals = getGoals();
        goals.forEach(goal => {
            const rem = goal.target - goal.current;
            if (rem > 0) {
                const daysLeft = Math.ceil((new Date(goal.date) - new Date()) / (1000 * 60 * 60 * 24));
                if (daysLeft > 0) {
                    const requiredDaily = rem / daysLeft;
                    aiInsights.push({
                        emoji: '🎯',
                        text: `To achieve <strong>"${goal.name}"</strong> by ${String(new Date(goal.date).getDate()).padStart(2, '0') + '/' + String(new Date(goal.date).getMonth() + 1).padStart(2, '0') + '/' + new Date(goal.date).getFullYear()}, you need to save an average of <strong>${window.formatCurrency(requiredDaily)}/day</strong>.`
                    });
                }
            }
        });

        // 4. Tag frequency anomaly
        const tagsMap = {};
        expenseTx.forEach(tx => {
            if (tx.tags) {
                tx.tags.forEach(tag => {
                    tagsMap[tag] = (tagsMap[tag] || 0) + tx.amount;
                });
            }
        });
        const highestTag = Object.entries(tagsMap).sort((a,b) => b[1] - a[1])[0];
        if (highestTag) {
            aiInsights.push({
                emoji: '🏷️',
                text: `You have spent <strong>${window.formatCurrency(highestTag[1])}</strong> on items tagged with <strong>#${highestTag[0]}</strong> this month.`
            });
        }

        // Append premium local AI recommendations
        if (aiInsights.length > 0) {
            const currentHTML = insightsEl.innerHTML;
            const aiHTML = `
                <div style="margin-top: var(--space-md); border-top: 1px dashed var(--border-color); padding-top: var(--space-md);">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <span class="material-symbols-rounded" style="color: var(--accent-color);">psychology</span>
                        <h4 style="font-weight: 600; font-size: 14px;">Local AI Insights</h4>
                    </div>
                    ${aiInsights.map(i => `<div class="insight-item"><span class="emoji">${i.emoji}</span><span>${i.text}</span></div>`).join('')}
                </div>
            `;
            insightsEl.innerHTML = currentHTML + aiHTML;
        }
    }

    // Wrap analytics load to inject AI insights
    const baseRenderAnalytics = window.renderAnalytics;
    window.renderAnalytics = function(txList) {
        if (typeof baseRenderAnalytics === 'function') baseRenderAnalytics(txList);
        setTimeout(generateAIInsights, 100);
    };


    // ==========================================
    // 9. PREMIUM THEME ACCENTS SELECTOR
    // ==========================================
    const themeAccentSelect = document.getElementById('theme-accent-select');
    if (themeAccentSelect) {
        // Load initial
        const savedAccent = localStorage.getItem('theme-accent') || 'zinc';
        themeAccentSelect.value = savedAccent;
        document.documentElement.setAttribute('data-theme-accent', savedAccent);

        themeAccentSelect.addEventListener('change', (e) => {
            const acc = e.target.value;
            localStorage.setItem('theme-accent', acc);
            document.documentElement.setAttribute('data-theme-accent', acc);
            window.showToast?.(`Theme changed to ${e.target.options[e.target.selectedIndex].text}`, "palette");
        });
    }


    // ==========================================
    // 10. EMI CALCULATOR ENGINE
    // ==========================================
    const emiAmount = document.getElementById('emi-amount');
    const emiRate = document.getElementById('emi-rate');
    const emiTenure = document.getElementById('emi-tenure');
    const btnCalcEmi = document.getElementById('btn-calc-emi');
    const emiResult = document.getElementById('emi-result');

    const resEmiMonthly = document.getElementById('res-emi-monthly');
    const resEmiInterest = document.getElementById('res-emi-interest');
    const resEmiTotal = document.getElementById('res-emi-total');

    if (btnCalcEmi) {
        btnCalcEmi.addEventListener('click', () => {
            const P = parseFloat(emiAmount.value);
            const annualRate = parseFloat(emiRate.value);
            const N = parseFloat(emiTenure.value);

            if (isNaN(P) || P <= 0 || isNaN(annualRate) || annualRate <= 0 || isNaN(N) || N <= 0) {
                window.showAlert?.("Please enter valid loan values", "Calculation Error");
                return;
            }

            const R = (annualRate / 12) / 100;
            // Formula: EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
            const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
            const totalRepayment = emi * N;
            const totalInterest = totalRepayment - P;

            const fmt = (v) => window.formatCurrency(v);

            if (resEmiMonthly) resEmiMonthly.textContent = fmt(emi);
            if (resEmiInterest) resEmiInterest.textContent = fmt(totalInterest);
            if (resEmiTotal) resEmiTotal.textContent = fmt(totalRepayment);

            if (emiResult) emiResult.style.display = 'block';
        });
    }


    // ==========================================
    // 11. RECURRING TRANSACTION SIMULATOR (Offline)
    // ==========================================
    async function simulateRecurringExpenses() {
        if (typeof expenseDB === 'undefined' || !expenseDB.db) return;
        const allTx = await expenseDB.getAllExpenses();
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const recurringTx = allTx.filter(t => t.recurring && t.recurring !== 'none');
        let simulatedCount = 0;

        for (const tx of recurringTx) {
            const txDate = new Date(tx.date);
            let nextDate = new Date(txDate);
            
            // Calculate next scheduled occurrence
            if (tx.recurring === 'daily') {
                nextDate.setDate(txDate.getDate() + 1);
            } else if (tx.recurring === 'weekly') {
                nextDate.setDate(txDate.getDate() + 7);
            } else if (tx.recurring === 'monthly') {
                nextDate.setMonth(txDate.getMonth() + 1);
            }

            // If scheduled occurrence has passed, simulate and create
            if (nextDate <= now) {
                const nextDateStr = nextDate.toISOString().split('T')[0];
                
                // Avoid double-adding
                const exists = allTx.some(t => t.category === tx.category && t.date === nextDateStr && t.amount === tx.amount);
                if (!exists) {
                    const clonedTx = {
                        type: tx.type,
                        amount: tx.amount,
                        date: nextDateStr,
                        time: tx.time,
                        category: tx.category,
                        paymentMethod: tx.paymentMethod,
                        wallet: tx.wallet,
                        tags: [...(tx.tags || []), "recurring-simulated"],
                        notes: `[Recurring] ${tx.notes || ''}`,
                        recurring: tx.recurring, // Keep recurring cascade going
                        favorite: tx.favorite,
                        receipt: tx.receipt,
                        timestamp: new Date(`${nextDateStr}T${tx.time}`).getTime()
                    };

                    // Add simulation entry
                    await expenseDB.addExpense(clonedTx);
                    simulatedCount++;
                    
                    // Stop recurrence flag on the older original so it doesn't spawn duplicates
                    tx.recurring = 'none';
                    await expenseDB.updateExpense(tx.id, tx);
                }
            }
        }

        if (simulatedCount > 0 && typeof window.loadAndRenderTransactions === 'function') {
            window.showToast?.(`Simulated ${simulatedCount} recurring transaction(s)`, "autorenew");
            setTimeout(window.loadAndRenderTransactions, 500);
        }
    }

    // Run scheduler simulation silently in the background on startup
    setTimeout(simulateRecurringExpenses, 1500);
});
