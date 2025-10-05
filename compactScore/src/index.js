require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const expensesRoutes = require('./routes/expenses');
const categoriesRoutes = require('./routes/categories');
const budgetsRoutes = require('./routes/budgets');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/budgets', budgetsRoutes);

// serve frontend
app.use('/', express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
