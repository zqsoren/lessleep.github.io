const sqlite3 = require('sqlite3').verbose();
const path = require('path');



const dbPath = path.join(__dirname, 'server/database.db'); // server.js uses join(__dirname, 'database.db') where __dirname is server/
// Running from root, so server/database.db

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
        return;
    }
    console.log('Connected to database');
});

console.log('--- Checking advanced_settings table ---');
db.all('SELECT * FROM advanced_settings', [], (err, rows) => {
    if (err) {
        console.error('Error querying advanced_settings:', err);
        return;
    }
    console.log(`Found ${rows.length} rows.`);
    rows.forEach(row => {
        console.log(`[Row] StyleID: '${row.style_id}', Published: ${row.is_published}, Updated: ${row.updated_at}`);
        // console.log(`Config: ${row.config_json}`);
    });
});
