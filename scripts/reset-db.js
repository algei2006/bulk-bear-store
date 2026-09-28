// Reset database (drop and recreate)
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db', 'bulk-bear.db');
const walPath = dbPath + '-wal';
const shmPath = dbPath + '-shm';

[dbPath, walPath, shmPath].forEach(p => {
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`Deleted: ${p}`);
  }
});

console.log('✓ Database reset. Run "npm run seed" to reinitialize.');