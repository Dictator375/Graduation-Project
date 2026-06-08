const Database = require('better-sqlite3');
const db = new Database('../database/station.db');

try {
  db.prepare('ALTER TABLE refill_history ADD COLUMN net_amount REAL').run();
  db.prepare('ALTER TABLE refill_history ADD COLUMN tax_rate REAL DEFAULT 0.19').run();
  db.prepare('ALTER TABLE refill_history ADD COLUMN tax_amount REAL').run();
  
  // Update existing data
  db.prepare('UPDATE refill_history SET net_amount = total_cost, tax_amount = 0, tax_rate = 0').run();
  console.log('Successfully updated refill_history schema');
} catch (err) {
  console.log('Error (might already exist):', err.message);
}
db.close();
