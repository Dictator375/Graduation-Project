const Database = require('better-sqlite3');
const db = new Database('../database/station.db');

try {
  db.prepare('UPDATE inventory SET capacity = 30000').run();
  console.log('Capacity updated successfully.');
} catch (err) {
  console.log('Error updating capacity:', err.message);
}
db.close();
