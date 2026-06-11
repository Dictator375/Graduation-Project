const express   = require('express');
const { getDb } = require('../models/db');
const auth      = require('../middleware/auth');
const rbac      = require('../middleware/rbac');

const router = express.Router();

// ── Helper: get number of calendar days in a month ──────────
function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// ── Helper: calculate working days for a worker in a month ──
// Always caps at 30 for salary purposes.
// If hired mid-month, counts from hire_date to end of month (capped at 30).
function getWorkerDays(monthStr, hireDate) {
  const [year, month] = monthStr.split('-').map(Number);
  const calendarDays = Math.min(daysInMonth(year, month), 30); // cap at 30
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd   = new Date(year, month - 1, calendarDays);

  if (!hireDate) return { totalDays: calendarDays, isProrated: false };

  const hire = new Date(hireDate);
  // Hired before this month → full month
  if (hire < monthStart) return { totalDays: calendarDays, isProrated: false };
  // Hired after this month → 0 days
  if (hire > monthEnd) return { totalDays: 0, isProrated: true };
  // Hired during this month → days from hire to end of month
  const hireDay = hire.getDate();
  const daysFromHire = calendarDays - hireDay + 1;
  return { totalDays: Math.max(0, daysFromHire), isProrated: true };
}

// ──────────────────────────────────────────────────────────────
// GET /api/payroll?month=YYYY-MM
// Manager: get payroll report for all workers for a given month
// ──────────────────────────────────────────────────────────────
router.get('/', auth, rbac('manager'), (req, res) => {
  const db    = getDb();
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  const rows = db.prepare(`
    SELECT pr.*, u.full_name, u.full_name_ar, u.role, u.hire_date,
           t.name_ar as team_name
    FROM payroll_records pr
    JOIN users u ON u.id = pr.user_id
    LEFT JOIN teams t ON t.id = u.team_id
    WHERE pr.month = ?
    ORDER BY u.full_name
  `).all(month);

  // Summary totals
  const summary = {
    total_base:      rows.reduce((s, r) => s + r.base_salary, 0),
    total_net:       rows.reduce((s, r) => s + r.net_salary, 0),
    total_deduction: rows.reduce((s, r) => s + r.deduction, 0),
    worker_count:    rows.length,
  };

  res.json({ records: rows, summary, month });
});

// ──────────────────────────────────────────────────────────────
// POST /api/payroll/generate  { month: 'YYYY-MM' }
// Manager: calculate & upsert payroll records for a month
// ──────────────────────────────────────────────────────────────
router.post('/generate', auth, rbac('manager'), (req, res) => {
  const { month } = req.body;
  if (!month || !/^\d{4}-\d{2}$/.test(month))
    return res.status(400).json({ error: 'month required in YYYY-MM format' });

  const db = getDb();

  // Get all active workers (non-managers)
  const workers = db.prepare(`
    SELECT id, salary, hire_date FROM users
    WHERE is_active = 1 AND role != 'manager'
  `).all();

  const upsert = db.prepare(`
    INSERT INTO payroll_records
      (user_id, month, base_salary, daily_rate, total_days, days_worked, days_absent, deduction, net_salary, is_prorated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, month) DO UPDATE SET
      base_salary  = excluded.base_salary,
      daily_rate   = excluded.daily_rate,
      total_days   = excluded.total_days,
      days_worked  = excluded.days_worked,
      days_absent  = excluded.days_absent,
      deduction    = excluded.deduction,
      net_salary   = excluded.net_salary,
      is_prorated  = excluded.is_prorated,
      generated_at = CURRENT_TIMESTAMP
  `);

  const results = [];

  const generate = db.transaction(() => {
    for (const w of workers) {
      const baseSalary = w.salary || 0;
      const dailyRate  = baseSalary / 30; // always divide by 30

      const { totalDays, isProrated } = getWorkerDays(month, w.hire_date);

      if (totalDays <= 0) continue; // worker not yet hired

      // Count absent days from attendance records for this month
      const absentRow = db.prepare(`
        SELECT COUNT(*) as cnt FROM attendance
        WHERE user_id = ? AND date LIKE ? AND status = 'absent'
      `).get(w.id, month + '%');

      const daysAbsent = Math.min(absentRow.cnt, totalDays);
      const daysWorked = totalDays - daysAbsent;
      const deduction  = Math.round(dailyRate * daysAbsent * 100) / 100;
      const netSalary  = Math.round(dailyRate * daysWorked * 100) / 100;

      upsert.run(
        w.id, month, baseSalary, Math.round(dailyRate * 100) / 100,
        totalDays, daysWorked, daysAbsent,
        deduction, netSalary, isProrated ? 1 : 0
      );

      results.push({
        user_id: w.id, base_salary: baseSalary, daily_rate: dailyRate,
        total_days: totalDays, days_worked: daysWorked, days_absent: daysAbsent,
        deduction, net_salary: netSalary, is_prorated: isProrated,
      });
    }
  });

  generate();
  res.json({ message: `Payroll generated for ${results.length} workers`, count: results.length, month });
});

