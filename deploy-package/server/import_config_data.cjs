const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.db');
const importPath = path.join(__dirname, 'config_export.json');

if (!fs.existsSync(importPath)) {
    console.error('❌ config_export.json not found! Please upload it first.');
    process.exit(1);
}

const db = new sqlite3.Database(dbPath);
const data = JSON.parse(fs.readFileSync(importPath, 'utf8'));

console.log('📥 Starting Config Data Import...');

db.serialize(() => {
    // Disable foreign keys temporarily to avoid constraint issues during bulk insert
    db.run("PRAGMA foreign_keys = OFF;");

    db.run("BEGIN TRANSACTION;");

    Object.keys(data).forEach(tableName => {
        const rows = data[tableName];
        if (!rows || rows.length === 0) return;

        console.log(`Processing ${tableName} (${rows.length} rows)...`);

        // 1. Clear existing data in config tables (Optional: Decide if we want to wiping or upserting. 
        // Wiping is safer for "Sync" logic to avoid zombie entries.)
        db.run(`DELETE FROM ${tableName}`, (err) => {
            if (err) console.error(`  Warning clearing ${tableName}:`, err.message);
        });

        // 2. Insert new data
        const stmt = db.prepare(`INSERT OR REPLACE INTO ${tableName} (${Object.keys(rows[0]).join(',')}) VALUES (${Object.keys(rows[0]).map(() => '?').join(',')})`);

        rows.forEach(row => {
            stmt.run(Object.values(row), (err) => {
                if (err) console.error(`  Error inserting into ${tableName}:`, err.message);
            });
        });

        stmt.finalize();
        console.log(`  ✅ Imported ${tableName}`);
    });

    db.run("COMMIT;", (err) => {
        if (err) {
            console.error('❌ Transaction failed:', err);
            db.run("ROLLBACK;");
        } else {
            console.log('🎉 Import completed successfully!');
        }
        db.close();
    });
});
