const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabaseClient');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const { data: existing } = await supabase.from('users').select('user_id').eq('email', email).limit(1);
    if (existing && existing.length) return res.status(400).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('users').insert([{ username, email, hashed_password: hashed }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    const token = jwt.sign({ user_id: data.user_id, email: data.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    res.json({ token, user: { user_id: data.user_id, email: data.email, username: data.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).limit(1).single();
    if (error || !data) return res.status(400).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, data.hashed_password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ user_id: data.user_id, email: data.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    res.json({ token, user: { user_id: data.user_id, email: data.email, username: data.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const auth = require('../middleware/auth');

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('user_id, username, email, created_at').eq('user_id', req.user.user_id).single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Profile update (partial)
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body || {};
    // Prevent updating password here; provide a separate endpoint if needed
    delete updates.hashed_password;
    const { data, error } = await supabase.from('users').update(updates).eq('user_id', req.user.user_id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
