-- ============================================================
--  Seed Data — Run AFTER schema.sql
--  Manager default password: Admin@1234
-- ============================================================

-- Teams
INSERT OR IGNORE INTO teams (id, name, name_ar, type) VALUES
(1, 'Morning Team',   'فريق الصباح',    'morning'),
(2, 'Afternoon Team', 'فريق المساء',    'afternoon'),
(3, 'Night Team',     'فريق الليل',     'night'),
(4, 'Reserve Team',   'فريق الاحتياط', 'reserve');

-- Fuel types (prices in Algerian Dinar DA)
INSERT OR IGNORE INTO fuel_types (id, name, name_ar, price_per_liter) VALUES
(1, 'Unleaded 95', 'بنزين عادي 95',  47.50),
(2, 'Unleaded 98', 'بنزين ممتاز 98', 55.00),
(3, 'Diesel',      'مازوت',           22.00),
(4, 'GPL',         'غاز البترول',     11.00);

-- Manager account
-- Password hash for "Admin@1234" using bcrypt rounds=10
-- This hash is generated at first-run by server.js if users table is empty
INSERT OR IGNORE INTO users
    (id, full_name, full_name_ar, username, password_hash, role)
VALUES
    (1, 'Station Manager', 'مدير المحطة', 'admin',
     '$2b$10$K7OsA.Ub1w2Qa0XU5v5Nf.Xm7IhTjU3tPMPKLWL.YKXF6aHFJ8Oy',
     'manager');

-- Initial inventory (litres)
INSERT OR IGNORE INTO inventory (fuel_type_id, quantity_liters, low_threshold) VALUES
(1, 20000, 5000),
(2,  8000, 2000),
(3, 25000, 6000),
(4, 15000, 4000);

-- Sample payroll dates
INSERT OR IGNORE INTO payroll_dates (pay_date, description, created_by) VALUES
('2026-05-30', 'رواتب شهر ماي 2026',   1),
('2026-06-30', 'رواتب شهر جوان 2026',  1),
('2026-07-31', 'رواتب شهر جويلية 2026', 1);
