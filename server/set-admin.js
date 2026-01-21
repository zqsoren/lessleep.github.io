import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Get username from command line arguments
const username = process.argv[2];

if (!username) {
    console.error('❌ 请提供用户名');
    console.log('用法: node set-admin.js <用户名>');
    console.log('示例: node set-admin.js admin');
    process.exit(1);
}

// Update user role to admin
db.run("UPDATE users SET role = 'admin' WHERE username = ?", [username], function (err) {
    if (err) {
        console.error('❌ 更新失败:', err);
        db.close();
        process.exit(1);
    }

    if (this.changes === 0) {
        console.log(`❌ 用户 "${username}" 不存在`);
        db.close();
        process.exit(1);
    }

    console.log(`✅ 用户 "${username}" 已设置为管理员`);

    // Verify the update
    db.get("SELECT id, username, email, role FROM users WHERE username = ?", [username], (err, row) => {
        if (err) {
            console.error('❌ 查询失败:', err);
        } else if (row) {
            console.log('📊 用户信息:', row);
        }

        db.close();
    });
});
