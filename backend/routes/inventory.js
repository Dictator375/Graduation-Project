const express   = require('express');
const { getDb } = require('../models/db');
const auth      = require('../middleware/auth');
const rbac      = require('../middleware/rbac');

const router = express.Router();

// GET /api/inventory  — all roles can view
router.get('/', auth, (req, res) => {
  const db   = getDb();
  const rows = db.prepare(`
    SELECT inv.*, ft.name, ft.name_ar, ft.price_per_liter
    FROM inventory inv
    JOIN fuel_types ft ON ft.id = inv.fuel_type_id
    ORDER BY ft.id
  `).all();
  res.json(rows);
});

// GET /api/inventory/fuel-types
router.get('/fuel-types', auth, (req, res) => {
  const db   = getDb();
  const rows = db.prepare('SELECT * FROM fuel_types WHERE is_active = 1').all();
  res.json(rows);
});

// POST /api/inventory/refill  — manager only
router.post('/refill', auth, rbac('manager', 'team_leader'), (req, res) => {
  const { fuel_type_id, quantity_liters, cost_per_liter, supplier, demand_date, tax_rate = 0.19 } = req.body;
  if (!fuel_type_id || !quantity_liters)
    return res.status(400).json({ error: 'fuel_type_id and quantity_liters required' });

  const db         = getDb();
  
  // Check tank capacity
  const inventoryRow = db.prepare('SELECT capacity, quantity_liters FROM inventory WHERE fuel_type_id = ?').get(fuel_type_id);
  if (!inventoryRow) {
    return res.status(404).json({ error: 'Inventory record not found' });
  }
  const currentQuantity = parseFloat(inventoryRow.quantity_liters || 0);
  const addQuantity = parseFloat(quantity_liters || 0);
  const capacity = parseFloat(inventoryRow.capacity || 30000);
  
  if (currentQuantity + addQuantity > capacity) {
    return res.status(400).json({ 
      error: "The amount of fuel to be added exceeds the tank's capacity. Please try again with a smaller amount.",
      code: "CAPACITY_EXCEEDED" 
    });
  }

  let net_amount = null;
  let tax_amount = null;
  let total_cost = null;

  if (cost_per_liter) {
    net_amount = parseFloat((cost_per_liter * quantity_liters).toFixed(2));
    tax_amount = parseFloat((net_amount * tax_rate).toFixed(2));
    total_cost = parseFloat((net_amount + tax_amount).toFixed(2));
  }

  const doRefill = db.transaction(() => {
    db.prepare(`
      UPDATE inventory
      SET quantity_liters = quantity_liters + ?,
          last_refill_liters = ?,
          last_refill_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE fuel_type_id = ?
    `).run(quantity_liters, quantity_liters, fuel_type_id);

    db.prepare(`
      INSERT INTO refill_history (fuel_type_id, quantity_liters, cost_per_liter, net_amount, tax_rate, tax_amount, total_cost, supplier, demand_date, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(fuel_type_id, quantity_liters, cost_per_liter || null, net_amount, tax_rate, tax_amount, total_cost, supplier || null, demand_date || null, req.user.id);
  });

  doRefill();
  res.json({ message: 'Inventory updated successfully' });
});

// PUT /api/inventory/price/:fuel_type_id  — manager only
router.put('/price/:fuel_type_id', auth, rbac('manager', 'team_leader'), (req, res) => {
  const { price_per_liter } = req.body;
  if (!price_per_liter) return res.status(400).json({ error: 'price_per_liter required' });
  const db = getDb();
  db.prepare('UPDATE fuel_types SET price_per_liter = ? WHERE id = ?').run(price_per_liter, req.params.fuel_type_id);
  res.json({ message: 'Price updated' });
});

// GET /api/inventory/refill-history  — manager only
router.get('/refill-history', auth, rbac('manager', 'team_leader'), (req, res) => {
  const db   = getDb();
  const rows = db.prepare(`
    SELECT rh.*, ft.name, ft.name_ar, u.full_name as recorded_by_name
    FROM refill_history rh
    JOIN fuel_types ft ON ft.id = rh.fuel_type_id
    JOIN users u ON u.id = rh.recorded_by
    ORDER BY rh.refill_date DESC LIMIT 100
  `).all();
  res.json(rows);
});

module.exports = router;
