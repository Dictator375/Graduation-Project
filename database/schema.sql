-- ============================================================
--  Gas Station Management System — Database Schema (SQLite)
-- ============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ── Teams ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    name_ar     TEXT    NOT NULL,
    type        TEXT    NOT NULL CHECK(type IN ('morning','afternoon','night','reserve')),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name     TEXT    NOT NULL,
    full_name_ar  TEXT,
    username      TEXT    UNIQUE NOT NULL,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL CHECK(role IN ('manager','team_leader','worker')),
    team_id       INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    phone         TEXT,
    national_id   TEXT    UNIQUE,
    hire_date     DATE,
    salary        REAL    DEFAULT 0,
    is_active     INTEGER DEFAULT 1,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Shift schedules ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    name_ar    TEXT NOT NULL,
    start_time TEXT NOT NULL,   -- e.g. "08:00"
    end_time   TEXT NOT NULL,   -- e.g. "14:00"
    team_id    INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    date       DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Attendance ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date        DATE    NOT NULL,
    status      TEXT    NOT NULL CHECK(status IN ('present','absent','late','excused')),
    check_in    DATETIME,
    check_out   DATETIME,
    notes       TEXT,
    recorded_by INTEGER REFERENCES users(id),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- ── Fuel types ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fuel_types (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT NOT NULL,
    name_ar          TEXT NOT NULL,
    price_per_liter  REAL NOT NULL,        -- in DA (Algerian Dinar)
    is_active        INTEGER DEFAULT 1
);

-- ── Fuel inventory ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    fuel_type_id        INTEGER NOT NULL REFERENCES fuel_types(id),
    quantity_liters     REAL    NOT NULL DEFAULT 0,
    low_threshold       REAL    NOT NULL DEFAULT 5000,
    last_refill_liters  REAL,
    last_refill_date    DATETIME,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fuel_type_id)
);

-- ── Inventory refill history ─────────────────────────────────
CREATE TABLE IF NOT EXISTS refill_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    fuel_type_id    INTEGER NOT NULL REFERENCES fuel_types(id),
    quantity_liters REAL    NOT NULL,
    cost_per_liter  REAL,
    total_cost      REAL,
    supplier        TEXT,
    recorded_by     INTEGER REFERENCES users(id),
    refill_date     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Institutions (regular clients) ───────────────────────────
CREATE TABLE IF NOT EXISTS institutions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT NOT NULL,
    contact_person TEXT,
    phone          TEXT,
    address        TEXT,
    tax_number     TEXT,
    notes          TEXT,
    is_active      INTEGER DEFAULT 1,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Sales ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id       INTEGER NOT NULL REFERENCES users(id),
    fuel_type_id    INTEGER NOT NULL REFERENCES fuel_types(id),
    quantity_liters REAL    NOT NULL,
    price_per_liter REAL    NOT NULL,
    total_amount    REAL    NOT NULL,    -- in DA
    payment_method  TEXT    NOT NULL CHECK(payment_method IN ('cash','card','loyalty','credit')),
    institution_id  INTEGER REFERENCES institutions(id),
    pump_number     INTEGER NOT NULL,
    shift_date      DATE    NOT NULL,
    notes           TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Invoices ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number  TEXT    UNIQUE NOT NULL,
    institution_id  INTEGER REFERENCES institutions(id),
    total_amount    REAL    NOT NULL,   -- in DA
    tax_rate        REAL    DEFAULT 0.19,
    tax_amount      REAL    DEFAULT 0,
    net_amount      REAL    NOT NULL,
    status          TEXT    DEFAULT 'pending' CHECK(status IN ('pending','paid','cancelled')),
    created_by      INTEGER NOT NULL REFERENCES users(id),
    due_date        DATE,
    paid_at         DATETIME,
    notes           TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Invoice line items ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id      INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    fuel_type_id    INTEGER NOT NULL REFERENCES fuel_types(id),
    quantity_liters REAL    NOT NULL,
    price_per_liter REAL    NOT NULL,
    subtotal        REAL    NOT NULL
);

-- ── Messages (in-app chat) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id   INTEGER NOT NULL REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),     -- NULL = broadcast to all
    content     TEXT    NOT NULL,
    is_read     INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Payroll dates ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll_dates (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    pay_date    DATE    NOT NULL,
    description TEXT,
    created_by  INTEGER NOT NULL REFERENCES users(id),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sales_worker     ON sales(worker_id);
CREATE INDEX IF NOT EXISTS idx_sales_date       ON sales(shift_date);
CREATE INDEX IF NOT EXISTS idx_attendance_user  ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date  ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_messages_recv    ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender  ON messages(sender_id);
