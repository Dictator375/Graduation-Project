const Database = require('better-sqlite3');
const bcrypt   = require('bcryptjs');
const path     = require('path');
const fs       = require('fs');

const DB_PATH     = process.env.DB_PATH     || path.resolve(__dirname, '../../database/station.db');
const SCHEMA_PATH = process.env.SCHEMA_PATH  || path.resolve(__dirname, '../../database/schema.sql');

let db;

function getDb() {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const database = getDb();

  if (fs.existsSync(SCHEMA_PATH)) {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    database.exec(schema);
    console.log(' Schema applied');
  }

  // Add credit payment columns (safe migration)
  try { database.exec('ALTER TABLE sales ADD COLUMN credit_paid INTEGER DEFAULT 0'); } catch(e) {}
  try { database.exec('ALTER TABLE sales ADD COLUMN credit_paid_at DATETIME'); } catch(e) {}
  
  // Add new feature columns (safe migration)
  try { database.exec('ALTER TABLE refill_history ADD COLUMN demand_date DATETIME'); } catch(e) {}
  try { database.exec('ALTER TABLE refill_history ADD COLUMN supplier_id INTEGER'); } catch(e) {}
  try { database.exec('ALTER TABLE sales ADD COLUMN voucher_amount REAL'); } catch(e) {}

  // Suppliers table
  database.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        name           TEXT NOT NULL,
        contact_person TEXT,
        phone          TEXT,
        email          TEXT,
        address        TEXT,
        notes          TEXT,
        is_active      INTEGER DEFAULT 1,
        created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Payroll records table (safe migration)
  database.exec(`
    CREATE TABLE IF NOT EXISTS payroll_records (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      month           TEXT    NOT NULL,
      base_salary     REAL    NOT NULL,
      daily_rate      REAL    NOT NULL,
      total_days      INTEGER NOT NULL,
      days_worked     INTEGER NOT NULL,
      days_absent     INTEGER NOT NULL,
      deduction       REAL    NOT NULL,
      net_salary      REAL    NOT NULL,
      is_prorated     INTEGER DEFAULT 0,
      generated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, month)
    )
  `);
  try { database.exec('CREATE INDEX IF NOT EXISTS idx_payroll_user ON payroll_records(user_id)'); } catch(e) {}
  try { database.exec('CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll_records(month)'); } catch(e) {}

  // Seed teams
  const teamCount = database.prepare('SELECT COUNT(*) as c FROM teams').get();
  if (teamCount.c === 0) {
    database.exec(`
      INSERT INTO teams (name, name_ar, type) VALUES
      ('Morning Team',   'فريق الصباح',    'morning'),
      ('Afternoon Team', 'فريق المساء',    'afternoon'),
      ('Night Team',     'فريق الليل',     'night'),
      ('Reserve Team',   'فريق الاحتياط', 'reserve');
    `);
    console.log(' Teams seeded');
  }

  // Seed fuel types
  const fuelCount = database.prepare('SELECT COUNT(*) as c FROM fuel_types').get();
  if (fuelCount.c === 0) {
    database.exec(`
      INSERT INTO fuel_types (name, name_ar, price_per_liter) VALUES
      ('Unleaded 95', 'بنزين عادي 95',  47.50),
      ('Unleaded 98', 'بنزين ممتاز 98', 55.00),
      ('Diesel',      'مازوت',           22.00),
      ('GPL',         'غاز البترول',     11.00);
    `);
    database.exec(`
      INSERT INTO inventory (fuel_type_id, quantity_liters, low_threshold) VALUES
      (1, 20000, 5000),(2, 8000, 2000),(3, 25000, 6000),(4, 15000, 4000);
    `);
    console.log(' Fuel types seeded');
  }

  // Create admin user
  const userCount = database.prepare('SELECT COUNT(*) as c FROM users').get();
  if (userCount.c === 0) {
    const hash    = bcrypt.hashSync('Admin@1234', 10);
    const adminId = database.prepare(`
      INSERT INTO users (full_name, full_name_ar, username, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('Station Manager', 'مدير المحطة', 'admin', hash, 'manager').lastInsertRowid;

    database.prepare(`INSERT INTO payroll_dates (pay_date, description, created_by) VALUES (?,?,?)`).run('2026-05-30', 'رواتب شهر ماي 2026', adminId);
    database.prepare(`INSERT INTO payroll_dates (pay_date, description, created_by) VALUES (?,?,?)`).run('2026-06-30', 'رواتب شهر جوان 2026', adminId);
    console.log(' Admin created → admin / Admin@1234');
  }

  return database;
}

module.exports = { getDb, initDb };