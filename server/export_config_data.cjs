const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);
const exportPath = path.join(__dirname, 'config_export.json');

console.log('📤 Exporting Local Config Data...');

const tablesToExport = [
    'prompt_categories',
    'prompt_subtypes',
    'prompt_styles',
    'advanced_settings',
    'prompt_templates'
];

const exportData = {};

let completed = 0;

db.serialize(() => {
    tablesToExport.forEach(table => {
        db.all(`SELECT * FROM ${table}`, (err, rows) => {
            if (err) {
                console.error(`❌ Error reading ${table}:`, err.message);
                // Continue despite error, maybe table doesn't exist locally?
                exportData[table] = [];
            } else {
                console.log(`✅ Read ${rows.length} rows from ${table}`);
                exportData[table] = rows;
            }

            completed++;
            if (completed === tablesToExport.length) {
                fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
                console.log(`\n🎉 Data exported to ${exportPath}`);
                console.log('👉 Upload this file AND import_config_data.cjs to your server.');
                db.close();
            }
        });
    });
});
