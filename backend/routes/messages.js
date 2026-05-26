const express = require('express');
const { getDb } = require('../models/db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/users/list — everyone can message everyone now
router.get('/users/list', auth, (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, full_name, full_name_ar, role, team_id
    FROM users
    WHERE id != ? AND is_active = 1
    ORDER BY role DESC, full_name
  `).all(req.user.id);
  res.json(rows);
});

// GET /api/messages/team — get team members for current user
router.get('/team', auth, (req, res) => {
  const db = getDb();
  if (!req.user.team_id) return res.json([]);
  const rows = db.prepare(`
    SELECT id, full_name, full_name_ar, role, team_id
    FROM users WHERE team_id = ? AND id != ? AND is_active = 1
  `).all(req.user.team_id, req.user.id);
  res.json(rows);
});

// GET /api/messages — all messages for current user
router.get('/', auth, (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT m.*,
           s.full_name as sender_name, s.full_name_ar as sender_name_ar, s.role as sender_role,
           r.full_name as receiver_name, r.full_name_ar as receiver_name_ar
    FROM messages m
    JOIN users s ON s.id = m.sender_id
    LEFT JOIN users r ON r.id = m.receiver_id
    WHERE m.sender_id = ? OR m.receiver_id = ? OR m.receiver_id IS NULL
    ORDER BY m.created_at DESC LIMIT 100
  `).all(req.user.id, req.user.id);
  res.json(rows);
});

// GET /api/messages/unread-count
router.get('/unread-count', auth, (req, res) => {
  const db = getDb();
  const row = db.prepare(`
    SELECT COUNT(*) as count FROM messages
    WHERE (receiver_id = ? OR receiver_id IS NULL)
      AND sender_id != ? AND is_read = 0
  `).get(req.user.id, req.user.id);
  res.json({ count: row.count });
});

// GET /api/messages/conversation/:userId
router.get('/conversation/:userId', auth, (req, res) => {
  const db = getDb();
  const other = parseInt(req.params.userId);
  const rows = db.prepare(`
    SELECT m.*, s.full_name as sender_name, s.full_name_ar as sender_name_ar
    FROM messages m JOIN users s ON s.id = m.sender_id
    WHERE (m.sender_id = ? AND m.receiver_id = ?)
       OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at ASC LIMIT 200
  `).all(req.user.id, other, other, req.user.id);

  db.prepare(`UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ?`)
    .run(req.user.id, other);
  res.json(rows);
});

// GET /api/messages/broadcast — team or universal broadcast messages
router.get('/broadcast', auth, (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT m.*, s.full_name as sender_name, s.full_name_ar as sender_name_ar, s.role as sender_role
    FROM messages m JOIN users s ON s.id = m.sender_id
    WHERE m.receiver_id IS NULL
    ORDER BY m.created_at ASC LIMIT 200
  `).all();
  res.json(rows);
});

// POST /api/messages — send a message
router.post('/', auth, (req, res) => {
  const { receiver_id, content } = req.body;
  if (!content || !content.trim())
    return res.status(400).json({ error: 'Message content required' });

  const db = getDb();
  const info = db.prepare(`
    INSERT INTO messages (sender_id, receiver_id, content)
    VALUES (?, ?, ?)
  `).run(req.user.id, receiver_id || null, content.trim());

  const msg = db.prepare(`
    SELECT m.*, s.full_name as sender_name, s.full_name_ar as sender_name_ar
    FROM messages m JOIN users s ON s.id = m.sender_id WHERE m.id = ?
  `).get(info.lastInsertRowid);

  res.status(201).json(msg);
});

// PUT /api/messages/:id/read
router.put('/:id/read', auth, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE messages SET is_read = 1 WHERE id = ? AND receiver_id = ?')
    .run(parseInt(req.params.id), req.user.id);
  res.json({ message: 'Marked as read' });
});

module.exports = router;