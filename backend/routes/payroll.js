const express   = require('express');
const { getDb } = require('../models/db');
const auth      = require('../middleware/auth');
const rbac      = require('../middleware/rbac');

const router = express.Router();

// GET /api/payroll  — manager sees all; worker sees only the next upcoming date
router.get('/', auth, (req, res) => {
  const db = getDb();
  if (req.user.role === 'manager') {
    const rows = db.prepare('SELECT * FROM payroll_dates ORDER BY pay_date').all();
    return res.json(rows);
  }
  // Worker: show only the next upcoming pay date
  const today = new Date().toISOString().split('T')[0];
  const next  = db.prepare('SELECT * FROM payroll_dates WHERE pay_date >= ? ORDER BY pay_date LIMIT 1').get(today);
  res.json(next ? [next] : []);
});

// POST /api/payroll  — manager only
router.post('/', auth, rbac('manager'), (req, res) => {
  const { pay_date, description } = req.body;
  if (!pay_date) return res.status(400).json({ error: 'pay_date required' });
  const db   = getDb();
  const info = db.prepare('INSERT INTO payroll_dates (pay_date, description, created_by) VALUES (?, ?, ?)')
                 .run(pay_date, description || null, req.user.id);
  res.status(201).json({ id: info.lastInsertRowid });
});

// DELETE /api/payroll/:id  — manager only
router.delete('/:id', auth, rbac('manager'), (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM payroll_dates WHERE id = ?').run(parseInt(req.params.id));
  res.json({ message: 'Payroll date deleted' });
});

module.exports = router;
