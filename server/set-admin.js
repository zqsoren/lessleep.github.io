import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Update user role to admin
db.run("UPDATE users SET role = 'admin' WHERE username = 'zhangqing'", (err) => {
    if (err) {
        console.error('Error updating user:', err);
    } else {
        console.log('✅ User zhangqing updated to admin');

        // Verify the update
        db.get("SELECT id, username, email, role FROM users WHERE username = 'zhangqing'", (err, row) => {
            if (err) {
                console.error('Error querying user:', err);
            } else if (row) {
                console.log('📊 User details:', row);
            } else {
                console.log('❌ User not found');
            }

            db.close();
        });
    }
});
