const api = '';
let token = null;

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email, password }) });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    document.getElementById('auth-area').style.display = 'none';
    document.getElementById('app-area').style.display = '';
    loadExpenses();
  } else {
    alert(data.error || 'Login failed');
  }
});

document.getElementById('registerBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const username = email.split('@')[0];
  const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email, password, username }) });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    document.getElementById('auth-area').style.display = 'none';
    document.getElementById('app-area').style.display = '';
    loadExpenses();
  } else {
    alert(data.error || 'Register failed');
  }
});

document.getElementById('addExpBtn').addEventListener('click', async () => {
  const amount = document.getElementById('exp-amount').value;
  const expense_date = document.getElementById('exp-date').value;
  const description = document.getElementById('exp-desc').value;
  const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ amount, expense_date, description }) });
  const data = await res.json();
  if (data.expense) {
    loadExpenses();
  } else {
    alert(data.error || 'Failed to add expense');
  }
});

async function loadExpenses() {
  const res = await fetch('/api/expenses', { headers: { 'Authorization': `Bearer ${token}` } });
  const data = await res.json();
  const list = document.getElementById('transactions');
  list.innerHTML = '';
  (data.expenses || []).slice(0, 10).forEach(e => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = `${e.expense_date} — $${e.amount} — ${e.description || ''}`;
    list.appendChild(li);
  });
}
