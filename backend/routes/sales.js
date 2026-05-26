const express = require('express');
const { getDb } = require('../models/db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const router = express.Router();

// POST /api/sales
router.post('/', auth, (req, res) => {
  const { fuel_type_id, quantity_liters, payment_method, institution_id, pump_number, notes } = req.body;
  if (!fuel_type_id || !quantity_liters || !payment_method || !pump_number)
    return res.status(400).json({ error: 'fuel_type_id, quantity_liters, payment_method and pump_number are required' });

  const db = getDb();
  const fuel = db.prepare('SELECT * FROM fuel_types WHERE id = ? AND is_active = 1').get(fuel_type_id);
  if (!fuel) return res.status(404).json({ error: 'Fuel type not found' });

  const inv = db.prepare('SELECT * FROM inventory WHERE fuel_type_id = ?').get(fuel_type_id);
  if (!inv || inv.quantity_liters < quantity_liters)
    return res.status(400).json({ error: 'Insufficient fuel inventory' });

  const total = parseFloat((fuel.price_per_liter * quantity_liters).toFixed(2));
  const today = new Date().toISOString().split('T')[0];

  const txn = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO sales (worker_id, fuel_type_id, quantity_liters, price_per_liter, total_amount,
        payment_method, institution_id, pump_number, shift_date, notes, credit_paid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, fuel_type_id, quantity_liters, fuel.price_per_liter, total,
        payment_method, institution_id || null, pump_number, today, notes || null,
        payment_method === 'credit' ? 0 : 1);
    db.prepare('UPDATE inventory SET quantity_liters = quantity_liters - ?, updated_at = CURRENT_TIMESTAMP WHERE fuel_type_id = ?')
      .run(quantity_liters, fuel_type_id);
    return info.lastInsertRowid;
  });

  const saleId = txn();
  res.status(201).json({ id: saleId, total_amount: total, price_per_liter: fuel.price_per_liter });
});

// GET /api/sales
router.get('/', auth, (req, res) => {
  const db = getDb();
  const { date, worker_id, fuel_type_id, limit = 50, offset = 0 } = req.query;

  let where = req.user.role === 'manager' || req.user.role === 'team_leader' ? '1=1' : `s.worker_id = ${req.user.id}`;
  const params = [];

  if (date) { where += ' AND s.shift_date = ?'; params.push(date); }
  if (worker_id && req.user.role === 'manager') { where += ' AND s.worker_id = ?'; params.push(worker_id); }
  if (fuel_type_id) { where += ' AND s.fuel_type_id = ?'; params.push(fuel_type_id); }

  params.push(parseInt(limit), parseInt(offset));

  const rows = db.prepare(`
    SELECT s.*, u.full_name as worker_name, u.full_name_ar as worker_name_ar,
           f.name as fuel_name, f.name_ar as fuel_name_ar,
           i.name as institution_name
    FROM sales s
    JOIN users u ON u.id = s.worker_id
    JOIN fuel_types f ON f.id = s.fuel_type_id
    LEFT JOIN institutions i ON i.id = s.institution_id
    WHERE ${where}
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params);

  res.json(rows);
});

// GET /api/sales/summary
router.get('/summary', auth, rbac('manager', 'team_leader'), (req, res) => {
  const db = getDb();
  const { period = 'daily', date } = req.query;
  const target = date || new Date().toISOString().split('T')[0];

  let rows;
  if (period === 'daily') {
    rows = db.prepare(`
      SELECT f.name, f.name_ar, SUM(s.quantity_liters) as total_liters,
             SUM(s.total_amount) as total_da, COUNT(*) as transactions
      FROM sales s JOIN fuel_types f ON f.id = s.fuel_type_id
      WHERE s.shift_date = ?
      GROUP BY s.fuel_type_id
    `).all(target);
  } else {
    const month = target.slice(0, 7);
    rows = db.prepare(`
      SELECT s.shift_date as date, SUM(s.total_amount) as total_da, COUNT(*) as transactions
      FROM sales s WHERE s.shift_date LIKE ?
      GROUP BY s.shift_date ORDER BY s.shift_date
    `).all(month + '%');
  }
  res.json(rows);
});

// GET /api/sales/credits — unpaid credit sales
router.get('/credits', auth, rbac('manager', 'team_leader'), (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT s.*, u.full_name as worker_name, u.full_name_ar as worker_name_ar,
           f.name_ar as fuel_name_ar, i.name as institution_name, i.phone as institution_phone
    FROM sales s
    JOIN users u ON u.id = s.worker_id
    JOIN fuel_types f ON f.id = s.fuel_type_id
    LEFT JOIN institutions i ON i.id = s.institution_id
    WHERE s.payment_method = 'credit' AND (s.credit_paid = 0 OR s.credit_paid IS NULL)
    ORDER BY s.created_at DESC
  `).all();
  res.json(rows);
});

// PUT /api/sales/:id/pay — mark credit as paid
router.put('/:id/pay', auth, rbac('manager'), (req, res) => {
  const db = getDb();
  db.prepare(`
    UPDATE sales SET credit_paid = 1, credit_paid_at = CURRENT_TIMESTAMP
    WHERE id = ? AND payment_method = 'credit'
  `).run(parseInt(req.params.id));
  res.json({ message: 'Marked as paid' });
});

// GET /api/sales/:id
router.get('/:id', auth, (req, res) => {
  const db = getDb();
  const row = db.prepare(`
    SELECT s.*, u.full_name as worker_name, u.full_name_ar as worker_name_ar,
           f.name as fuel_name, f.name_ar as fuel_name_ar, i.name as institution_name
    FROM sales s
    JOIN users u ON u.id = s.worker_id
    JOIN fuel_types f ON f.id = s.fuel_type_id
    LEFT JOIN institutions i ON i.id = s.institution_id
    WHERE s.id = ?
  `).get(parseInt(req.params.id));
  if (!row) return res.status(404).json({ error: 'Sale not found' });
  if (req.user.role !== 'manager' && row.worker_id !== req.user.id)
    return res.status(403).json({ error: 'Access denied' });
  res.json(row);
});

module.exports = router;