const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Starting Database Schema Migration...');

db.serialize(() => {
    // 1. Create advanced_settings table if not exists
    console.log('Checking advanced_settings table...');
    db.run(`
        CREATE TABLE IF NOT EXISTS advanced_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            style_id TEXT NOT NULL UNIQUE,
            config_json TEXT NOT NULL,
            is_published INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (style_id) REFERENCES prompt_styles(id)
        )
    `, (err) => {
        if (err) console.error('❌ Error creating advanced_settings:', err.message);
        else console.log('✅ advanced_settings table ready.');
    });

    // 2. Add columns to generation_records
    const genCols = [
        'base_json TEXT',
        'user_desc TEXT',
        'advanced_settings TEXT',
        'aspect_ratio TEXT',
        'full_prompt TEXT'
    ];

    console.log('Checking generation_records columns...');
    genCols.forEach(col => {
        const colName = col.split(' ')[0];
        db.run(`ALTER TABLE generation_records ADD COLUMN ${col}`, (err) => {
            if (err && err.message.includes('duplicate column name')) {
                console.log(`  - Column ${colName} already exists.`);
            } else if (err) {
                console.error(`❌ Error adding column ${colName}:`, err.message);
            } else {
                console.log(`✅ Added column ${colName} to generation_records.`);
            }
        });
    });

    // 3. Add columns to users (Just in case server is old version)
    const userCols = [
        'role TEXT DEFAULT "user"',
        'phone TEXT',
        'status TEXT DEFAULT "active"',
        'last_login DATETIME',
        'total_generations INTEGER DEFAULT 0',
        'monthly_generations INTEGER DEFAULT 0',
        'remaining_credits INTEGER DEFAULT 100',
        'total_login_duration INTEGER DEFAULT 0',
        'last_heartbeat DATETIME',
        'membership_level TEXT DEFAULT "free"',
        'monthly_remaining_generations INTEGER DEFAULT 100',
        'gift_generations INTEGER DEFAULT 0'
    ];

    console.log('Checking users columns...');
    userCols.forEach(col => {
        const colName = col.split(' ')[0];
        db.run(`ALTER TABLE users ADD COLUMN ${col}`, (err) => {
            if (err && err.message.includes('duplicate column name')) {
                // Silent skip for clarity
            } else if (err) {
                console.error(`❌ Error adding column ${colName}:`, err.message);
            } else {
                console.log(`✅ Added column ${colName} to users.`);
            }
        });
    });

    // 4. Create prompt_templates if not exists
    db.run(`
        CREATE TABLE IF NOT EXISTS prompt_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id TEXT NOT NULL,
            subtype_id TEXT NOT NULL,
            style_id TEXT NOT NULL,
            style_name TEXT NOT NULL,
            prompt TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_by INTEGER,
            FOREIGN KEY (updated_by) REFERENCES users(id)
        )
    `, (err) => {
        if (err) console.error('❌ Error creating prompt_templates:', err.message);
        else console.log('✅ prompt_templates table ready.');
    });

});

db.close(() => {
    console.log('🏁 Migration process completed. Press any key to exit...');
});
