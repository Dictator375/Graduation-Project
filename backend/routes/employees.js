const express  = require('express');
const bcrypt   = require('bcryptjs');
const { getDb } = require('../models/db');
const auth     = require('../middleware/auth');
const rbac     = require('../middleware/rbac');

const router = express.Router();
const SAFE_COLS = 'id, full_name, full_name_ar, username, role, team_id, phone, national_id, hire_date, salary, is_active, created_at';

// GET /api/employees  — manager sees all; worker sees only their own info
router.get('/', auth, (req, res) => {
  const db = getDb();
  if (req.user.role === 'manager' || req.user.role === 'team_leader') {
    const rows = db.prepare(`SELECT ${SAFE_COLS} FROM users ORDER BY full_name`).all();
    return res.json(rows);
  }
  const row = db.prepare(`SELECT ${SAFE_COLS} FROM users WHERE id = ?`).get(req.user.id);
  res.json([row]);
});

// GET /api/employees/:id  — manager or the employee themselves
router.get('/:id', auth, (req, res) => {
  const db   = getDb();
  const id   = parseInt(req.params.id);
  if (req.user.role !== 'manager' && req.user.id !== id)
    return res.status(403).json({ error: 'Access denied' });
  const row  = db.prepare(`SELECT ${SAFE_COLS} FROM users WHERE id = ?`).get(id);
  if (!row) return res.status(404).json({ error: 'Employee not found' });
  res.json(row);
});

// PUT /api/employees/:id  — manager only
router.put('/:id', auth, rbac('manager'), (req, res) => {
  const db  = getDb();
  const id  = parseInt(req.params.id);
  const { full_name, full_name_ar, role, team_id, phone, national_id, hire_date, salary, is_active } = req.body;
  db.prepare(`
    UPDATE users SET
      full_name = COALESCE(?, full_name),
      full_name_ar = COALESCE(?, full_name_ar),
      role = COALESCE(?, role),
      team_id = COALESCE(?, team_id),
      phone = COALESCE(?, phone),
      national_id = COALESCE(?, national_id),
      hire_date = COALESCE(?, hire_date),
      salary = COALESCE(?, salary),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(full_name, full_name_ar, role, team_id, phone, national_id, hire_date, salary, is_active, id);
  res.json({ message: 'Employee updated' });
});

// DELETE /api/employees/:id  — manager only (soft delete)
router.delete('/:id', auth, rbac('manager'), (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot deactivate yourself' });
  db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(id);
  res.json({ message: 'Employee deactivated' });
});

// GET /api/employees/teams/list
router.get('/teams/list', auth, (req, res) => {
  const db = getDb();
  const teams = db.prepare('SELECT * FROM teams').all();
  res.json(teams);
});

module.exports = router;
