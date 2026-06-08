const Database = require('better-sqlite3');
const db = new Database('../database/station.db');

try {
  db.prepare('ALTER TABLE inventory ADD COLUMN capacity REAL NOT NULL DEFAULT 50000').run();
  console.log('Migration successful.');
} catch (err) {
  console.log('Migration failed or already applied:', err.message);
}
db.close();
