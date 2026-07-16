/**
 * category-picker.js
 * Modern, touch-friendly category picker bottom sheet
 * Supports: built-in categories, search, custom category creation with emoji picker
 */

(function () {
    'use strict';

    // ─── Built-in categories ────────────────────────────────────
    const BUILTIN_CATEGORIES = [
        { emoji: '🍔', name: 'Food & Beverage' },
        { emoji: '🚗', name: 'Transport' },
        { emoji: '🛍️', name: 'Shopping' },
        { emoji: '🎬', name: 'Entertainment' },
        { emoji: '🏠', name: 'Housing' },
        { emoji: '💼', name: 'Salary' },
        { emoji: '🏥', name: 'Health' },
        { emoji: '📚', name: 'Education' },
        { emoji: '✈️', name: 'Travel' },
        { emoji: '💪', name: 'Fitness' },
        { emoji: '🎁', name: 'Gifts' },
        { emoji: '🔄', name: 'Other' },
    ];

    // Emojis available in the custom emoji picker
    const CUSTOM_EMOJIS = [
        '🌟','🔥','💎','🏆','🎯','💡','🌈','🐾','🌿','⚡',
        '🎪','🎵','📱','🍕','☕','🍺','🌙','❤️','🚀','🐶',
        '🌺','💰','🏡','🎮','🧴','🛒','🧘','🚴','🏊','🍎',
    ];

    const LS_KEY = 'ef_custom_categories';

    // ─── Storage helpers ────────────────────────────────────────
    function getCustomCategories() {
        try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
        catch { return []; }
    }
    function saveCustomCategories(list) {
        localStorage.setItem(LS_KEY, JSON.stringify(list));
    }

    // ─── Get all categories (builtin + custom) ──────────────────
    function getAllCategories() {
        return [...BUILTIN_CATEGORIES, ...getCustomCategories()];
    }

    // ─── Category picker state ──────────────────────────────────
    let currentValue = '🍔 Food & Beverage';
    let selectedCustomEmoji = CUSTOM_EMOJIS[0];

    // ─── DOM refs (populated on DOMContentLoaded) ───────────────
    let sheet, backdrop, closeBtn, grid, searchInput, addCustomBtn,
        customForm, emojiPicker, customNameInput, customSaveBtn,
        triggerBtn, triggerEmoji, triggerName, hiddenInput;

    // ─── Open / Close ───────────────────────────────────────────
    function openSheet() {
        searchInput.value = '';
        renderGrid(getAllCategories());
        sheet.classList.add('active');
        triggerBtn.classList.add('open');
        // Show current selection
        highlightSelected();
        // Scroll the selected item into view
        requestAnimationFrame(() => {
            const sel = grid.querySelector('.selected');
            if (sel) sel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            searchInput.focus();
        });
    }

    function closeSheet() {
        sheet.classList.remove('active');
        triggerBtn.classList.remove('open');
        // Collapse custom form
        customForm.style.display = 'none';
        addCustomBtn.style.display = '';
    }

    // ─── Render category grid ───────────────────────────────────
    function renderGrid(categories) {
        grid.innerHTML = '';
        if (categories.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-secondary); padding: 20px 0;">No categories found</p>';
            return;
        }
        categories.forEach(cat => {
            const value = `${cat.emoji} ${cat.name}`;
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'cat-grid-item' + (currentValue === value ? ' selected' : '');
            item.dataset.value = value;
            item.dataset.emoji = cat.emoji;
            item.dataset.name = cat.name;
            item.innerHTML = `
                <span class="cat-grid-emoji">${cat.emoji}</span>
                <span class="cat-grid-name">${cat.name}</span>
            `;
            item.addEventListener('click', () => selectCategory(cat.emoji, cat.name, item));
            grid.appendChild(item);
        });
    }

    function highlightSelected() {
        grid.querySelectorAll('.cat-grid-item').forEach(el => {
            el.classList.toggle('selected', el.dataset.value === currentValue);
        });
    }

    // ─── Select a category ──────────────────────────────────────
    function selectCategory(emoji, name, itemEl) {
        currentValue = `${emoji} ${name}`;

        // Update trigger display
        triggerEmoji.textContent = emoji;
        triggerName.textContent = name;

        // Update hidden input
        hiddenInput.value = currentValue;

        // Visual feedback: ripple-like flash
        grid.querySelectorAll('.cat-grid-item').forEach(el => el.classList.remove('selected'));
        if (itemEl) {
            itemEl.classList.add('selected');
            itemEl.style.transform = 'scale(0.9)';
            setTimeout(() => { itemEl.style.transform = ''; }, 150);
        }

        // Close after short delay so user sees the selection
        setTimeout(closeSheet, 220);

        // Also update the smart tags if phase7 hook is present
        if (typeof window._updateSmartTagsForCategory === 'function') {
            window._updateSmartTagsForCategory(currentValue);
        }

        // Update filter category dropdowns if any
        syncFilterCategoryDropdown();
    }

    // ─── Search ─────────────────────────────────────────────────
    function handleSearch(e) {
        const q = e.target.value.trim().toLowerCase();
        const all = getAllCategories();
        const filtered = q ? all.filter(c => c.name.toLowerCase().includes(q)) : all;
        renderGrid(filtered);
        highlightSelected();
    }

    // ─── Emoji picker for custom category ───────────────────────
    function renderEmojiPicker() {
        emojiPicker.innerHTML = '';
        selectedCustomEmoji = CUSTOM_EMOJIS[0];
        CUSTOM_EMOJIS.forEach((em, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'cat-emoji-option' + (i === 0 ? ' selected' : '');
            btn.textContent = em;
            btn.addEventListener('click', () => {
                emojiPicker.querySelectorAll('.cat-emoji-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedCustomEmoji = em;
            });
            emojiPicker.appendChild(btn);
        });
    }

    // ─── Save custom category ────────────────────────────────────
    function saveCustomCategory() {
        const name = customNameInput.value.trim();
        if (!name) {
            customNameInput.focus();
            customNameInput.style.borderColor = '#FF453A';
            setTimeout(() => { customNameInput.style.borderColor = ''; }, 1000);
            return;
        }
        const all = getAllCategories();
        if (all.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            window.showToast?.('Category already exists', 'warning');
            return;
        }
        const newCat = { emoji: selectedCustomEmoji, name };
        const customs = getCustomCategories();
        customs.push(newCat);
        saveCustomCategories(customs);

        // Close form, re-render grid, select the new category
        customForm.style.display = 'none';
        addCustomBtn.style.display = '';
        customNameInput.value = '';
        renderGrid(getAllCategories());
        selectCategory(newCat.emoji, newCat.name, null);

        // Re-highlight after render
        setTimeout(highlightSelected, 50);
        window.showToast?.(`Category "${name}" created!`, 'success');

        // Update filter dropdowns
        syncFilterCategoryDropdown();
    }

    // ─── Keep filter <select> in sync with custom categories ────
    function syncFilterCategoryDropdown() {
        const sel = document.getElementById('filter-category');
        const budgetSel = document.getElementById('budget-cat-select');
        const all = getAllCategories();

        [sel, budgetSel].forEach(selectEl => {
            if (!selectEl) return;
            // Remove existing dynamic options (keep "All Categories" or base options)
            const base = selectEl.querySelector('option[value="all"]');
            const existing = Array.from(selectEl.options).map(o => o.value);

            all.forEach(cat => {
                const val = `${cat.emoji} ${cat.name}`;
                if (!existing.includes(val)) {
                    const opt = document.createElement('option');
                    opt.value = val;
                    opt.textContent = val;
                    selectEl.appendChild(opt);
                }
            });
        });
    }

    // ─── Pre-select category when editing a transaction ─────────
    function setPickerValue(value) {
        if (!value) return;
        currentValue = value;
        // Parse emoji and name
        const match = value.match(/^(\S+(?:\uFE0F)?)\s+(.*)/u);
        if (match) {
            triggerEmoji.textContent = match[1];
            triggerName.textContent = match[2];
        } else {
            triggerEmoji.textContent = '🏷️';
            triggerName.textContent = value;
        }
        hiddenInput.value = value;
    }

    // ─── Expose API for app.js / editTransaction ────────────────
    window.categoryPicker = {
        getValue: () => hiddenInput ? hiddenInput.value : currentValue,
        setValue: setPickerValue,
        getAllCategories,
        syncFilterCategoryDropdown,
    };

    // ─── Init ────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        sheet        = document.getElementById('cat-picker-sheet');
        backdrop     = document.getElementById('cat-sheet-backdrop');
        closeBtn     = document.getElementById('cat-sheet-close');
        grid         = document.getElementById('cat-grid');
        searchInput  = document.getElementById('cat-search-input');
        addCustomBtn = document.getElementById('cat-add-custom-btn');
        customForm   = document.getElementById('cat-custom-form');
        emojiPicker  = document.getElementById('cat-emoji-picker');
        customNameInput = document.getElementById('cat-custom-name');
        customSaveBtn   = document.getElementById('cat-custom-save-btn');
        triggerBtn      = document.getElementById('cat-picker-trigger');
        triggerEmoji    = document.getElementById('cat-picker-display-emoji');
        triggerName     = document.getElementById('cat-picker-display-name');
        hiddenInput     = document.getElementById('tx-category');

        if (!sheet || !triggerBtn || !hiddenInput) return;

        // Set initial hidden input value to match displayed default
        hiddenInput.value = currentValue;

        // Open sheet on trigger click
        triggerBtn.addEventListener('click', openSheet);

        // Close actions
        closeBtn.addEventListener('click', closeSheet);
        backdrop.addEventListener('click', closeSheet);

        // Search
        searchInput.addEventListener('input', handleSearch);

        // Show custom form
        addCustomBtn.addEventListener('click', () => {
            customForm.style.display = 'block';
            addCustomBtn.style.display = 'none';
            renderEmojiPicker();
            customNameInput.value = '';
            setTimeout(() => customNameInput.focus(), 150);
        });

        // Save custom category
        customSaveBtn.addEventListener('click', saveCustomCategory);
        customNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); saveCustomCategory(); }
        });

        // Render initial grid
        renderGrid(getAllCategories());

        // Populate filter-category dropdown with all categories
        syncFilterCategoryDropdown();
        // Also sync again slightly later once wallets/custom cats load
        setTimeout(syncFilterCategoryDropdown, 600);
    });
})();
