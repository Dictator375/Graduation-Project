const express   = require('express');
const { getDb } = require('../models/db');
const auth      = require('../middleware/auth');
const rbac      = require('../middleware/rbac');

const router = express.Router();

// ── Shifts ───────────────────────────────────────────────────

// GET /api/shifts?date=YYYY-MM-DD
router.get('/', auth, (req, res) => {
  const db   = getDb();
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const rows = db.prepare(`
    SELECT s.*, t.name as team_name, t.name_ar as team_name_ar, t.type as team_type
    FROM shifts s
    LEFT JOIN teams t ON t.id = s.team_id
    WHERE s.date = ?
    ORDER BY s.start_time
  `).all(date);
  res.json(rows);
});

// POST /api/shifts  — manager only
router.post('/', auth, rbac('manager'), (req, res) => {
  const { name, name_ar, start_time, end_time, team_id, date } = req.body;
  if (!name || !start_time || !end_time || !date)
    return res.status(400).json({ error: 'name, start_time, end_time and date required' });
  const db   = getDb();
  const info = db.prepare(`
    INSERT INTO shifts (name, name_ar, start_time, end_time, team_id, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, name_ar || name, start_time, end_time, team_id || null, date);
  res.status(201).json({ id: info.lastInsertRowid });
});

// DELETE /api/shifts/:id  — manager only
router.delete('/:id', auth, rbac('manager'), (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM shifts WHERE id = ?').run(parseInt(req.params.id));
  res.json({ message: 'Shift deleted' });
});

// ── Attendance ───────────────────────────────────────────────

// GET /api/shifts/attendance?date=YYYY-MM-DD
router.get('/attendance', auth, rbac('manager', 'team_leader'), (req, res) => {
  const db   = getDb();
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const rows = db.prepare(`
    SELECT a.*, u.full_name, u.full_name_ar, u.role, t.name as team_name
    FROM attendance a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN teams t ON t.id = u.team_id
    WHERE a.date = ?
    ORDER BY u.full_name
  `).all(date);
  res.json(rows);
});

// GET /api/shifts/attendance/my?month=YYYY-MM  — worker sees own
router.get('/attendance/my', auth, (req, res) => {
  const db    = getDb();
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const rows  = db.prepare(`
    SELECT * FROM attendance WHERE user_id = ? AND date LIKE ? ORDER BY date
  `).all(req.user.id, month + '%');
  res.json(rows);
});

// POST /api/shifts/attendance  — manager records attendance
router.post('/attendance', auth, rbac('manager', 'team_leader'), (req, res) => {
  const { records } = req.body; // array of { user_id, date, status, check_in, check_out, notes }
  if (!Array.isArray(records) || records.length === 0)
    return res.status(400).json({ error: 'records array required' });

  const db   = getDb();
  const stmt = db.prepare(`
    INSERT INTO attendance (user_id, date, status, check_in, check_out, notes, recorded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      status = excluded.status,
      check_in = excluded.check_in,
      check_out = excluded.check_out,
      notes = excluded.notes,
      recorded_by = excluded.recorded_by
  `);

  const insertMany = db.transaction((recs) => {
    for (const r of recs) {
      stmt.run(r.user_id, r.date, r.status, r.check_in || null, r.check_out || null, r.notes || null, req.user.id);
    }
  });

  insertMany(records);
  res.json({ message: `${records.length} attendance records saved` });
});

// GET /api/shifts/teams
router.get('/teams', auth, (req, res) => {
  const db   = getDb();
  const rows = db.prepare('SELECT * FROM teams').all();
  res.json(rows);
});

module.exports = router;
