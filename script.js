let monthlyBudget = 2000; // default budget
let monthlyTrendsChart = null;

// === DOM references ===
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginSection = document.getElementById('loginSection');
const dashboard = document.getElementById('dashboard');
const transactionFormSection = document.getElementById('transactionForm');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const logoutBtn = document.getElementById('logoutBtn');
const userNameDisplay = document.getElementById('userName');
const transactionList = document.getElementById('transactionList');
const currentBalanceEl = document.getElementById('currentBalance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpensesEl = document.getElementById('totalExpenses');
const filterTypeEl = document.getElementById('filterType');
const searchInput = document.getElementById('searchInput');
const addTransactionBtn = document.getElementById('addTransactionBtn');
const themeToggle = document.getElementById('themeToggle');
const authMessage = document.getElementById('authMessage');

// Transaction form elements
const transactionFormElement = document.getElementById('transactionFormElement');
const backToDashboard = document.getElementById('backToDashboard');
const cancelTransaction = document.getElementById('cancelTransaction');
const transactionMessage = document.getElementById('transactionMessage');
const addAnotherBtn = document.getElementById('addAnotherBtn');

// New feature elements
const exportDataBtn = document.getElementById('exportDataBtn');
const toggleAchievements = document.getElementById('toggleAchievements');
const addGoalBtn = document.getElementById('addGoalBtn');
const totalTransactionsEl = document.getElementById('totalTransactions');
const streakDaysEl = document.getElementById('streakDays');
const achievementCountEl = document.getElementById('achievementCount');

// Chart references
let incomeExpenseChart = null;
let expensePieChart = null;

let transactions = [];
let currentUser = '';
let userStats = {
  totalTransactions: 0,
  streakDays: 0,
  achievements: []
};

// === Helpers ===
function formatCurrency(value) {
  const fixed = Number(value || 0).toFixed(2);
  return `$${fixed}`;
}

// === Dashboard Update ===
function updateDashboard() {
  const ft = (filterTypeEl && filterTypeEl.value) || 'all';
  const searchQuery = (searchInput?.value || '').toLowerCase();

  const filtered = transactions.filter((t) => {
    const typeMatch = ft === 'all' || (t.type || '').toLowerCase() === ft;
    const searchMatch =
      !searchQuery ||
      (t.description || '').toLowerCase().includes(searchQuery) ||
      (t.type || '').toLowerCase().includes(searchQuery);
    return typeMatch && searchMatch;
  });

  const totals = filtered.reduce(
    (acc, t) => {
      const amount = Number(t.amount) || 0;
      const type = (t.type || '').toLowerCase();
      if (type === 'income') acc.income += amount;
      else if (type === 'expense') acc.expense += amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const balance = totals.income - totals.expense;
  currentBalanceEl.textContent = formatCurrency(balance);
  totalIncomeEl.textContent = formatCurrency(totals.income);
  totalExpensesEl.textContent = formatCurrency(totals.expense);

  // === Budget Alerts ===
  const monthExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  if (monthExpenses > monthlyBudget) {
    document.getElementById('budgetStatus').textContent =
      `⚠️ Over budget by ${formatCurrency(monthExpenses - monthlyBudget)}`;
    document.getElementById('budgetStatus').style.color = 'red';
  } else {
    document.getElementById('budgetStatus').textContent =
      `✅ Within budget. Remaining: ${formatCurrency(monthlyBudget - monthExpenses)}`;
    document.getElementById('budgetStatus').style.color = 'green';
  }

  // Update charts
  updateCharts(totals);
  updateHealthMetrics(totals);
  
  // Show/hide "Add Another Transaction" button based on transaction count
  if (transactions && transactions.length > 0) {
    addAnotherBtn.style.display = 'inline-block';
  } else {
    addAnotherBtn.style.display = 'none';
  }

  // Update user stats
  updateUserStats();

  // Render transactions
  transactionList.innerHTML = '';
  if (filtered.length === 0) {
    const li = document.createElement('li');
    li.innerHTML = `
      <div style="text-align: center; color: #666; font-style: italic; width: 100%;">
        No transactions found. Add your first transaction to get started!
      </div>
    `;
    li.style.background = 'rgba(255, 255, 255, 0.5)';
    li.style.border = '1px dashed rgba(0, 191, 255, 0.3)';
    transactionList.appendChild(li);
  } else {
    filtered.forEach((t) => {
      const li = document.createElement('li');
      const amount = Number(t.amount) || 0;
      const type = (t.type || '').toLowerCase();
      const category = t.category ? ` • ${t.category}` : '';
      const date = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '';
      
      // Color coding for income vs expense
      const typeColor = type === 'income' ? '#28a745' : '#dc3545';
      const typeIcon = type === 'income' ? '💰' : '💸';
      
      li.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.3rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.2rem;">${typeIcon}</span>
            <span style="color: ${typeColor}; font-weight: bold; text-transform: uppercase;">${type}</span>
            ${category ? `<span style="color: #666; font-size: 0.9rem;">${category}</span>` : ''}
          </div>
          <div style="font-weight: 500; color: #2c3e50;">${t.description || ''}</div>
          ${date ? `<div style="font-size: 0.8rem; color: #888;">${date}</div>` : ''}
        </div>
        <div style="font-size: 1.2rem; font-weight: bold; color: ${typeColor};">
          ${formatCurrency(amount)}
        </div>
      `;
      transactionList.appendChild(li);
    });
  }
}

// === Chart Functions ===
function updateCharts(totals) {
  updateIncomeExpenseChart(totals);
  updateExpensePieChart();
}

function updateIncomeExpenseChart(totals) {
  const ctx = document.getElementById('incomeExpenseChart');
  if (!ctx) return;

  if (incomeExpenseChart) {
    incomeExpenseChart.destroy();
  }

  incomeExpenseChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Income', 'Expenses'],
      datasets: [{
        label: 'Amount ($)',
        data: [totals.income, totals.expense],
        backgroundColor: [
          'rgba(76, 175, 80, 0.8)',
          'rgba(244, 67, 54, 0.8)'
        ],
        borderColor: [
          'rgba(76, 175, 80, 1)',
          'rgba(244, 67, 54, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function updateExpensePieChart() {
  const ctx = document.getElementById('expensePieChart');
  if (!ctx) return;

  // Group expenses by description for pie chart
  const expenseGroups = {};
  transactions.forEach(t => {
    if (t.type === 'expense') {
      const desc = t.description || 'Other';
      expenseGroups[desc] = (expenseGroups[desc] || 0) + Number(t.amount);
    }
  });

  const labels = Object.keys(expenseGroups);
  const data = Object.values(expenseGroups);

  if (expensePieChart) {
    expensePieChart.destroy();
  }

  if (labels.length === 0) {
    // Show empty state
    expensePieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['No Expenses'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(200, 200, 200, 0.5)'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
    return;
  }

  const colors = [
    'rgba(255, 99, 132, 0.8)',
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 205, 86, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)'
  ];

  expensePieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: colors.slice(0, labels.length).map(c => c.replace('0.8', '1')),
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        }
      }
    }
  });
}

function updateHealthMetrics(totals) {
  const savingsRate = totals.income > 0 ? ((totals.income - totals.expense) / totals.income * 100) : 0;
  const expenseRatio = totals.income > 0 ? (totals.expense / totals.income * 100) : 0;

  document.getElementById('savingsRate').textContent = `${Math.max(0, savingsRate).toFixed(1)}%`;
  document.getElementById('expenseRatio').textContent = `${Math.min(100, expenseRatio).toFixed(1)}%`;

  // Animate progress bars
  setTimeout(() => {
    document.getElementById('savingsProgress').style.width = `${Math.max(0, Math.min(100, savingsRate))}%`;
    document.getElementById('expenseProgress').style.width = `${Math.min(100, expenseRatio)}%`;
  }, 100);
}

// === Impressive User Features ===
function updateUserStats() {
  userStats.totalTransactions = transactions.length;
  userStats.streakDays = calculateStreakDays();
  
  // Animate stat numbers
  animateNumber(totalTransactionsEl, userStats.totalTransactions);
  animateNumber(streakDaysEl, userStats.streakDays);
  animateNumber(achievementCountEl, userStats.achievements.length);
  
  // Check for new achievements
  checkAchievements();
}

function animateNumber(element, targetNumber) {
  const startNumber = parseInt(element.textContent) || 0;
  const duration = 1000;
  const startTime = performance.now();
  
  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentNumber = Math.floor(startNumber + (targetNumber - startNumber) * progress);
    
    element.textContent = currentNumber;
    
    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    }
  }
  
  requestAnimationFrame(updateNumber);
}

function calculateStreakDays() {
  if (transactions.length === 0) return 0;
  
  const today = new Date();
  const transactionDates = transactions
    .map(t => new Date(t.createdAt))
    .filter(date => !isNaN(date))
    .sort((a, b) => b - a);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  for (let i = 0; i < transactionDates.length; i++) {
    const transactionDate = new Date(transactionDates[i]);
    const diffTime = currentDate - transactionDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      streak++;
      currentDate = transactionDate;
    } else {
      break;
    }
  }
  
  return streak;
}

function checkAchievements() {
  const achievements = [
    {
      id: 'first-transaction',
      condition: () => transactions.length >= 1,
      title: 'First Transaction',
      description: 'Added your first transaction',
      icon: '🎉'
    },
    {
      id: 'savings-master',
      condition: () => {
        const totals = transactions.reduce((acc, t) => {
          const amount = Number(t.amount) || 0;
          if (t.type === 'income') acc.income += amount;
          else if (t.type === 'expense') acc.expense += amount;
          return acc;
        }, { income: 0, expense: 0 });
        return (totals.income - totals.expense) >= 1000;
      },
      title: 'Savings Master',
      description: 'Save $1000 or more',
      icon: '💰'
    },
    {
      id: 'transaction-streak',
      condition: () => calculateStreakDays() >= 7,
      title: 'Transaction Streak',
      description: 'Add transactions for 7 days',
      icon: '🔥'
    },
    {
      id: 'big-spender',
      condition: () => {
        const maxExpense = Math.max(...transactions
          .filter(t => t.type === 'expense')
          .map(t => Number(t.amount) || 0), 0);
        return maxExpense >= 500;
      },
      title: 'Big Spender',
      description: 'Make a single expense of $500+',
      icon: '💸'
    }
  ];
  
  achievements.forEach(achievement => {
    const element = document.querySelector(`[data-achievement="${achievement.id}"]`);
    if (element && achievement.condition() && !userStats.achievements.includes(achievement.id)) {
      unlockAchievement(achievement, element);
    }
  });
}

function unlockAchievement(achievement, element) {
  userStats.achievements.push(achievement.id);
  element.classList.add('earned');
  element.querySelector('.achievement-status').textContent = '✅';
  
  // Show achievement notification
  showAchievementNotification(achievement);
  
  // Add celebration animation
  element.classList.add('achievement-unlocked');
  setTimeout(() => {
    element.classList.remove('achievement-unlocked');
  }, 3000);
}

function showAchievementNotification(achievement) {
  const notification = document.createElement('div');
  notification.className = 'achievement-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">${achievement.icon}</div>
      <div class="notification-text">
        <div class="notification-title">Achievement Unlocked!</div>
        <div class="notification-desc">${achievement.title}</div>
      </div>
    </div>
  `;
  
  // Add notification styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    padding: 1rem;
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
    z-index: 1000;
    animation: slideInRight 0.5s ease, fadeOut 0.5s ease 4.5s forwards;
    max-width: 300px;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

function exportData() {
  const data = {
    user: currentUser,
    transactions: transactions,
    stats: userStats,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentUser}_financial_data_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // Show success message
  showNotification('Data exported successfully! 📊', 'success');
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

function addFinancialGoal(title, target) {
  const goalsContainer = document.getElementById('goalsContainer');
  const goalItem = document.createElement('div');
  goalItem.className = 'goal-item';
  goalItem.innerHTML = `
    <div class="goal-info">
      <div class="goal-title">${title}</div>
      <div class="goal-target">Target: ${formatCurrency(target)}</div>
    </div>
    <div class="goal-progress">
      <div class="progress-bar">
        <div class="progress-fill" style="width: 0%"></div>
      </div>
      <div class="progress-text">0% Complete</div>
    </div>
  `;
  
  goalsContainer.appendChild(goalItem);
  
  // Animate the new goal
  goalItem.style.opacity = '0';
  goalItem.style.transform = 'translateY(20px)';
  
  setTimeout(() => {
    goalItem.style.transition = 'all 0.5s ease';
    goalItem.style.opacity = '1';
    goalItem.style.transform = 'translateY(0)';
  }, 100);
  
  showNotification(`Goal "${title}" added! 🎯`, 'success');
}

// === Fetch from backend ===
async function loadTransactions() {
  try {
    // Check if user is still logged in
    if (!currentUser) {
      console.log('No user logged in, skipping transaction load');
      return;
    }

    const params = new URLSearchParams({ user: currentUser });
    const res = await fetch(
      `http://localhost:3000/api/transactions?${params.toString()}`
    );
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load: ${res.status}`);
    }
    
    transactions = await res.json();
    updateDashboard();
  } catch (err) {
    console.error('Load transactions error:', err);
    // Don't show alert for load errors, just log them
    transactions = [];
    updateDashboard();
  }
}

// === Save to backend ===
async function addTransaction(type, amount, description, category = '') {
  try {
    // Check if user is still logged in
    if (!currentUser) {
      showTransactionMessage('Please log in to add transactions.', 'error');
      return false;
    }

    const res = await fetch('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: currentUser, 
        type, 
        amount, 
        description,
        category 
      }),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to save: ${res.status}`);
    }
    
    const newTransaction = await res.json();
    transactions.push(newTransaction);
    updateDashboard();
    return true;
  } catch (err) {
    console.error('Transaction error:', err);
    showTransactionMessage(`Could not save the transaction: ${err.message}`, 'error');
    return false;
  }
}

function showTransactionMessage(message, type) {
  transactionMessage.textContent = message;
  transactionMessage.className = `transaction-message ${type}`;
  setTimeout(() => {
    transactionMessage.textContent = '';
    transactionMessage.className = 'transaction-message';
  }, 5000);
}

// === Authentication Functions ===
async function registerUser(username, password) {
  try {
    const res = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      showAuthMessage('Registration successful! You can now log in.', 'success');
      return true;
    } else {
      showAuthMessage(data.error || 'Registration failed', 'error');
      return false;
    }
  } catch (err) {
    console.error(err);
    showAuthMessage('Network error during registration', 'error');
    return false;
  }
}

async function loginUser(username, password) {
  try {
    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      showAuthMessage('Login successful!', 'success');
      return data.username;
    } else {
      showAuthMessage(data.error || 'Login failed', 'error');
      return null;
    }
  } catch (err) {
    console.error(err);
    showAuthMessage('Network error during login', 'error');
    return null;
  }
}

function showAuthMessage(message, type) {
  authMessage.textContent = message;
  authMessage.className = `auth-message ${type}`;
  setTimeout(() => {
    authMessage.textContent = '';
    authMessage.className = 'auth-message';
  }, 3000);
}

function showDashboard(username) {
  // Hide login section and transaction form completely
  loginSection.style.display = 'none';
  transactionFormSection.style.display = 'none';
  dashboard.hidden = false;
  logoutBtn.style.display = 'inline-block';
  userNameDisplay.textContent = username;
  currentUser = username;
  loadTransactions();
  console.log('Dashboard shown for user:', username);
}

function ensureDashboardVisible() {
  // Ensure dashboard is visible and user session is maintained
  if (currentUser) {
    dashboard.hidden = false;
    loginSection.style.display = 'none';
    transactionFormSection.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    userNameDisplay.textContent = currentUser;
    
    // Show "Add Another Transaction" button if there are transactions
    if (transactions && transactions.length > 0) {
      addAnotherBtn.style.display = 'inline-block';
    } else {
      addAnotherBtn.style.display = 'none';
    }
    
    console.log('Dashboard visibility ensured for user:', currentUser);
    return true;
  } else {
    console.warn('Cannot ensure dashboard visibility - no current user');
    return false;
  }
}

function showTransactionForm() {
  // Hide dashboard and show transaction form
  dashboard.hidden = true;
  transactionFormSection.style.display = 'flex';
  // Clear any previous messages
  transactionMessage.textContent = '';
  transactionMessage.className = 'transaction-message';
}

function hideTransactionForm() {
  // Hide transaction form and show dashboard
  transactionFormSection.style.display = 'none';
  dashboard.hidden = false;
  
  // Clear form
  transactionFormElement.reset();
  transactionMessage.textContent = '';
  transactionMessage.className = 'transaction-message';
  
  // Ensure user is still logged in and dashboard is properly shown
  if (currentUser) {
    logoutBtn.style.display = 'inline-block';
    userNameDisplay.textContent = currentUser;
    loginSection.style.display = 'none';
    console.log('Transaction form hidden, dashboard shown for user:', currentUser);
  } else {
    console.warn('No current user found when hiding transaction form');
  }
}

// === Tab Management ===
function switchTab(activeTab) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  activeTab.classList.add('active');

  // Update forms
  document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
  
  if (activeTab.id === 'loginTab') {
    document.getElementById('loginForm').classList.add('active');
  } else {
    document.getElementById('registerForm').classList.add('active');
  }
}

// === Event Listeners ===
loginTab.addEventListener('click', () => switchTab(loginTab));
registerTab.addEventListener('click', () => switchTab(registerTab));

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('usernameInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();

  if (!username || !password) {
    showAuthMessage('Please enter both username and password.', 'error');
    return;
  }

  const loggedInUser = await loginUser(username, password);
  if (loggedInUser) {
    showDashboard(loggedInUser);
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('regUsernameInput').value.trim();
  const password = document.getElementById('regPasswordInput').value.trim();
  const confirmPassword = document.getElementById('confirmPasswordInput').value.trim();

  if (!username || !password || !confirmPassword) {
    showAuthMessage('Please fill in all fields.', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showAuthMessage('Passwords do not match.', 'error');
    return;
  }

  if (password.length < 4) {
    showAuthMessage('Password must be at least 4 characters long.', 'error');
    return;
  }

  const success = await registerUser(username, password);
  if (success) {
    // Clear the form after successful registration
    document.getElementById('regUsernameInput').value = '';
    document.getElementById('regPasswordInput').value = '';
    document.getElementById('confirmPasswordInput').value = '';
    // Switch to login tab
    switchTab(loginTab);
  }
});

// === Transaction Form Event Listeners ===
addTransactionBtn.addEventListener('click', () => {
  showTransactionForm();
});

addAnotherBtn.addEventListener('click', () => {
  showTransactionForm();
});

backToDashboard.addEventListener('click', () => {
  hideTransactionForm();
});

cancelTransaction.addEventListener('click', () => {
  hideTransactionForm();
});

transactionFormElement.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const type = document.getElementById('transactionType').value;
  const amount = parseFloat(document.getElementById('transactionAmount').value);
  const description = document.getElementById('transactionDescription').value.trim();
  const category = document.getElementById('transactionCategory').value;
  
  // Validate form
  if (!type || isNaN(amount) || amount <= 0 || !description) {
    showTransactionMessage('Please fill in all required fields with valid data.', 'error');
    return;
  }
  
  // Disable submit button to prevent double submission
  const submitBtn = e.target.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';
  
  try {
    const success = await addTransaction(type, amount, description, category);
    if (success) {
      showTransactionMessage('Transaction added successfully! Redirecting to dashboard...', 'success');
      
      // Clear form and go back to dashboard after a short delay
      setTimeout(() => {
        // Ensure we're still logged in
        if (!currentUser) {
          console.error('User session lost during transaction submission');
          showTransactionMessage('Session expired. Please log in again.', 'error');
          return;
        }
        
        // Use the ensureDashboardVisible function for reliable redirect
        const dashboardShown = ensureDashboardVisible();
        
        if (dashboardShown) {
          // Clear form
          transactionFormElement.reset();
          transactionMessage.textContent = '';
          transactionMessage.className = 'transaction-message';
          
          console.log('Successfully redirected to dashboard for user:', currentUser);
        } else {
          console.error('Failed to show dashboard after transaction submission');
          showTransactionMessage('Error redirecting to dashboard. Please refresh the page.', 'error');
        }
      }, 2000);
    } else {
      showTransactionMessage('Failed to add transaction. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Transaction submission error:', error);
    showTransactionMessage('An error occurred while adding the transaction.', 'error');
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Add Transaction</span><div class="btn-shine"></div>';
  }
});

filterTypeEl?.addEventListener('change', updateDashboard);
searchInput?.addEventListener('input', updateDashboard);

// === New Feature Event Listeners ===
exportDataBtn?.addEventListener('click', exportData);

toggleAchievements?.addEventListener('click', () => {
  const container = document.getElementById('achievementsContainer');
  const isExpanded = container.style.maxHeight && container.style.maxHeight !== '0px';
  
  if (isExpanded) {
    container.style.maxHeight = '0px';
    toggleAchievements.textContent = 'Show All';
  } else {
    container.style.maxHeight = container.scrollHeight + 'px';
    toggleAchievements.textContent = 'Hide';
  }
});

addGoalBtn?.addEventListener('click', () => {
  const goalTitle = prompt('Enter goal title:');
  const goalTarget = prompt('Enter target amount:');
  
  if (goalTitle && goalTarget && !isNaN(goalTarget)) {
    addFinancialGoal(goalTitle, parseFloat(goalTarget));
  }
});

logoutBtn.addEventListener('click', () => {
  // Clear user data
  currentUser = '';
  transactions = [];
  userNameDisplay.textContent = 'User';
  
  // Clear forms
  document.getElementById('usernameInput').value = '';
  document.getElementById('passwordInput').value = '';
  document.getElementById('regUsernameInput').value = '';
  document.getElementById('regPasswordInput').value = '';
  document.getElementById('confirmPasswordInput').value = '';
  
  // Clear transaction form
  transactionFormElement.reset();
  
  // Clear messages
  authMessage.textContent = '';
  authMessage.className = 'auth-message';
  transactionMessage.textContent = '';
  transactionMessage.className = 'transaction-message';
  
  // Destroy charts
  if (incomeExpenseChart) {
    incomeExpenseChart.destroy();
    incomeExpenseChart = null;
  }
  if (expensePieChart) {
    expensePieChart.destroy();
    expensePieChart = null;
  }
  
  // Show login form and hide all other sections
  dashboard.hidden = true;
  transactionFormSection.style.display = 'none';
  loginSection.style.display = 'flex';
  logoutBtn.style.display = 'none';
  
  // Reset to login tab
  switchTab(loginTab);
});

// === Theme Toggle ===
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  themeToggle.textContent = document.body.classList.contains('dark-mode')
    ? '☀️'
    : '🌙';
});

// === Initialize App ===
function initializeApp() {
  // Check if there's a logged-in user (you could use localStorage for persistence)
  // For now, ensure clean state on page load
  currentUser = '';
  transactions = [];
  
  // Ensure login section is visible and all other sections are hidden on page load
  loginSection.style.display = 'flex';
  dashboard.hidden = true;
  transactionFormSection.style.display = 'none';
  logoutBtn.style.display = 'none';
  
  // Reset to login tab
  switchTab(loginTab);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeApp);


function updateMonthlyTrendsChart() {
  const ctx = document.getElementById('monthlyTrendsChart');
  if (!ctx) return;

  const monthly = {};
  transactions.forEach(t => {
    const date = new Date(t.createdAt);
    if (!isNaN(date)) {
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!monthly[key]) monthly[key] = { income: 0, expense: 0 };
      if (t.type === 'income') monthly[key].income += Number(t.amount);
      else if (t.type === 'expense') monthly[key].expense += Number(t.amount);
    }
  });

  const labels = Object.keys(monthly).sort();
  const incomeData = labels.map(l => monthly[l].income);
  const expenseData = labels.map(l => monthly[l].expense);

  if (monthlyTrendsChart) {
    monthlyTrendsChart.destroy();
  }

  monthlyTrendsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Income', data: incomeData, borderColor: 'green', fill: false },
        { label: 'Expenses', data: expenseData, borderColor: 'red', fill: false }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}
