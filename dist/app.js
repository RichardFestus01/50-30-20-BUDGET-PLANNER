// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    let state = {
        totalIncome: 0,
        incomes: [],
        currency: 'NGN', // Default currency
        budget: {
            needs: 0,
            wants: 0,
            savings: 0,
        },
        expenses: [],
    };

    // --- DOM ELEMENT SELECTORS ---
    const currentDateEl = document.getElementById('current-date');
    const currentTimeEl = document.getElementById('current-time');

    const incomeAmountInput = document.getElementById('income-amount');
    const incomeDescInput = document.getElementById('income-desc');
    const addIncomeBtn = document.getElementById('add-income-btn');
    const incomeListEl = document.getElementById('income-list');

    const totalIncomeAmountEl = document.getElementById('total-income-amount');
    const needsAmountEl = document.getElementById('needs-amount');
    const wantsAmountEl = document.getElementById('wants-amount');
    const needsRemainingEl = document.getElementById('needs-remaining');
    const wantsRemainingEl = document.getElementById('wants-remaining');
    const savingsAmountEl = document.getElementById('savings-amount');
    const savingsRemainingEl = document.getElementById('savings-remaining');

    const expenseDescInput = document.getElementById('expense-desc');
    const expenseAmountInput = document.getElementById('expense-amount');
    const expenseCategorySelect = document.getElementById('expense-category');
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const expenseListEl = document.getElementById('expense-list');

    const needsBar = document.getElementById('needs-bar');
    const needsPercentage = document.getElementById('needs-percentage');
    const wantsBar = document.getElementById('wants-bar');
    const wantsPercentage = document.getElementById('wants-percentage');
    const savingsBar = document.getElementById('savings-bar');
    const savingsPercentage = document.getElementById('savings-percentage');

    // Export buttons
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');
    const currencySelectEl = document.getElementById('currency-select');

    // --- LOCAL STORAGE ---
    const STORAGE_KEY = 'budgetPlannerState';

    // --- HELPER FUNCTIONS ---

    /**
     * Updates the date and time display continuously.
     */
    const updateDateTime = () => {
        const now = new Date();
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = now.toLocaleDateString('en-US', dateOptions);
        currentTimeEl.textContent = now.toLocaleTimeString('en-US');
    };

    // Initialize clock and set it to update every second
    updateDateTime();
    setInterval(updateDateTime, 1000);

    /**
     * Formats a number into a currency string (e.g., $1,234.56)
     * @param {number} amount - The number to format.
     * @returns {string} The formatted currency string.
     */
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { // Using 'en-US' locale for broad compatibility
            style: 'currency',
            currency: state.currency,
        }).format(amount);
    };

    /**
     * Saves the current state to localStorage.
     */
    const saveState = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    };

    /**
     * Loads state from localStorage.
     */
    const loadState = () => {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            // Safely assign loaded data to the state
            state.incomes = parsedState.incomes || [];
            state.expenses = parsedState.expenses || [];
            state.currency = parsedState.currency || 'NGN';
        }
    };

    // --- CORE LOGIC FUNCTIONS ---

    /**
     * Recalculates total income and budget allocations.
     */
    const recalculateBudget = () => {
        const totalIncome = state.incomes.reduce((sum, income) => sum + income.amount, 0);
        state.totalIncome = totalIncome;

        state.budget.needs = totalIncome * 0.50;
        state.budget.wants = totalIncome * 0.30;
        state.budget.savings = totalIncome * 0.20;

        updateUI();
    };

    /**
     * Adds a new income to the state and recalculates the budget.
     */
    const addIncome = () => {
        const description = incomeDescInput.value.trim();
        const amount = parseFloat(incomeAmountInput.value);

        if (!description) {
            alert('Please enter an income source description.');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid positive income amount.');
            return;
        }

        const newIncome = {
            id: Date.now(),
            description,
            amount,
        };

        state.incomes.push(newIncome);

        // Clear input fields
        incomeDescInput.value = '';
        incomeAmountInput.value = '';

        recalculateBudget();
    };

    /**
     * Adds a new expense to the state and updates the UI.
     */
    const addExpense = () => {
        const description = expenseDescInput.value.trim();
        const amount = parseFloat(expenseAmountInput.value);
        const category = expenseCategorySelect.value;

        if (!description) {
            alert('Please enter an expense description.');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid expense amount.');
            return;
        }
        if (state.totalIncome === 0) {
            alert('Please calculate your budget first before adding expenses.');
            return;
        }

        const newExpense = {
            id: Date.now(), // Unique ID for the expense
            description,
            amount,
            category,
        };

        state.expenses.push(newExpense);
        updateUI();

        // Clear input fields
        expenseDescInput.value = '';
        expenseAmountInput.value = '';
    };

    /**
     * Deletes an expense from the state and updates the UI.
     * @param {number} id - The ID of the expense to delete.
     */
    const deleteExpense = (id) => {
        state.expenses = state.expenses.filter(expense => expense.id !== id);
        updateUI();
    };

    /**
     * Deletes an income from the state and recalculates the budget.
     * @param {number} id - The ID of the income to delete.
     */
    const deleteIncome = (id) => {
        state.incomes = state.incomes.filter(income => income.id !== id);
        recalculateBudget();
    };

    // --- EXPORT FUNCTIONS ---

    /**
     * Generates and downloads a CSV report of the current budget state.
     */
    const exportToCSV = () => {
        if (state.totalIncome === 0) {
            alert('Please add income before exporting.');
            return;
        }

        // Helper to escape commas in strings
        const escape = (str) => `"${String(str).replace(/"/g, '""')}"`;

        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Summary Section
        csvContent += "Category,Budgeted,Remaining\n";
        csvContent += `Total Income,${escape(formatCurrency(state.totalIncome))},\n`;
        const needsRemaining = state.budget.needs - state.expenses.filter(e => e.category === 'needs').reduce((s, e) => s + e.amount, 0);
        const wantsRemaining = state.budget.wants - state.expenses.filter(e => e.category === 'wants').reduce((s, e) => s + e.amount, 0);
        csvContent += `Needs (50%),${escape(formatCurrency(state.budget.needs))},${escape(formatCurrency(needsRemaining))}\n`;
        csvContent += `Wants (30%),${escape(formatCurrency(state.budget.wants))},${escape(formatCurrency(wantsRemaining))}\n`;
        csvContent += `Savings (20%),${escape(formatCurrency(state.budget.savings))},\n\n`;

        // Income Details
        csvContent += "Income Source,Amount\n";
        state.incomes.forEach(income => {
            csvContent += `${escape(income.description)},${escape(formatCurrency(income.amount))}\n`;
        });
        csvContent += "\n";

        // Expense Details
        csvContent += "Expense,Category,Amount\n";
        state.expenses.forEach(expense => {
            csvContent += `${escape(expense.description)},${escape(expense.category)},${escape(formatCurrency(expense.amount))}\n`;
        });

        // Create and trigger download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "budget_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    /**
     * Clears all data from the state and localStorage after confirmation.
     */
    const clearAllData = () => {
        const isConfirmed = confirm('Are you sure you want to delete all data? This action cannot be undone.');
        if (isConfirmed) {
            // Reset the state object to its initial values
            state.incomes = [];
            state.expenses = [];
            
            // Recalculate the budget (which will be all zeros) and update the UI.
            // The updateUI function will then save the new empty state to localStorage.
            recalculateBudget();
            alert('All data has been cleared.');
        }
    };

    /**
     * Handles the change of currency.
     */
    const handleCurrencyChange = () => {
        state.currency = currencySelectEl.value;
        // Re-render the entire UI to reflect the new currency
        updateUI();
    };

    // --- UI UPDATE FUNCTIONS ---

    /**
     * Updates all parts of the UI based on the current state.
     */
    const updateUI = () => {
        // Update budget breakdown amounts
        // Set the selected currency in the dropdown
        currencySelectEl.value = state.currency;

        totalIncomeAmountEl.textContent = formatCurrency(state.totalIncome);
        needsAmountEl.textContent = formatCurrency(state.budget.needs);
        wantsAmountEl.textContent = formatCurrency(state.budget.wants);
        savingsAmountEl.textContent = formatCurrency(state.budget.savings);

        // Update income list
        incomeListEl.innerHTML = ''; // Clear existing list
        state.incomes.forEach(income => {
            const item = document.createElement('div');
            item.className = 'flex justify-between items-center p-2 border-b';
            item.innerHTML = `
                <span>${income.description}</span>
                <span class="font-semibold">${formatCurrency(income.amount)}
                    <button data-id="${income.id}" class="delete-income-btn ml-2 text-red-500 hover:text-red-700">&times;</button>
                </span>
            `;
            incomeListEl.appendChild(item);
        });

        // Update expense list
        expenseListEl.innerHTML = ''; // Clear existing list
        state.expenses.forEach(expense => {
            const item = document.createElement('div');
            item.className = 'flex justify-between items-center p-2 border-b';
            item.innerHTML = `
                <span>${expense.description} (${expense.category})</span>
                <span class="font-semibold">${formatCurrency(expense.amount)} 
                    <button data-id="${expense.id}" class="delete-btn ml-2 text-red-500 hover:text-red-700">&times;</button>
                </span>
            `;
            expenseListEl.appendChild(item);
        });

        // Update progress bars
        const totalNeedsSpent = state.expenses
            .filter(e => e.category === 'needs')
            .reduce((sum, e) => sum + e.amount, 0);
        const totalWantsSpent = state.expenses
            .filter(e => e.category === 'wants')
            .reduce((sum, e) => sum + e.amount, 0);
        const totalSavingsLogged = state.expenses
            .filter(e => e.category === 'savings')
            .reduce((sum, e) => sum + e.amount, 0);

        const needsPercent = state.budget.needs > 0 ? (totalNeedsSpent / state.budget.needs) * 100 : 0;
        const wantsPercent = state.budget.wants > 0 ? (totalWantsSpent / state.budget.wants) * 100 : 0;
        const savingsPercent = state.budget.savings > 0 ? (totalSavingsLogged / state.budget.savings) * 100 : 0;

        needsBar.style.width = `${Math.min(needsPercent, 100)}%`;
        needsPercentage.textContent = `${Math.round(needsPercent)}%`;

        wantsBar.style.width = `${Math.min(wantsPercent, 100)}%`;
        wantsPercentage.textContent = `${Math.round(wantsPercent)}%`;

        savingsBar.style.width = `${Math.min(savingsPercent, 100)}%`;
        savingsPercentage.textContent = `${Math.round(savingsPercent)}%`;

        // Update remaining amounts
        const needsRemaining = state.budget.needs - totalNeedsSpent;
        const wantsRemaining = state.budget.wants - totalWantsSpent;
        const savingsRemaining = state.budget.savings - totalSavingsLogged;

        needsRemainingEl.textContent = formatCurrency(needsRemaining);
        wantsRemainingEl.textContent = formatCurrency(wantsRemaining);
        savingsRemainingEl.textContent = formatCurrency(savingsRemaining);

        // Change color if remaining is negative
        needsRemainingEl.parentElement.classList.toggle('text-red-600', needsRemaining < 0);
        wantsRemainingEl.parentElement.classList.toggle('text-red-600', wantsRemaining < 0);
        savingsRemainingEl.parentElement.classList.toggle('text-red-600', savingsRemaining < 0);

        // Save state after every UI update
        saveState();
    };

    // --- EVENT LISTENERS ---
    addIncomeBtn.addEventListener('click', addIncome);
    addExpenseBtn.addEventListener('click', addExpense);

    // Export listeners
    exportCsvBtn.addEventListener('click', exportToCSV);
    clearDataBtn.addEventListener('click', clearAllData);
    currencySelectEl.addEventListener('change', handleCurrencyChange);

    // Use event delegation for expense delete buttons
    expenseListEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const expenseId = parseInt(e.target.getAttribute('data-id'));
            deleteExpense(expenseId);
        }
    });

    // Use event delegation for income delete buttons
    incomeListEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-income-btn')) {
            const incomeId = parseInt(e.target.getAttribute('data-id'));
            deleteIncome(incomeId);
        }
    });

    // --- INITIALIZATION ---
    // Load saved data from localStorage
    loadState();
    // Recalculate and render the UI with the loaded data
    recalculateBudget();
});