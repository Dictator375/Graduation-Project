const express   = require('express');
const { getDb } = require('../models/db');
const auth      = require('../middleware/auth');
const rbac      = require('../middleware/rbac');

const router = express.Router();

function generateInvoiceNumber(db) {
  const year  = new Date().getFullYear();
  const count = db.prepare(`SELECT COUNT(*) as c FROM invoices WHERE invoice_number LIKE ?`).get(`INV-${year}-%`);
  const seq   = String(count.c + 1).padStart(4, '0');
  return `INV-${year}-${seq}`;
}

// GET /api/invoices  — manager only
router.get('/', auth, rbac('manager'), (req, res) => {
  const db   = getDb();
  const { status, institution_id } = req.query;
  let where  = '1=1';
  const params = [];
  if (status)         { where += ' AND i.status = ?';          params.push(status); }
  if (institution_id) { where += ' AND i.institution_id = ?';  params.push(institution_id); }

  const rows = db.prepare(`
    SELECT i.*, inst.name as institution_name, u.full_name as created_by_name
    FROM invoices i
    LEFT JOIN institutions inst ON inst.id = i.institution_id
    JOIN users u ON u.id = i.created_by
    WHERE ${where}
    ORDER BY i.created_at DESC LIMIT 100
  `).all(...params);
  res.json(rows);
});

// GET /api/invoices/:id  — with line items
router.get('/:id', auth, rbac('manager'), (req, res) => {
  const db  = getDb();
  const inv = db.prepare(`
    SELECT i.*, inst.name as institution_name, u.full_name as created_by_name
    FROM invoices i
    LEFT JOIN institutions inst ON inst.id = i.institution_id
    JOIN users u ON u.id = i.created_by
    WHERE i.id = ?
  `).get(parseInt(req.params.id));
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });

  const items = db.prepare(`
    SELECT ii.*, ft.name as fuel_name, ft.name_ar as fuel_name_ar
    FROM invoice_items ii
    JOIN fuel_types ft ON ft.id = ii.fuel_type_id
    WHERE ii.invoice_id = ?
  `).all(inv.id);

  res.json({ ...inv, items });
});

// POST /api/invoices  — manager only
router.post('/', auth, rbac('manager'), (req, res) => {
  const { institution_id, items, tax_rate = 0.19, due_date, notes } = req.body;
  if (!items || items.length === 0)
    return res.status(400).json({ error: 'Invoice must have at least one item' });

  const db = getDb();
  const net_amount  = items.reduce((s, it) => s + (it.quantity_liters * it.price_per_liter), 0);
  const tax_amount  = parseFloat((net_amount * tax_rate).toFixed(2));
  const total_amount = parseFloat((net_amount + tax_amount).toFixed(2));
  const inv_number  = generateInvoiceNumber(db);

  const create = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO invoices (invoice_number, institution_id, total_amount, tax_rate, tax_amount, net_amount, created_by, due_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(inv_number, institution_id || null, total_amount, tax_rate, tax_amount, net_amount, req.user.id, due_date || null, notes || null);

    const invId = info.lastInsertRowid;
    for (const it of items) {
      const subtotal = parseFloat((it.quantity_liters * it.price_per_liter).toFixed(2));
      db.prepare(`INSERT INTO invoice_items (invoice_id, fuel_type_id, quantity_liters, price_per_liter, subtotal) VALUES (?, ?, ?, ?, ?)`)
        .run(invId, it.fuel_type_id, it.quantity_liters, it.price_per_liter, subtotal);
    }
    return invId;
  });

  const id = create();
  res.status(201).json({ id, invoice_number: inv_number, total_amount });
});

// PUT /api/invoices/:id/status  — mark paid or cancelled
router.put('/:id/status', auth, rbac('manager'), (req, res) => {
  const { status } = req.body;
  if (!['paid','cancelled','pending'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  const db = getDb();
  db.prepare(`UPDATE invoices SET status = ?, paid_at = CASE WHEN ? = 'paid' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = ?`)
    .run(status, status, parseInt(req.params.id));
  res.json({ message: 'Status updated' });
});

module.exports = router;
