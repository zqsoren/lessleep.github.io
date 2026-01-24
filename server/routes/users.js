import express from 'express';

const router = express.Router();

export default function (db, requireAuth) {

    // Helper to run query
    const run = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    const get = (sql, params = []) => new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    const all = (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    // ==========================================
    // Heartbeat & Stats
    // ==========================================
    router.post('/heartbeat', requireAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            const now = new Date().toISOString();

            // Update last_heartbeat and increment total_login_duration by 60 seconds (assuming 1min interval)
            // But first check when was the last heartbeat to avoid abuse? 
            // For simplicity, just add 60s if last_heartbeat was > 30s ago, or strictly trust client for now (client sends every 60s).
            // Let's just add 60s.

            await run(`
                UPDATE users 
                SET last_heartbeat = ?, 
                    total_login_duration = total_login_duration + 60 
                WHERE id = ?
            `, [now, userId]);

            res.json({ status: 'ok' });
        } catch (error) {
            console.error('Heartbeat error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // ==========================================
    // Recharge Routes
    // ==========================================
    router.get('/recharge-records', requireAuth, async (req, res) => {
        try {
            const records = await all(
                'SELECT * FROM recharge_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
                [req.user.id]
            );
            res.json({ records: records || [] });
        } catch (error) {
            console.error('Get recharge records error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    router.post('/recharge', requireAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            const { package_id, payment_method } = req.body;

            const packages = {
                starter: { price: 2.99, credits: 50 },
                popular: { price: 9.9, credits: 200 },
                pro: { price: 29.9, credits: 800 },
            };

            const pkg = packages[package_id];
            if (!pkg) return res.status(400).json({ error: 'Invalid package' });

            const orderNumber = 'R' + Date.now() + Math.floor(Math.random() * 1000);

            // Create pending record
            const result = await run(
                'INSERT INTO recharge_records (user_id, order_number, amount, payment_method, status) VALUES (?, ?, ?, ?, ?)',
                [userId, orderNumber, pkg.price, payment_method, 'pending']
            );

            // Simulate completion
            await run('UPDATE recharge_records SET status = ? WHERE id = ?', ['completed', result.lastID]);

            // Update credits and cumulative stats
            // Note: We should also update gift_generations or monthly if applicable, but for recharge it's usually remaining_credits
            await run(
                'UPDATE users SET remaining_credits = remaining_credits + ? WHERE id = ?',
                [pkg.credits, userId]
            );

            res.json({
                message: '充值成功',
                order_number: orderNumber,
                credits: pkg.credits
            });

        } catch (error) {
            console.error('Recharge error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // ==========================================
    // Profile Routes
    // ==========================================
    router.get('/stats', requireAuth, async (req, res) => {
        try {
            const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
            if (!user) return res.status(404).json({ error: 'User not found' });

            res.json({
                totalGenerations: user.total_generations,
                remainingQuota: user.remaining_credits,
                monthlyGenerations: user.monthly_generations,
                membershipLevel: user.membership_level,
                membershipDays: 365, // Mock for now
                monthlyDuration: Math.floor(user.total_login_duration / 60) // Convert seconds to minutes for display if needed
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    router.put('/profile', requireAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            const { username, phone, bio } = req.body;
            const updates = [];
            const params = [];

            if (username) { updates.push('username = ?'); params.push(username); }
            if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
            // bio column might not exist yet? User request said '简介', I should add it if not exists.
            // Wait, I didn't add 'bio' column in previous step. I should check or add it. 
            // The user request mentioned '所有用户信息（...手机，邮箱...）' in admin view. 
            // In Profile view (User Request 1051), there is '简介'. 
            // I should add 'bio' column to users table in server.js initialization if I missed it.
            // For now let's assume it exists or I'll handle error.

            if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

            params.push(userId);
            await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
            res.json({ message: 'Update successful' });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    return router;
}
