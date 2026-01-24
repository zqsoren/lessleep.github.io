const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('server/database.db');

const columns = [
    'base_json TEXT',
    'user_desc TEXT',
    'advanced_settings TEXT',
    'aspect_ratio TEXT',
    'full_prompt TEXT'
];

db.serialize(() => {
    console.log('--- Starting Migration ---');
    columns.forEach(col => {
        const colName = col.split(' ')[0];
        console.log(`Checking column: ${colName}...`);

        // Try to add column
        db.run(`ALTER TABLE generation_records ADD COLUMN ${col}`, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log(`✅ Column ${colName} already exists.`);
                } else {
                    console.error(`❌ Failed to add ${colName}:`, err.message);
                }
            } else {
                console.log(`✨ Added column ${colName}`);
            }
        });
    });
});

setTimeout(() => {
    console.log('--- Checking Final Schema ---');
    db.all("PRAGMA table_info(generation_records)", (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
        db.close();
    });
}, 2000);
