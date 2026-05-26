const express   = require('express');
const { getDb } = require('../models/db');
const auth      = require('../middleware/auth');
const rbac      = require('../middleware/rbac');

const router = express.Router();

// GET /api/institutions  — all roles can view
router.get('/', auth, (req, res) => {
  const db   = getDb();
  const rows = db.prepare('SELECT * FROM institutions WHERE is_active = 1 ORDER BY name').all();
  res.json(rows);
});

// GET /api/institutions/:id
router.get('/:id', auth, (req, res) => {
  const db  = getDb();
  const row = db.prepare('SELECT * FROM institutions WHERE id = ?').get(parseInt(req.params.id));
  if (!row) return res.status(404).json({ error: 'Institution not found' });
  res.json(row);
});

// POST /api/institutions  — manager only
router.post('/', auth, rbac('manager'), (req, res) => {
  const { name, contact_person, phone, address, tax_number, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Institution name required' });
  const db   = getDb();
  const info = db.prepare(`
    INSERT INTO institutions (name, contact_person, phone, address, tax_number, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, contact_person || null, phone || null, address || null, tax_number || null, notes || null);
  res.status(201).json({ id: info.lastInsertRowid });
});

// PUT /api/institutions/:id  — manager only
router.put('/:id', auth, rbac('manager'), (req, res) => {
  const db = getDb();
  const { name, contact_person, phone, address, tax_number, notes, is_active } = req.body;
  db.prepare(`
    UPDATE institutions SET
      name = COALESCE(?, name), contact_person = COALESCE(?, contact_person),
      phone = COALESCE(?, phone), address = COALESCE(?, address),
      tax_number = COALESCE(?, tax_number), notes = COALESCE(?, notes),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(name, contact_person, phone, address, tax_number, notes, is_active, parseInt(req.params.id));
  res.json({ message: 'Institution updated' });
});

// DELETE /api/institutions/:id  — soft delete
router.delete('/:id', auth, rbac('manager'), (req, res) => {
  const db = getDb();
  db.prepare('UPDATE institutions SET is_active = 0 WHERE id = ?').run(parseInt(req.params.id));
  res.json({ message: 'Institution removed' });
});

module.exports = router;
