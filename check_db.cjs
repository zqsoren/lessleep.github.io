const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('server/database.db');

db.serialize(() => {
    console.log('--- generation_records Schema ---');
    db.all("PRAGMA table_info(generation_records)", (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
    });

    console.log('\n--- users Schema ---');
    db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
    });
});

setTimeout(() => db.close(), 1000);
