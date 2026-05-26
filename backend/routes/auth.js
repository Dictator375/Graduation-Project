const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getDb } = require('../models/db');
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
require('dotenv').config();

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  const db   = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid)  return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, team_id: user.team_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// POST /api/auth/register  (manager only)
router.post('/register', auth, rbac('manager'), (req, res) => {
  const { full_name, full_name_ar, username, password, role, team_id, phone, national_id, hire_date, salary } = req.body;
  if (!full_name || !username || !password || !role)
    return res.status(400).json({ error: 'full_name, username, password and role are required' });

  const db   = getDb();
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: 'Username already taken' });

  const hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare(`
    INSERT INTO users (full_name, full_name_ar, username, password_hash, role, team_id, phone, national_id, hire_date, salary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(full_name, full_name_ar || null, username, hash, role, team_id || null, phone || null, national_id || null, hire_date || null, salary || 0);
  res.status(201).json({ id: info.lastInsertRowid, message: 'Worker registered successfully' });
});

// POST /api/auth/change-password
router.post('/change-password', auth, (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password)
    return res.status(400).json({ error: 'old_password and new_password required' });
  if (new_password.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters' });

  const db   = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const valid = bcrypt.compareSync(old_password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Old password is incorrect' });

  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ message: 'Password changed successfully' });
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  const db   = getDb();
  const user = db.prepare('SELECT id, full_name, full_name_ar, username, role, team_id, phone, hire_date FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

module.exports = router;
