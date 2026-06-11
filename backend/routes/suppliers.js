const express   = require('express');
const { getDb } = require('../models/db');
const auth      = require('../middleware/auth');
const rbac      = require('../middleware/rbac');

const router = express.Router();

// ──────────────────────────────────────────────────────────────
// GET /api/suppliers
// Get all suppliers
// ──────────────────────────────────────────────────────────────
router.get('/', auth, (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM suppliers ORDER BY name').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/suppliers
// Add new supplier
// ──────────────────────────────────────────────────────────────
router.post('/', auth, rbac('manager', 'team_leader'), (req, res) => {
  const { name, contact_person, phone, email, address, notes, is_active } = req.body;
  
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO suppliers (name, contact_person, phone, email, address, notes, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      name, 
      contact_person || null, 
      phone || null, 
      email || null, 
      address || null, 
      notes || null, 
      is_active !== undefined ? is_active : 1
    );
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// PUT /api/suppliers/:id
// Update supplier
// ──────────────────────────────────────────────────────────────
router.put('/:id', auth, rbac('manager', 'team_leader'), (req, res) => {
  const { name, contact_person, phone, email, address, notes, is_active } = req.body;
  const id = req.params.id;

  try {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE suppliers 
      SET name = COALESCE(?, name),
          contact_person = COALESCE(?, contact_person),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          address = COALESCE(?, address),
          notes = COALESCE(?, notes),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `);
    
    const info = stmt.run(
      name || null,
      contact_person || null,
      phone || null,
      email || null,
      address || null,
      notes || null,
      is_active !== undefined ? is_active : null,
      id
    );

    if (info.changes === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// DELETE /api/suppliers/:id
// Delete supplier
// ──────────────────────────────────────────────────────────────
router.delete('/:id', auth, rbac('manager'), (req, res) => {
  try {
    const db = getDb();
    const info = db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ success: true });
  } catch (err) {
    if (err.message.includes('FOREIGN KEY')) {
      return res.status(400).json({ error: 'Cannot delete supplier because it is linked to refill history' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
