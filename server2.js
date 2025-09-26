const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // for unique IDs

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// File to store transactions (per-user)
const DATA_FILE = path.join(__dirname, 'transactions.json');
// File to store user credentials
const USERS_FILE = path.join(__dirname, 'users.json');

// Load transactions from file (or start empty if file doesn't exist)
// Structure: { [username: string]: Array<{ id: string, type: 'income'|'expense', amount: number, description: string }> }
let userToTransactions = {};
if (fs.existsSync(DATA_FILE)) {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      // backward compatibility: if file was just an array
      userToTransactions = { _legacy: parsed };
    } else if (parsed && typeof parsed === 'object') {
      userToTransactions = parsed;
    }
  } catch (err) {
    console.error('Error reading transactions.json:', err);
  }
}

// Load users from file (or start empty if file doesn't exist)
// Structure: { [username: string]: { password: string, createdAt: string } }
let users = {};
if (fs.existsSync(USERS_FILE)) {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    users = JSON.parse(data);
  } catch (err) {
    console.error('Error reading users.json:', err);
  }
}

// Save transactions to file
function saveTransactions() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(userToTransactions, null, 2), 'utf8');
}

// Save users to file
function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// === API Routes ===

// Register a new user
app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};
  const cleanUser = String(username || '').trim();
  const cleanPass = String(password || '').trim();

  if (!cleanUser || !cleanPass) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (users[cleanUser]) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  users[cleanUser] = {
    password: cleanPass,
    createdAt: new Date().toISOString()
  };
  saveUsers();

  res.status(201).json({ message: 'User registered successfully' });
});

// Login user
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const cleanUser = String(username || '').trim();
  const cleanPass = String(password || '').trim();

  if (!cleanUser || !cleanPass) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = users[cleanUser];
  if (!user || user.password !== cleanPass) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  res.json({ message: 'Login successful', username: cleanUser });
});

// Get transactions for a specific user
app.get('/api/transactions', (req, res) => {
  const username = String(req.query.user || '').trim();
  if (!username) {
    return res.status(400).json({ error: 'Missing required query param: user' });
  }
  
  // Verify user exists
  if (!users[username]) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const items = userToTransactions[username] || [];
  res.json(items);
});

// Add a new transaction
app.post('/api/transactions', (req, res) => {
  const { username, type, amount, description, category } = req.body || {};
  const cleanUser = String(username || '').trim();
  const cleanType = String(type || '').trim().toLowerCase();
  const numericAmount = Number(amount);

  if (!cleanUser) return res.status(400).json({ error: 'username is required' });
  
  // Verify user exists
  if (!users[cleanUser]) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (!['income', 'expense'].includes(cleanType)) {
    return res.status(400).json({ error: "type must be 'income' or 'expense'" });
  }
  if (!Number.isFinite(numericAmount)) {
    return res.status(400).json({ error: 'amount must be a number' });
  }

  const tx = {
    id: uuidv4(),
    type: cleanType,
    amount: numericAmount,
    description: String(description || ''),
    category: String(category || ''),
    createdAt: new Date().toISOString()
  };

  if (!userToTransactions[cleanUser]) userToTransactions[cleanUser] = [];
  userToTransactions[cleanUser].push(tx);
  saveTransactions();

  res.status(201).json(tx);
});

// Update a transaction
app.put('/api/transactions/:id', (req, res) => {
  const { username, type, amount, description } = req.body || {};
  const cleanUser = String(username || '').trim();
  const txId = req.params.id;

  if (!cleanUser) return res.status(400).json({ error: 'username is required' });
  
  // Verify user exists
  if (!users[cleanUser]) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const list = userToTransactions[cleanUser];
  if (!list) return res.status(404).json({ error: 'No transactions for user' });

  const tx = list.find((t) => t.id === txId);
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });

  if (type) tx.type = String(type).toLowerCase();
  if (Number.isFinite(Number(amount))) tx.amount = Number(amount);
  if (description !== undefined) tx.description = String(description);

  saveTransactions();
  res.json(tx);
});

// Delete a transaction
app.delete('/api/transactions/:id', (req, res) => {
  const username = String(req.query.user || '').trim();
  const txId = req.params.id;

  if (!username) return res.status(400).json({ error: 'username query param is required' });
  
  // Verify user exists
  if (!users[username]) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const list = userToTransactions[username];
  if (!list) return res.status(404).json({ error: 'No transactions for user' });

  const index = list.findIndex((t) => t.id === txId);
  if (index === -1) return res.status(404).json({ error: 'Transaction not found' });

  const [removed] = list.splice(index, 1);
  saveTransactions();

  res.json({ success: true, removed });
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
