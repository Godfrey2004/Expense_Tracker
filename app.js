
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item, .drawer-item');
    const views = document.querySelectorAll('.view');
    
    function switchView(targetId) {
        // Hide all views
        views.forEach(view => {
            view.classList.remove('active');
        });
        
        // Remove active class from all nav items
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Show target view
        const targetView = document.getElementById(targetId);
        if (targetView) {
            targetView.classList.add('active');
        }
        
        // Add active class to corresponding nav items
        navItems.forEach(item => {
            if (item.getAttribute('data-target') === targetId) {
                item.classList.add('active');
            }
        });
        
        // Close drawer if open
        closeDrawerFunc();
        
        // Scroll to top
        document.getElementById('main-content').scrollTop = 0;
    }
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            if(target) {
                switchView(target);
                // Refresh analytics when switching to analytics view
                if (target === 'analytics-view' && currentExpenses.length >= 0) {
                    setTimeout(() => renderAnalytics(currentExpenses), 50);
                }
            }
        });
    });

    // See All link
    const seeAllLink = document.getElementById('see-all-link');
    if (seeAllLink) {
        seeAllLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('expenses-view');
        });
    }

    // Theme Toggle
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const themeColorMeta = document.getElementById('theme-color-meta');
    
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });
    
    function setTheme(theme) {
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const icon = themeToggleBtn.querySelector('.material-symbols-rounded');
        if (theme === 'dark') {
            icon.textContent = 'light_mode';
            themeColorMeta.setAttribute('content', '#09090b');
        } else {
            icon.textContent = 'dark_mode';
            themeColorMeta.setAttribute('content', '#f4f4f5');
        }
    }

    // Side Drawer
    const menuBtn = document.getElementById('menu-btn');
    const closeDrawerBtn = document.getElementById('close-drawer');
    const sideDrawer = document.getElementById('side-drawer');
    const drawerOverlay = document.getElementById('drawer-overlay');
    
    function openDrawer() {
        sideDrawer.classList.add('open');
        drawerOverlay.classList.add('active');
    }
    
    function closeDrawerFunc() {
        sideDrawer.classList.remove('open');
        drawerOverlay.classList.remove('active');
    }
    
    menuBtn.addEventListener('click', openDrawer);
    closeDrawerBtn.addEventListener('click', closeDrawerFunc);
    drawerOverlay.addEventListener('click', closeDrawerFunc);

    // Modals
    const addBtn = document.getElementById('add-btn');
    const addModal = document.getElementById('add-modal');
    const profileAvatarBtn = document.getElementById('profile-avatar-btn');
    const profileModal = document.getElementById('profile-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    // Open Add Modal
    addBtn.addEventListener('click', openNewTransactionModal);

    function openNewTransactionModal() {
        if(typeof txForm !== 'undefined') txForm.reset();
        if(typeof txIdInput !== 'undefined') txIdInput.value = '';
        if(typeof addModalTitle !== 'undefined') addModalTitle.textContent = 'New Transaction';
        
        // Remove delete and duplicate buttons if exist
        const existingDelBtn = document.getElementById('delete-tx-btn');
        if (existingDelBtn) existingDelBtn.remove();
        const existingDupBtn = document.getElementById('duplicate-tx-btn');
        if (existingDupBtn) existingDupBtn.remove();
        
        // Reset premium elements
        if (document.getElementById('tx-receipt-data')) document.getElementById('tx-receipt-data').value = '';
        if (document.getElementById('tx-receipt-file')) document.getElementById('tx-receipt-file').value = '';
        if (document.getElementById('receipt-preview-container')) document.getElementById('receipt-preview-container').style.display = 'none';
        if (document.getElementById('tx-favorite')) document.getElementById('tx-favorite').checked = false;
        if (document.getElementById('tx-recurring')) document.getElementById('tx-recurring').value = 'none';
        if (document.getElementById('smart-tags-container')) document.getElementById('smart-tags-container').innerHTML = '';
        
        const now = new Date();
        if(typeof txDateInput !== 'undefined') txDateInput.value = now.toISOString().split('T')[0];
        if(typeof txTimeInput !== 'undefined') txTimeInput.value = now.toTimeString().split(' ')[0].substring(0, 5);
        
        addModal.classList.add('active');
    }

    // Open Profile Modal
    profileAvatarBtn.addEventListener('click', () => {
        profileModal.classList.add('active');
    });
    
    // Close Modals dynamically
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal-overlay').classList.remove('active');
        });
    });
    
    // Close when clicking outside content
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Profile Edit Logic
    const profileNameInput = document.getElementById('profile-name-input');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const headerProfileImg = document.getElementById('header-profile-img');
    const modalProfileImg = document.getElementById('modal-profile-img');
    const profileImageUpload = document.getElementById('profile-image-upload');

    // Load saved profile data
    const savedName = localStorage.getItem('profileName') || 'User';
    const savedImage = localStorage.getItem('profileImage');
    
    updateProfileImages(savedName, savedImage);
    profileNameInput.value = savedName;

    let currentImageDataUrl = savedImage;

    // Handle image upload
    profileImageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                currentImageDataUrl = event.target.result;
                modalProfileImg.src = currentImageDataUrl;
            };
            reader.readAsDataURL(file);
        }
    });

    function generateLetterAvatar(name) {
        const char = (name || 'U').charAt(0).toUpperCase();
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8b5cf6" /><stop offset="100%" stop-color="#3b82f6" /></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#avatarGrad)" /><text x="50" y="55" font-family="'Outfit', sans-serif" font-size="45" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${char}</text></svg>`;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    function updateProfileImages(name, imageDataUrl) {
        if (imageDataUrl) {
            headerProfileImg.src = imageDataUrl;
            modalProfileImg.src = imageDataUrl;
        } else {
            const url = generateLetterAvatar(name);
            headerProfileImg.src = url;
            modalProfileImg.src = url;
        }
    }

    saveProfileBtn.addEventListener('click', async () => {
        const newName = profileNameInput.value.trim() || 'User';
        localStorage.setItem('profileName', newName);
        if (currentImageDataUrl) {
            try {
                localStorage.setItem('profileImage', currentImageDataUrl);
            } catch (e) {
                console.error("Image too large for local storage", e);
                await window.showAlert("Image is too large to save. Please choose a smaller image.", "Image Error");
            }
        }
        updateProfileImages(newName, currentImageDataUrl);
        profileModal.classList.remove('active');
    });

    // --- FORM AND DB LOGIC ---
    const txForm = document.getElementById('transaction-form');
    const txIdInput = document.getElementById('tx-id');
    const txTypeInputs = document.getElementsByName('tx-type');
    const txAmountInput = document.getElementById('tx-amount');
    const txDateInput = document.getElementById('tx-date');
    const txTimeInput = document.getElementById('tx-time');
    const txCategoryInput = document.getElementById('tx-category');
    const txPaymentMethodInput = document.getElementById('tx-payment-method');
    const txWalletInput = document.getElementById('tx-wallet');
    const txTagsInput = document.getElementById('tx-tags');
    const txNotesInput = document.getElementById('tx-notes');
    const addModalTitle = document.getElementById('modal-title');
    const allTransactionsList = document.getElementById('all-transactions-list');
    
    // Sort and Filter elements
    const sortFilterBtn = document.getElementById('sort-filter-btn');
    const filterSortPanel = document.getElementById('filter-sort-panel');
    const searchTxInput = document.getElementById('search-tx');
    const sortByInput = document.getElementById('sort-by');
    const filterTypeInput = document.getElementById('filter-type');
    
    let currentExpenses = [];

    // Toggle Filter Panel
    if (sortFilterBtn) {
        sortFilterBtn.addEventListener('click', () => {
            filterSortPanel.style.display = filterSortPanel.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (txForm) {
        txForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const type = Array.from(txTypeInputs).find(radio => radio.checked).value;
            const tagsRaw = txTagsInput.value;
            const txData = {
                type: type,
                amount: parseFloat(txAmountInput.value),
                date: txDateInput.value,
                time: txTimeInput.value,
                category: txCategoryInput.value,
                paymentMethod: txPaymentMethodInput.value,
                wallet: txWalletInput.value,
                tags: tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(t => t) : [],
                notes: txNotesInput.value,
                recurring: document.getElementById('tx-recurring')?.value || 'none',
                favorite: document.getElementById('tx-favorite')?.checked || false,
                receipt: document.getElementById('tx-receipt-data')?.value || '',
                timestamp: new Date(`${txDateInput.value}T${txTimeInput.value}`).getTime()
            };

            if (txIdInput.value) {
                await expenseDB.updateExpense(txIdInput.value, txData);
            } else {
                await expenseDB.addExpense(txData);
            }

            addModal.classList.remove('active');
            loadAndRenderTransactions();
        });
    }

    async function loadAndRenderTransactions() {
        if (typeof expenseDB === 'undefined' || !expenseDB.db) {
            setTimeout(loadAndRenderTransactions, 100);
            return;
        }
        currentExpenses = await expenseDB.getAllExpenses();
        window.currentExpenses = currentExpenses;
        window.renderList = renderList;
        window.allTransactionsList = allTransactionsList;
        applyFiltersAndSort();
    }

    function applyFiltersAndSort() {
        window.applyFiltersAndSort = applyFiltersAndSort;
        let filtered = [...currentExpenses];

        // Search
        const searchTerm = searchTxInput ? searchTxInput.value.toLowerCase() : '';
        if (searchTerm) {
            filtered = filtered.filter(tx => 
                tx.category.toLowerCase().includes(searchTerm) || 
                (tx.notes && tx.notes.toLowerCase().includes(searchTerm)) ||
                (tx.tags && tx.tags.some(t => t.toLowerCase().includes(searchTerm)))
            );
        }

        // Filter Type
        const fType = filterTypeInput ? filterTypeInput.value : 'all';
        if (fType !== 'all') {
            filtered = filtered.filter(tx => tx.type === fType);
        }

        // Sort
        const sortBy = sortByInput ? sortByInput.value : 'date-desc';
        filtered.sort((a, b) => {
            if (sortBy === 'date-desc') return b.timestamp - a.timestamp;
            if (sortBy === 'date-asc') return a.timestamp - b.timestamp;
            if (sortBy === 'amount-desc') return b.amount - a.amount;
            if (sortBy === 'amount-asc') return a.amount - b.amount;
            return 0;
        });

        renderList(filtered, allTransactionsList);
        renderHomeDashboard(currentExpenses);
    }

    if (searchTxInput) searchTxInput.addEventListener('input', applyFiltersAndSort);
    if (sortByInput) sortByInput.addEventListener('change', applyFiltersAndSort);
    if (filterTypeInput) filterTypeInput.addEventListener('change', applyFiltersAndSort);

    function renderList(transactions, container) {
        if (!container) return;
        container.innerHTML = '';

        if (transactions.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: var(--text-secondary); margin-top: var(--space-xl);">No transactions found.</p>`;
            return;
        }

        transactions.forEach(tx => {
            const el = document.createElement('div');
            el.className = 'transaction-item glass-item';
            el.style.cursor = 'pointer';
            
            const isIncome = tx.type === 'income';
            // Extract emoji and name
            const iconMatch = tx.category.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\S+)\s*(.*)/);
            const iconChar = iconMatch ? iconMatch[1] : '💰';
            const catName = iconMatch ? (iconMatch[2] || tx.category) : tx.category;

            const iconBg = isIncome ? 'rgba(48, 209, 88, 0.15)' : 'rgba(255, 69, 58, 0.15)';
            const iconColor = isIncome ? '#30D158' : '#FF453A';
            const tagsHtml = tx.tags && tx.tags.length > 0 ? ' • ' + tx.tags.join(', ') : '';
            const favHtml = tx.favorite ? '<span style="color: #FFD60A; font-size: 14px; margin-left: 4px;">★</span>' : '';
            const receiptHtml = tx.receipt ? '<span style="color: var(--accent-color); font-size: 14px; margin-left: 4px;">📎</span>' : '';
            const recHtml = (tx.recurring && tx.recurring !== 'none') ? '<span style="color: var(--text-muted); font-size: 11px; margin-left: 4px;">🔄</span>' : '';

            el.innerHTML = `
                <div class="tx-icon" style="background: ${iconBg}; color: ${iconColor}; font-size: 24px;">
                    ${iconChar}
                </div>
                <div class="tx-details">
                    <h4 style="display: flex; align-items: center; gap: 4px;">${catName}${favHtml}${receiptHtml}${recHtml}</h4>
                    <p style="font-size: 11px;">${String(new Date(tx.timestamp).getDate()).padStart(2, '0')}/${String(new Date(tx.timestamp).getMonth() + 1).padStart(2, '0')}/${new Date(tx.timestamp).getFullYear()}${tagsHtml}</p>
                </div>
                <div class="tx-amount ${isIncome ? 'positive' : 'negative'}">
                    ${isIncome ? '+' : '-'}${window.formatCurrency(tx.amount)}
                </div>
            `;

            el.addEventListener('click', () => editTransaction(tx));
            container.appendChild(el);
        });
    }

    function editTransaction(tx) {
        addModalTitle.textContent = 'Edit Transaction';
        txIdInput.value = tx.id;
        Array.from(txTypeInputs).forEach(radio => radio.checked = (radio.value === tx.type));
        txAmountInput.value = tx.amount;
        txDateInput.value = tx.date;
        txTimeInput.value = tx.time;
        txCategoryInput.value = tx.category;
        txPaymentMethodInput.value = tx.paymentMethod || 'Cash';
        txWalletInput.value = tx.wallet || 'Main Wallet';
        txTagsInput.value = (tx.tags || []).join(', ');
        txNotesInput.value = tx.notes || '';
        
        if (document.getElementById('tx-recurring')) document.getElementById('tx-recurring').value = tx.recurring || 'none';
        if (document.getElementById('tx-favorite')) document.getElementById('tx-favorite').checked = tx.favorite || false;
        if (document.getElementById('tx-receipt-data')) document.getElementById('tx-receipt-data').value = tx.receipt || '';
        const previewImg = document.getElementById('receipt-preview');
        const previewContainer = document.getElementById('receipt-preview-container');
        if (tx.receipt && previewImg) {
            previewImg.src = tx.receipt;
            if (previewContainer) previewContainer.style.display = 'block';
        } else {
            if (previewContainer) previewContainer.style.display = 'none';
        }

        let existingDelBtn = document.getElementById('delete-tx-btn');
        if (!existingDelBtn) {
            existingDelBtn = document.createElement('button');
            existingDelBtn.type = 'button';
            existingDelBtn.id = 'delete-tx-btn';
            existingDelBtn.className = 'btn-primary';
            existingDelBtn.style.background = 'rgba(255, 69, 58, 0.1)';
            existingDelBtn.style.color = '#FF453A';
            existingDelBtn.style.marginTop = 'var(--space-md)';
            existingDelBtn.textContent = 'Delete Transaction';
            
            // Add Duplicate button
            const dupBtn = document.createElement('button');
            dupBtn.type = 'button';
            dupBtn.id = 'duplicate-tx-btn';
            dupBtn.className = 'btn-primary';
            dupBtn.style.background = 'var(--bg-surface)';
            dupBtn.style.color = 'var(--text-primary)';
            dupBtn.style.border = '1px solid var(--border-color)';
            dupBtn.style.marginTop = 'var(--space-sm)';
            dupBtn.textContent = 'Duplicate Transaction';
            
            txForm.appendChild(existingDelBtn);
            txForm.appendChild(dupBtn);
        }

        const delBtn = document.getElementById('delete-tx-btn');
        const dupBtn = document.getElementById('duplicate-tx-btn');
        
        delBtn.onclick = async () => {
            const confirmed = await window.showConfirm("Are you sure you want to delete this transaction?", "Delete Transaction");
            if (confirmed) {
                await expenseDB.deleteExpense(tx.id);
                addModal.classList.remove('active');
                loadAndRenderTransactions();
            }
        };

        dupBtn.onclick = async () => {
            txIdInput.value = ''; // Clear ID so save creates a new one
            addModalTitle.textContent = 'New Transaction (Duplicated)';
            delBtn.remove();
            dupBtn.remove();
        };

        addModal.classList.add('active');
    }

    function renderHomeDashboard(allTx) {
        // Recent transactions on home
        const homeList = document.getElementById('home-transaction-list');
        if (homeList) {
            const recent = [...allTx].sort((a,b) => b.timestamp - a.timestamp).slice(0, 4);
            if (recent.length === 0) {
                homeList.innerHTML = `<p style="text-align: center; color: var(--text-secondary); margin-top: var(--space-xl);">No transactions yet. Tap + to add one.</p>`;
            } else {
                renderList(recent, homeList);
            }
        }

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let income = 0, expenses = 0, todaySpend = 0, weekSpend = 0, monthSpend = 0;
        allTx.forEach(tx => {
            if (tx.type === 'income') income += tx.amount;
            else {
                expenses += tx.amount;
                if (tx.date === todayStr) todaySpend += tx.amount;
                if (new Date(tx.date) >= weekStart) weekSpend += tx.amount;
                if (new Date(tx.date) >= monthStart) monthSpend += tx.amount;
            }
        });

        const fmt = (v) => window.formatCurrency(v);

        const balanceEl = document.querySelector('.balance-amount');
        const incomeEl = document.querySelector('.stat-icon.up + .stat-info h4');
        const expensesEl = document.querySelector('.stat-icon.down + .stat-info h4');
        if (balanceEl) balanceEl.textContent = fmt(income - expenses);
        if (incomeEl) incomeEl.textContent = fmt(income);
        if (expensesEl) expensesEl.textContent = fmt(expenses);

        // Insight pills
        const todayEl = document.getElementById('today-spend');
        const weekEl = document.getElementById('week-spend');
        const monthEl = document.getElementById('month-spend');
        if (todayEl) todayEl.textContent = fmt(todaySpend);
        if (weekEl) weekEl.textContent = fmt(weekSpend);
        if (monthEl) monthEl.textContent = fmt(monthSpend);
    }

    // ============ ANALYTICS ENGINE ============

    const CHART_COLORS = [
        '#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444',
        '#06b6d4','#ec4899','#84cc16','#f97316','#a855f7'
    ];

    let incExpChartInst = null;
    let monthlyChartInst = null;
    let weeklyChartInst = null;
    let categoryChartInst = null;

    function getChartDefaults() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            textColor: isDark ? '#a1a1aa' : '#52525b',
            gridColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        };
    }

    function renderAnalytics(allTx) {
        const expenseTx = allTx.filter(tx => tx.type === 'expense');
        const incomeTx  = allTx.filter(tx => tx.type === 'income');

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());

        const totalIncome   = incomeTx.reduce((s, t) => s + t.amount, 0);
        const totalExpenses = expenseTx.reduce((s, t) => s + t.amount, 0);
        const todaySpend    = expenseTx.filter(t => t.date === todayStr).reduce((s,t) => s+t.amount, 0);
        const savings       = totalIncome - totalExpenses;

        const fmt = (v) => window.formatCurrency(v, true);

        // KPI Cards
        const setKPI = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = fmt(val); };
        setKPI('kpi-income', totalIncome);
        setKPI('kpi-expenses', totalExpenses);
        setKPI('kpi-today', todaySpend);
        setKPI('kpi-savings', savings);

        const { textColor, gridColor } = getChartDefaults();

        // --- Income vs Expense Doughnut ---
        if (incExpChartInst) incExpChartInst.destroy();
        const incExpCtx = document.getElementById('incExpChart')?.getContext('2d');
        if (incExpCtx) {
            if (totalIncome === 0 && totalExpenses === 0) {
                incExpCtx.clearRect(0,0,400,400);
            } else {
                incExpChartInst = new Chart(incExpCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Income', 'Expenses'],
                        datasets: [{
                            data: [totalIncome, totalExpenses],
                            backgroundColor: ['rgba(48,209,88,0.85)', 'rgba(255,69,58,0.85)'],
                            borderColor: ['#30D158','#FF453A'],
                            borderWidth: 2,
                            hoverOffset: 8,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        cutout: '72%',
                        animation: { animateRotate: true, duration: 800 },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (ctx) => ` ${fmt(ctx.raw)} (${((ctx.raw/(totalIncome+totalExpenses))*100).toFixed(1)}%)`
                                }
                            }
                        }
                    }
                });
            }
        }
        // Custom legend
        const legendEl = document.getElementById('inc-exp-legend');
        if (legendEl) {
            legendEl.innerHTML = [
                {label:'Income', color:'#30D158', val:totalIncome},
                {label:'Expenses', color:'#FF453A', val:totalExpenses}
            ].map(l => `<div class="legend-item"><span class="legend-dot" style="background:${l.color};"></span>${l.label}: <strong>${fmt(l.val)}</strong></div>`).join('');
        }

        // --- Monthly Trend (last 6 months income & expense bars) ---
        if (monthlyChartInst) monthlyChartInst.destroy();
        const monthlyCtx = document.getElementById('monthlyChart')?.getContext('2d');
        if (monthlyCtx) {
            const months = [];
            const monthlyIncome = [];
            const monthlyExpense = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const label = d.toLocaleString('default', { month: 'short' });
                months.push(label);
                const mIncome = allTx.filter(t => t.type==='income' && new Date(t.date).getMonth()===d.getMonth() && new Date(t.date).getFullYear()===d.getFullYear()).reduce((s,t)=>s+t.amount,0);
                const mExpense = allTx.filter(t => t.type==='expense' && new Date(t.date).getMonth()===d.getMonth() && new Date(t.date).getFullYear()===d.getFullYear()).reduce((s,t)=>s+t.amount,0);
                monthlyIncome.push(mIncome);
                monthlyExpense.push(mExpense);
            }
            monthlyChartInst = new Chart(monthlyCtx, {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [
                        { label: 'Income',   data: monthlyIncome,  backgroundColor: 'rgba(48,209,88,0.7)',  borderRadius: 6 },
                        { label: 'Expenses', data: monthlyExpense, backgroundColor: 'rgba(139,92,246,0.7)', borderRadius: 6 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    animation: { duration: 700 },
                    plugins: { legend: { labels: { color: textColor, font: { family: 'Outfit', size: 12 }, boxWidth: 12 } } },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Outfit' } } },
                        y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Outfit' }, callback: v => window.formatCurrency(v, true) } }
                    }
                }
            });
        }

        // --- Weekly Spending (Mon-Sun) ---
        if (weeklyChartInst) weeklyChartInst.destroy();
        const weeklyCtx = document.getElementById('weeklyChart')?.getContext('2d');
        if (weeklyCtx) {
            const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            const weekData = Array(7).fill(0);
            expenseTx.forEach(tx => {
                const d = new Date(tx.date);
                if (d >= weekStart) weekData[d.getDay()] += tx.amount;
            });

            const gradientBar = weeklyCtx.createLinearGradient(0,0,0,180);
            gradientBar.addColorStop(0, 'rgba(139,92,246,0.9)');
            gradientBar.addColorStop(1, 'rgba(59,130,246,0.5)');

            weeklyChartInst = new Chart(weeklyCtx, {
                type: 'bar',
                data: {
                    labels: days,
                    datasets: [{ label: 'Spent', data: weekData, backgroundColor: gradientBar, borderRadius: 8, borderSkipped: false }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    animation: { duration: 600 },
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Outfit' } } },
                        y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Outfit' }, callback: v => window.formatCurrency(v, true) } }
                    }
                }
            });
        }

        // --- Category Breakdown Doughnut ---
        if (categoryChartInst) categoryChartInst.destroy();
        const catCtx = document.getElementById('categoryChart')?.getContext('2d');
        const catMap = {};
        expenseTx.forEach(tx => {
            const key = tx.category;
            catMap[key] = (catMap[key] || 0) + tx.amount;
        });
        const catLabels = Object.keys(catMap);
        const catValues = Object.values(catMap);

        if (catCtx && catLabels.length > 0) {
            categoryChartInst = new Chart(catCtx, {
                type: 'polarArea',
                data: {
                    labels: catLabels,
                    datasets: [{
                        data: catValues,
                        backgroundColor: CHART_COLORS.slice(0, catLabels.length).map(c => c+'CC'),
                        borderColor: CHART_COLORS.slice(0, catLabels.length),
                        borderWidth: 1.5
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    animation: { duration: 800 },
                    plugins: {
                        legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Outfit', size: 11 }, boxWidth: 12, padding: 12 } },
                        tooltip: { callbacks: { label: (ctx) => ` ${fmt(ctx.raw)}` } }
                    },
                    scales: { r: { grid: { color: gridColor }, ticks: { display: false } } }
                }
            });
        }

        // --- Top Spending Categories (bar list) ---
        const topCatList = document.getElementById('top-categories-list');
        if (topCatList) {
            const sorted = Object.entries(catMap).sort((a,b) => b[1]-a[1]).slice(0, 6);
            const maxVal = sorted[0]?.[1] || 1;
            topCatList.innerHTML = sorted.length === 0
                ? `<p style="color: var(--text-secondary);">No expense data yet.</p>`
                : sorted.map(([cat, val], i) => {
                    const iconMatch = cat.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\S+)\s*(.*)/);
                    const icon = iconMatch ? iconMatch[1] : '💰';
                    const name = iconMatch ? (iconMatch[2] || cat) : cat;
                    const pct = ((val/maxVal)*100).toFixed(1);
                    return `<div class="top-cat-item">
                        <div class="top-cat-header">
                            <span class="top-cat-name">${icon} ${name}</span>
                            <span class="top-cat-amount">${fmt(val)}</span>
                        </div>
                        <div class="top-cat-bar">
                            <div class="top-cat-fill" style="width: 0%; background: ${CHART_COLORS[i % CHART_COLORS.length]};"
                                 data-target-width="${pct}%"></div>
                        </div>
                    </div>`;
                }).join('');
            // Animate bars after render
            setTimeout(() => {
                topCatList.querySelectorAll('.top-cat-fill').forEach(el => {
                    el.style.width = el.getAttribute('data-target-width');
                });
            }, 100);
        }

        // --- Spending Insights (smart messages) ---
        const insightsEl = document.getElementById('insights-content');
        if (insightsEl && allTx.length > 0) {
            const insights = [];

            if (totalExpenses > 0 && totalIncome > 0) {
                const savingRate = ((savings / totalIncome) * 100).toFixed(1);
                const emoji = savings >= 0 ? '🎉' : '⚠️';
                insights.push({ emoji, text: `Your savings rate is <strong>${savingRate}%</strong>. ${savings >= 0 ? 'Great discipline!' : 'You are spending more than you earn.'}` });
            }

            if (todaySpend > 0) {
                insights.push({ emoji: '📅', text: `You have spent <strong>${fmt(todaySpend)}</strong> today.` });
            }

            const sortedCats = Object.entries(catMap).sort((a,b) => b[1]-a[1]);
            if (sortedCats.length > 0) {
                const [topCat, topAmt] = sortedCats[0];
                const pct = totalExpenses > 0 ? ((topAmt/totalExpenses)*100).toFixed(1) : 0;
                insights.push({ emoji: '📊', text: `<strong>${topCat}</strong> is your top expense category at <strong>${pct}%</strong> of total spending.` });
            }

            const monthExpenses = expenseTx.filter(t => new Date(t.date) >= monthStart).reduce((s,t)=>s+t.amount, 0);
            const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const prevMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);
            const prevMonthExp   = expenseTx.filter(t => { const d = new Date(t.date); return d >= prevMonthStart && d <= prevMonthEnd; }).reduce((s,t)=>s+t.amount,0);
            if (prevMonthExp > 0) {
                const diff = monthExpenses - prevMonthExp;
                const pct  = Math.abs((diff/prevMonthExp)*100).toFixed(1);
                const up   = diff > 0;
                insights.push({ emoji: up ? '📈' : '📉', text: `Spending this month is <strong>${up ? 'up' : 'down'} ${pct}%</strong> compared to last month.` });
            }

            insightsEl.innerHTML = insights.length === 0
                ? '<p style="color: var(--text-secondary);">Add more transactions to generate insights.</p>'
                : insights.map(i => `<div class="insight-item"><span class="emoji">${i.emoji}</span><span>${i.text}</span></div>`).join('');
        } else if (insightsEl) {
            insightsEl.innerHTML = '<p style="color: var(--text-secondary);">Add transactions to see insights.</p>';
        }
    }

    // Hook analytics into data load — call after home dashboard to also refresh analytics if visible
    const _origLoadAndRender = loadAndRenderTransactions;
    async function loadAndRenderTransactions() {
        if (typeof expenseDB === 'undefined' || !expenseDB.db) {
            setTimeout(loadAndRenderTransactions, 100);
            return;
        }
        currentExpenses = await expenseDB.getAllExpenses();
        window.currentExpenses = currentExpenses;
        applyFiltersAndSort();
        // If analytics tab is currently visible, refresh it
        if (document.getElementById('analytics-view')?.classList.contains('active')) {
            renderAnalytics(currentExpenses);
        }
    }

    // Start DB fetch
    setTimeout(loadAndRenderTransactions, 100);

    // Handle Deep Linking (PWA App Shortcuts)
    setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        if (action === 'add' && typeof openNewTransactionModal === 'function') {
            openNewTransactionModal();
        } else if (action === 'reports') {
            const reportBtn = document.querySelector('.drawer-item[data-target="reports-view"]');
            if (reportBtn) reportBtn.click();
        }
    }, 400);
});
