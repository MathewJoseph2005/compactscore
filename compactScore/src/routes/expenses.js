const express = require('express');
const supabase = require('../lib/supabaseClient');
const auth = require('../middleware/auth');

const router = express.Router();

// List expenses for authenticated user (with optional date range)
router.get('/', auth, async (req, res) => {
  const userId = req.user.user_id;
  const { from, to } = req.query;
  try {
    let query = supabase.from('expenses').select('*').eq('user_id', userId).order('expense_date', { ascending: false });
    if (from) query = query.gte('expense_date', from);
    if (to) query = query.lte('expense_date', to);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ expenses: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create expense
router.post('/', auth, async (req, res) => {
  const userId = req.user.user_id;
  const { amount, category_id, description, expense_date } = req.body;
  if (!amount || !expense_date) return res.status(400).json({ error: 'amount and expense_date required' });
  try {
    const { data, error } = await supabase.from('expenses').insert([{ user_id: userId, amount, category_id, description, expense_date }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ expense: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update expense
router.put('/:id', auth, async (req, res) => {
  const userId = req.user.user_id;
  const id = req.params.id;
  try {
    const { data: existing, error: exErr } = await supabase.from('expenses').select('user_id').eq('expense_id', id).single();
    if (exErr || !existing) return res.status(404).json({ error: 'Expense not found' });
    if (existing.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
    const updates = req.body;
    const { data, error } = await supabase.from('expenses').update(updates).eq('expense_id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ expense: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  const userId = req.user.user_id;
  const id = req.params.id;
  try {
    const { data: existing, error: exErr } = await supabase.from('expenses').select('user_id').eq('expense_id', id).single();
    if (exErr || !existing) return res.status(404).json({ error: 'Expense not found' });
    if (existing.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
    const { error } = await supabase.from('expenses').delete().eq('expense_id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export CSV
router.get('/export/csv', auth, async (req, res) => {
  const userId = req.user.user_id;
  const { from, to } = req.query;
  try {
    let query = supabase.from('expenses').select('*').eq('user_id', userId).order('expense_date', { ascending: false });
    if (from) query = query.gte('expense_date', from);
    if (to) query = query.lte('expense_date', to);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    // convert to CSV simple
    const stringify = require('csv-stringify');
    const rows = data.map(e => ({ expense_id: e.expense_id, amount: e.amount, category_id: e.category_id, description: e.description, expense_date: e.expense_date }));
    stringify(rows, { header: true }, (err, output) => {
      if (err) return res.status(500).json({ error: err.message });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="expenses_${userId}.csv"`);
      res.send(output);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export PDF (simple table)
router.get('/export/pdf', auth, async (req, res) => {
  const userId = req.user.user_id;
  const { from, to } = req.query;
  try {
    let query = supabase.from('expenses').select('*').eq('user_id', userId).order('expense_date', { ascending: false });
    if (from) query = query.gte('expense_date', from);
    if (to) query = query.lte('expense_date', to);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="expenses_${userId}.pdf"`);
    doc.pipe(res);
    doc.fontSize(18).text('Expense Export', { align: 'center' });
    doc.moveDown();
    data.forEach(e => {
      doc.fontSize(12).text(`${e.expense_date} — $${e.amount} — ${e.category_id || 'Uncat'} — ${e.description || ''}`);
    });
    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
