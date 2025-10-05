const express = require('express');
const supabase = require('../lib/supabaseClient');
const auth = require('../middleware/auth');

const router = express.Router();

// Get categories (default + user custom)
router.get('/', auth, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const { data, error } = await supabase.from('categories').select('*').or(`user_id.eq.${userId},is_default.eq.true`);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ categories: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create custom category
router.post('/', auth, async (req, res) => {
  const userId = req.user.user_id;
  const { category_name } = req.body;
  if (!category_name) return res.status(400).json({ error: 'category_name required' });
  try {
    const { data, error } = await supabase.from('categories').insert([{ user_id: userId, category_name, is_default: false }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ category: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed default categories (admin-like; idempotent)
router.post('/seed-defaults', async (req, res) => {
  const defaults = ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Healthcare', 'Rent'];
  try {
    for (const name of defaults) {
      const { data: existing } = await supabase.from('categories').select('category_id').eq('category_name', name).eq('is_default', true).limit(1);
      if (!existing || existing.length === 0) {
        await supabase.from('categories').insert([{ category_name: name, is_default: true }]);
      }
    }
    res.json({ seeded: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