// ──────────────────────────────────────────────────────────────
// GET /api/payroll/my?month=YYYY-MM
// Worker: see their own payroll summary + attendance breakdown
// ──────────────────────────────────────────────────────────────
router.get('/my', auth, (req, res) => {
  const db    = getDb();
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  // Get payroll record if generated
  const record = db.prepare(`
    SELECT * FROM payroll_records WHERE user_id = ? AND month = ?
  `).get(req.user.id, month);

  // Get attendance breakdown for this month
  const attendance = db.prepare(`
    SELECT date, status, check_in, check_out, notes
    FROM attendance WHERE user_id = ? AND date LIKE ?
    ORDER BY date
  `).all(req.user.id, month + '%');

  const counts = { present: 0, absent: 0, late: 0, excused: 0 };
  attendance.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });

  // If no payroll record yet, calculate an estimate
  let estimate = null;
  if (!record) {
    const user = db.prepare('SELECT salary, hire_date FROM users WHERE id = ?').get(req.user.id);
    if (user && user.salary) {
      const dailyRate = user.salary / 30;
      const { totalDays, isProrated } = getWorkerDays(month, user.hire_date);
      const daysAbsent = Math.min(counts.absent, totalDays);
      const daysWorked = totalDays - daysAbsent;
      estimate = {
        base_salary: user.salary,
        daily_rate:  Math.round(dailyRate * 100) / 100,
        total_days:  totalDays,
        days_worked: daysWorked,
        days_absent: daysAbsent,
        deduction:   Math.round(dailyRate * daysAbsent * 100) / 100,
        net_salary:  Math.round(dailyRate * daysWorked * 100) / 100,
        is_prorated: isProrated,
      };
    }
  }

  // Next pay date: always the 1st of the next month
  const [y, m] = month.split('-').map(Number);
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  const nextPayDate = `${nextMonth}-01`;

  res.json({
    record: record || null,
    estimate,
    attendance,
    counts,
    month,
    next_pay_date: nextPayDate,
  });
});

// ──────────────────────────────────────────────────────────────
// GET /api/payroll/report/:userId?month=YYYY-MM
// Manager: detailed attendance breakdown for one worker
// ──────────────────────────────────────────────────────────────
router.get('/report/:userId', auth, rbac('manager'), (req, res) => {
  const db     = getDb();
  const userId = parseInt(req.params.userId);
  const month  = req.query.month || new Date().toISOString().slice(0, 7);

  const user = db.prepare(`
    SELECT id, full_name, full_name_ar, role, salary, hire_date, team_id
    FROM users WHERE id = ?
  `).get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const record = db.prepare(`
    SELECT * FROM payroll_records WHERE user_id = ? AND month = ?
  `).get(userId, month);

  const attendance = db.prepare(`
    SELECT date, status, check_in, check_out, notes
    FROM attendance WHERE user_id = ? AND date LIKE ?
    ORDER BY date
  `).all(userId, month + '%');

  const counts = { present: 0, absent: 0, late: 0, excused: 0 };
  attendance.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });

  res.json({ user, record, attendance, counts, month });
});

module.exports = router;
