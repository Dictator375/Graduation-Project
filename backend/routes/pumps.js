const express = require('express');
const { getDb } = require('../models/db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const router = express.Router();

// GET /api/pumps - list all pumps
router.get('/', auth, (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM pumps ORDER BY pump_number').all();
  res.json(rows);
});

// POST /api/pumps - create new pump
router.post('/', auth, rbac('manager', 'team_leader'), (req, res) => {
  const { pump_number, uid, status, service_start_date, last_maintenance_date, maintenance_log, fault_log } = req.body;

  if (!pump_number) return res.status(400).json({ error: 'pump_number is required' });

  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM pumps').get().c;
  if (count >= 12) return res.status(400).json({ error: 'Maximum limit of 12 pumps reached' });

  try {
    const info = db.prepare(`
      INSERT INTO pumps (pump_number, uid, status, service_start_date, last_maintenance_date, maintenance_log, fault_log)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(pump_number, uid || null, status || 'in_service', service_start_date || null, last_maintenance_date || null, maintenance_log || null, fault_log || null);
    
    res.json({ id: info.lastInsertRowid, message: 'Pump created successfully' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed: pumps.pump_number')) {
      res.status(400).json({ error: 'Pump number already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create pump' });
    }
  }
});

// PUT /api/pumps/:id - update pump details
router.put('/:id', auth, rbac('manager', 'team_leader'), (req, res) => {
  let { pump_number, uid, status, service_start_date, last_maintenance_date, maintenance_log, fault_log } = req.body;
  const db = getDb();
  
  try {
    const oldPump = db.prepare('SELECT status, last_maintenance_date, maintenance_log, fault_log FROM pumps WHERE id = ?').get(req.params.id);
    if (!oldPump) return res.status(404).json({ error: 'Pump not found' });
    
    // Auto-append maintenance_log if last_maintenance_date changes
    if (last_maintenance_date && last_maintenance_date !== oldPump.last_maintenance_date) {
      const entry = `[${last_maintenance_date}] Maintenance recorded`;
      maintenance_log = oldPump.maintenance_log ? `${oldPump.maintenance_log}\n${entry}` : entry;
    }
    
    // Auto-append fault_log if status changes to out_of_service
    if (status === 'out_of_service' && oldPump.status !== 'out_of_service') {
      const today = new Date().toISOString().split('T')[0];
      const entry = `[${today}] Out of service`;
      fault_log = oldPump.fault_log ? `${oldPump.fault_log}\n${entry}` : entry;
    }

    db.prepare(`
      UPDATE pumps 
      SET pump_number = COALESCE(?, pump_number),
          uid = COALESCE(?, uid),
          status = COALESCE(?, status),
          service_start_date = COALESCE(?, service_start_date),
          last_maintenance_date = COALESCE(?, last_maintenance_date),
          maintenance_log = COALESCE(?, maintenance_log),
          fault_log = COALESCE(?, fault_log)
      WHERE id = ?
    `).run(pump_number, uid, status, service_start_date, last_maintenance_date, maintenance_log, fault_log, req.params.id);
    
    res.json({ message: 'Pump updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pump' });
  }
});

module.exports = router;
