const express = require('express');
const supabase = require('../lib/supabaseClient');
const auth = require('../middleware/auth');

const router = express.Router();

// Create or update budget
router.post('/', auth, async (req, res) => {
  const userId = req.user.user_id;
  const { category_id, budget_amount, month, year } = req.body;
  if (!budget_amount || !month || !year) return res.status(400).json({ error: 'budget_amount, month and year required' });
  try {
    // upsert by user_id + category_id + month + year
    const key = { user_id: userId, category_id: category_id || null, month, year };
    const { data, error } = await supabase.from('budgets').upsert([{ ...key, budget_amount }], { onConflict: ['user_id', 'category_id', 'month', 'year'] }).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ budget: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List budgets for user
router.get('/', auth, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const { data, error } = await supabase.from('budgets').select('*').eq('user_id', userId).order('year', { ascending: false }).order('month', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ budgets: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simple check: whether spent for a budget is approaching/exceeding (returns percentages)
router.get('/check', auth, async (req, res) => {
  const userId = req.user.user_id;
  const { month, year } = req.query;
  if (!month || !year) return res.status(400).json({ error: 'month and year required' });
  try {
    const { data: budgets } = await supabase.from('budgets').select('*').eq('user_id', userId).eq('month', month).eq('year', year);
    const results = [];
    for (const b of budgets) {
      const { data: sums } = await supabase.from('expenses').select('amount').eq('user_id', userId).eq('category_id', b.category_id).gte('expense_date', `${year}-${String(month).padStart(2,'0')}-01`).lte('expense_date', `${year}-${String(month).padStart(2,'0')}-31`);
      const spent = sums.reduce((s, r) => s + Number(r.amount || 0), 0);
      const pct = b.budget_amount ? (spent / b.budget_amount) * 100 : null;
      results.push({ budget: b, spent, percent: pct });
    }
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
