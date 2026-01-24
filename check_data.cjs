const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('server/database.db');

db.get("SELECT * FROM generation_records WHERE id = 3", (err, row) => {
    if (err) {
        console.error("Error:", err);
    } else {
        console.log("Record ID 3:");
        console.log(JSON.stringify(row, null, 2));
    }
    db.close();
});
